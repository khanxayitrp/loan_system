import { laoTelecomService } from './laotelecom.service';
import { logger } from '../utils/logger';
import { formatPhoneNumber, isValidLaoPhoneNumber } from '../utils/otp'; // ยืมฟังก์ชันฟอร์แมตเบอร์โทรมาจาก OTP utils
import { db } from '../models/init-models'; // ถ้าต้องการเข้าถึงฐานข้อมูล (เช่น ดึงเบอร์โทรจากลูกค้า)
import redisService from './redis.service';
import { Op, Transaction } from 'sequelize';
import { CreateNotificationInput, RecipientType } from '../types/notification';

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
    public async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
        try {
            // 1. ตรวจสอบความถูกต้องของเบอร์โทร
            if (!isValidLaoPhoneNumber(phoneNumber)) {
                logger.warn(`[NotificationService] Invalid phone number format: ${phoneNumber}`);
                return false;
            }

            // 2. ฟอร์แมตเบอร์ให้ตรงกับรูปแบบที่ Lao Telecom ต้องการ (เช่น +85620...)
            const formattedPhone = formatPhoneNumber(phoneNumber);

            logger.info(`[NotificationService] Sending SMS to ${formattedPhone}...`);

            // 3. เรียกใช้ LaoTelecom Service เพื่อส่งข้อความ
            // หมายเหตุ: สามารถส่ง senderId (เช่น 'INSEE') และ transactionId เป็น parameter ที่ 3 และ 4 ได้ถ้ามี
            const smsResult = await laoTelecomService.sendSMS(formattedPhone, message);

            if (smsResult.status === 'success') {
                logger.info(`[NotificationService] SMS sent successfully to ${formattedPhone}. Message ID: ${smsResult.messageId}`);
                return true;
            } else {
                logger.error(`[NotificationService] Failed to send SMS to ${formattedPhone}. Error: ${smsResult.errorMessage}`);
                return false;
            }

        } catch (error) {
            logger.error(`[NotificationService] Critical error sending SMS to ${phoneNumber}: ${(error as Error).message}`);
            return false;
        }
    }

    // อนาคตถ้ามี Push Notification (Firebase) สามารถสร้างฟังก์ชันเผื่อไว้ตรงนี้ได้
    // public async sendPushNotification(fcmToken: string, title: string, body: string) { ... }
    // 🌟 1. ฟังก์ชันส่งการแจ้งเตือน (สร้างใหม่)
    public async sendNotification(payload: CreateNotificationInput, transaction?: Transaction){
        try {
            // 1.1 บันทึกลง Database
        const notification = await db.notifications.create({
            ...payload,
            data: payload.data ? payload.data : undefined,
            created_at: new Date()
        } as any, { transaction });

        // 1.2 เพิ่มยอด Unread Count ใน Redis (เพื่อให้แอปดึงตัวเลขไปโชว์ได้ไวๆ)
        const redisKey = `unread_count:${payload.recipient_type}:${payload.recipient_id}`;
        await redisService.incr(redisKey); // บวก 1 อัตโนมัติ

        // 1.3 (Option) โยนเข้า Message Queue (เช่น BullMQ) เพื่อให้ Worker ไปยิง Firebase (FCM) ต่อ
        // await pushNotificationQueue.add('send_push', { notificationId: notification.id, payload });

        return notification;
        } catch (error) {
            logger.error(`[NotificationService] Failed to send notification: ${(error as Error).message}`);
            throw error;
        }
        
    }

    // 🌟 2. ดึงรายการแจ้งเตือน (พร้อม Pagination)
    public async getNotifications(recipient_type: RecipientType, recipient_id: number, page: number = 1, limit: number = 20) {

        const offset = (page - 1) * limit;
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const notifications = await db.notifications.findAndCountAll({
            where: { recipient_type, recipient_id, created_at: { [Op.gte]: ninetyDaysAgo } },
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
    public async markAsRead(notification_id: number, recipient_type: RecipientType, recipient_id: number) {
        const notification = await db.notifications.findOne({
            where: { 
                id: notification_id, 
                recipient_type: recipient_type, 
                recipient_id: recipient_id, 
                read_at: null 
            } as any
        });

        if (!notification) return null; // ไม่มี หรืออ่านไปแล้ว

        // อัปเดตเวลาที่อ่าน
        notification.read_at = new Date();
        await notification.save();

        // ลดจำนวน Unread ใน Redis
        const redisKey = `unread_count:${recipient_type}:${recipient_id}`;
        const currentCount = await redisService.get(redisKey);
        if (Number(currentCount) > 0) {
            await redisService.decr(redisKey); // ลบ 1 อัตโนมัติ
        }

        return notification;
    }

    // 🌟 4. ดึงจำนวนที่ยังไม่ได้อ่าน (Unread Count)
    public async getUnreadCount(recipient_type: RecipientType, recipient_id: number) {
        const redisKey = `unread_count:${recipient_type}:${recipient_id}`;
        let count: string | number | null = await redisService.get(redisKey);

        // ถ้า Redis ไม่มีค่า (Cache Miss) ให้ไปนับจาก DB แล้วเซ็ตกลับลง Redis
        if (count === null) {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            const dbCount = await db.notifications.count({
                where: { 
                    recipient_type: recipient_type, 
                    recipient_id: recipient_id, 
                    read_at: null,
                    created_at: { [Op.gte]: ninetyDaysAgo }
                } as any
            });
            await redisService.set(redisKey, dbCount.toString(), 86400); // เก็บไว้ 1 วัน
            return Number(dbCount);
        }

        return Number(count);
    }
}

export default new NotificationService();