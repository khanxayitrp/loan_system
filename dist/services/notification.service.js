"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const laotelecom_service_1 = require("./laotelecom.service");
const logger_1 = require("../utils/logger");
const otp_1 = require("../utils/otp"); // ยืมฟังก์ชันฟอร์แมตเบอร์โทรมาจาก OTP utils
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
}
exports.default = new NotificationService();
