"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const laotelecom_service_1 = require("./laotelecom.service");
const logger_1 = require("../utils/logger");
const otp_1 = require("../utils/otp"); // ยืมฟังก์ชันฟอร์แมตเบอร์โทรมาจาก OTP utils
const init_models_1 = require("../models/init-models"); // ถ้าต้องการเข้าถึงฐานข้อมูล (เช่น ดึงเบอร์โทรจากลูกค้า)
const redis_service_1 = __importDefault(require("./redis.service"));
const sequelize_1 = require("sequelize");
// export interface SendNotificationDTO {
//     recipient_type: 'CUSTOMER' | 'STAFF';
//     recipient_id: number;
//     event_type: string;
//     title: string;
//     body: string;
//     reference_type?: string;
//     reference_id?: number;
//     data?: any; // JSON object
// }
class NotificationService {
    /**
     * ส่ง SMS แจ้งเตือน (Reminder / General Notification)
     * @param phoneNumber เบอร์โทรศัพท์ลูกค้า (เช่น '020xxxx', '20xxxx')
     * @param message ข้อความที่จะส่ง
     * @returns Boolean (true = สำเร็จ, false = ล้มเหลว)
     */
    async sendSMS(phoneNumber, message) {
        try {
            // 1. ตรวจสอบความถูกต้องของเบอร์โทร
            if (!(0, otp_1.isValidLaoPhoneNumber)(phoneNumber)) {
                logger_1.logger.warn(`[NotificationService] Invalid phone number format: ${phoneNumber}`);
                return false;
            }
            // 2. ฟอร์แมตเบอร์ให้ตรงกับรูปแบบที่ Lao Telecom ต้องการ (เช่น +85620...)
            const formattedPhone = (0, otp_1.formatPhoneNumber)(phoneNumber);
            logger_1.logger.info(`[NotificationService] Sending SMS to ${formattedPhone}...`);
            // 3. เรียกใช้ LaoTelecom Service เพื่อส่งข้อความ
            // หมายเหตุ: สามารถส่ง senderId (เช่น 'INSEE') และ transactionId เป็น parameter ที่ 3 และ 4 ได้ถ้ามี
            const smsResult = await laotelecom_service_1.laoTelecomService.sendSMS(formattedPhone, message);
            if (smsResult.status === 'success') {
                logger_1.logger.info(`[NotificationService] SMS sent successfully to ${formattedPhone}. Message ID: ${smsResult.messageId}`);
                return true;
            }
            else {
                logger_1.logger.error(`[NotificationService] Failed to send SMS to ${formattedPhone}. Error: ${smsResult.errorMessage}`);
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error(`[NotificationService] Critical error sending SMS to ${phoneNumber}: ${error.message}`);
            return false;
        }
    }
    // อนาคตถ้ามี Push Notification (Firebase) สามารถสร้างฟังก์ชันเผื่อไว้ตรงนี้ได้
    // public async sendPushNotification(fcmToken: string, title: string, body: string) { ... }
    // 🌟 1. ฟังก์ชันส่งการแจ้งเตือน (สร้างใหม่)
    async sendNotification(payload, transaction) {
        try {
            // 1.1 บันทึกลง Database
            const notification = await init_models_1.db.notifications.create({
                ...payload,
                data: payload.data ? payload.data : undefined,
                created_at: new Date()
            }, { transaction });
            // 1.2 เพิ่มยอด Unread Count ใน Redis (เพื่อให้แอปดึงตัวเลขไปโชว์ได้ไวๆ)
            const redisKey = `unread_count:${payload.recipient_type}:${payload.recipient_id}`;
            await redis_service_1.default.incr(redisKey); // บวก 1 อัตโนมัติ
            // 1.3 (Option) โยนเข้า Message Queue (เช่น BullMQ) เพื่อให้ Worker ไปยิง Firebase (FCM) ต่อ
            // await pushNotificationQueue.add('send_push', { notificationId: notification.id, payload });
            return notification;
        }
        catch (error) {
            logger_1.logger.error(`[NotificationService] Failed to send notification: ${error.message}`);
            throw error;
        }
    }
    // 🌟 2. ดึงรายการแจ้งเตือน (พร้อม Pagination)
    async getNotifications(recipient_type, recipient_id, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const notifications = await init_models_1.db.notifications.findAndCountAll({
            where: { recipient_type, recipient_id, created_at: { [sequelize_1.Op.gte]: ninetyDaysAgo } },
            order: [['created_at', 'DESC']], // เรียงจากใหม่ไปเก่า
            limit,
            offset,
            raw: true // ดึงข้อมูลแบบ raw เพื่อให้ได้รูปแบบง่ายๆ (ไม่ต้องแปลงเป็น Model instance)
        });
        return {
            data: notifications.rows,
            total: notifications.count,
            current_page: page,
            total_pages: Math.ceil(notifications.count / limit)
        };
    }
    // 🌟 3. อัปเดตสถานะ "อ่านแล้ว"
    async markAsRead(notification_id, recipient_type, recipient_id) {
        const notification = await init_models_1.db.notifications.findOne({
            where: {
                id: notification_id,
                recipient_type: recipient_type,
                recipient_id: recipient_id,
                read_at: null
            }
        });
        if (!notification)
            return null; // ไม่มี หรืออ่านไปแล้ว
        // อัปเดตเวลาที่อ่าน
        notification.read_at = new Date();
        await notification.save();
        // ลดจำนวน Unread ใน Redis
        const redisKey = `unread_count:${recipient_type}:${recipient_id}`;
        const currentCount = await redis_service_1.default.get(redisKey);
        if (Number(currentCount) > 0) {
            await redis_service_1.default.decr(redisKey); // ลบ 1 อัตโนมัติ
        }
        return notification;
    }
    // 🌟 4. ดึงจำนวนที่ยังไม่ได้อ่าน (Unread Count)
    async getUnreadCount(recipient_type, recipient_id) {
        const redisKey = `unread_count:${recipient_type}:${recipient_id}`;
        let count = await redis_service_1.default.get(redisKey);
        // ถ้า Redis ไม่มีค่า (Cache Miss) ให้ไปนับจาก DB แล้วเซ็ตกลับลง Redis
        if (count === null) {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const dbCount = await init_models_1.db.notifications.count({
                where: {
                    recipient_type: recipient_type,
                    recipient_id: recipient_id,
                    read_at: null,
                    created_at: { [sequelize_1.Op.gte]: ninetyDaysAgo }
                }
            });
            await redis_service_1.default.set(redisKey, dbCount.toString(), 86400); // เก็บไว้ 1 วัน
            return Number(dbCount);
        }
        return Number(count);
    }
}
exports.default = new NotificationService();
