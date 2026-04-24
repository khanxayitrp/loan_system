import { laoTelecomService } from './laotelecom.service';
import { logger } from '../utils/logger';
import { formatPhoneNumber, isValidLaoPhoneNumber } from '../utils/otp'; // ยืมฟังก์ชันฟอร์แมตเบอร์โทรมาจาก OTP utils

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
}

export default new NotificationService();