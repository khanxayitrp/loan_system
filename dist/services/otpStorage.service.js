"use strict";
// import { smsConfig } from '../config/sms.config';
// import { OTPData } from '../types/sms.types';
// import { logger } from '../utils/logger';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpStorageService = exports.OTPStorageService = void 0;
// /**
//  * In-memory OTP storage service
//  * For production, consider using Redis or database
//  */
// export class OTPStorageService {
//   private static instance: OTPStorageService;
//   private otpStore: Map<string, OTPData> = new Map();
//   private constructor() {
//     // Clean up expired OTPs every minute
//     setInterval(() => this.cleanupExpiredOTPs(), 60000);
//   }
//   public static getInstance(): OTPStorageService {
//     if (!OTPStorageService.instance) {
//       OTPStorageService.instance = new OTPStorageService();
//     }
//     return OTPStorageService.instance;
//   }
//   /**
//    * Store OTP data
//    */
//   public async store(phoneNumber: string, otp: string): Promise<void> {
//     const now = new Date();
//     const expiresAt = new Date(now.getTime() + smsConfig.otp.expiryMinutes * 60000);
//     const otpData: OTPData = {
//       phoneNumber,
//       otp,
//       createdAt: now,
//       expiresAt,
//       attempts: 0,
//       verified: false,
//     };
//     this.otpStore.set(phoneNumber, otpData);
//     logger.debug('OTP stored', { phoneNumber, expiresAt });
//   }
//   /**
//    * Get OTP data for phone number
//    */
//   public async get(phoneNumber: string): Promise<OTPData | null> {
//     const otpData = this.otpStore.get(phoneNumber);
//     if (!otpData) {
//       return null;
//     }
//     // Check if expired
//     if (new Date() > otpData.expiresAt) {
//       this.otpStore.delete(phoneNumber);
//       logger.debug('OTP expired and removed', { phoneNumber });
//       return null;
//     }
//     return otpData;
//   }
//   /**
//    * Verify OTP and increment attempts
//    */
//   public async verify(phoneNumber: string, otp: string): Promise<boolean> {
//     const otpData = await this.get(phoneNumber);
//     if (!otpData) {
//       logger.warn('OTP not found or expired', { phoneNumber });
//       return false;
//     }
//     // Increment attempts
//     otpData.attempts++;
//     // Check max attempts
//     if (otpData.attempts > smsConfig.otp.maxAttempts!) {
//       this.otpStore.delete(phoneNumber);
//       logger.warn('Max OTP attempts exceeded', { phoneNumber });
//       return false;
//     }
//     // Verify OTP
//     if (otpData.otp === otp) {
//       otpData.verified = true;
//       this.otpStore.set(phoneNumber, otpData);
//       logger.info('OTP verified successfully', { phoneNumber });
//       return true;
//     }
//     // Update attempts
//     this.otpStore.set(phoneNumber, otpData);
//     logger.warn('Invalid OTP attempt', {
//       phoneNumber,
//       attempts: otpData.attempts,
//     });
//     return false;
//   }
//   /**
//    * Delete OTP data
//    */
//   public async delete(phoneNumber: string): Promise<void> {
//     this.otpStore.delete(phoneNumber);
//     logger.debug('OTP deleted', { phoneNumber });
//   }
//   /**
//    * Get remaining attempts
//    */
//   public async getRemainingAttempts(phoneNumber: string): Promise<number> {
//     const otpData = await this.get(phoneNumber);
//     if (!otpData) {
//       return smsConfig.otp.maxAttempts || 0;
//     }
//     return Math.max(0, (smsConfig.otp.maxAttempts || 0) - otpData.attempts);
//   }
//   /**
//    * Check if OTP is verified
//    */
//   public async isVerified(phoneNumber: string): Promise<boolean> {
//     const otpData = await this.get(phoneNumber);
//     return otpData?.verified || false;
//   }
//   /**
//    * Cleanup expired OTPs
//    */
//   private cleanupExpiredOTPs(): void {
//     const now = new Date();
//     let cleanedCount = 0;
//     for (const [phoneNumber, otpData] of this.otpStore.entries()) {
//       if (now > otpData.expiresAt) {
//         this.otpStore.delete(phoneNumber);
//         cleanedCount++;
//       }
//     }
//     if (cleanedCount > 0) {
//       logger.debug('Cleaned up expired OTPs', { count: cleanedCount });
//     }
//   }
//   /**
//    * Get storage statistics
//    */
//   public getStats(): { total: number; verified: number; expired: number } {
//     const now = new Date();
//     let verified = 0;
//     let expired = 0;
//     for (const otpData of this.otpStore.values()) {
//       if (otpData.verified) verified++;
//       if (now > otpData.expiresAt) expired++;
//     }
//     return {
//       total: this.otpStore.size,
//       verified,
//       expired,
//     };
//   }
// }
// export const otpStorageService = OTPStorageService.getInstance();
const sms_config_1 = require("../config/sms.config");
const logger_1 = require("../utils/logger");
const redis_service_1 = __importDefault(require("./redis.service")); // 🟢 อย่าลืมเช็ค Path ให้ชี้ไปที่ไฟล์ RedisService ของคุณ
/**
 * Redis-based OTP storage service
 */
class OTPStorageService {
    constructor() {
        this.keyPrefix = 'otp:'; // ใช้ Prefix จัดระเบียบ Key ใน Redis
        // 🗑️ ไม่ต้องใช้ setInterval เพื่อ cleanup แล้ว เพราะ Redis มีระบบ TTL (Time-To-Live) จัดการให้
    }
    static getInstance() {
        if (!OTPStorageService.instance) {
            OTPStorageService.instance = new OTPStorageService();
        }
        return OTPStorageService.instance;
    }
    getKey(phoneNumber) {
        return `${this.keyPrefix}${phoneNumber}`;
    }
    /**
     * Store OTP data
     */
    async store(phoneNumber, otp) {
        const now = new Date();
        // คำนวณ TTL (เป็นวินาที)
        const ttlSeconds = sms_config_1.smsConfig.otp.expiryMinutes * 60;
        const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
        const otpData = {
            phoneNumber,
            otp,
            createdAt: now,
            expiresAt,
            attempts: 0,
            verified: false,
        };
        // 🟢 เรียกใช้เมธอด set ของ redisService พร้อมตั้งเวลาหมดอายุ
        await redis_service_1.default.set(this.getKey(phoneNumber), JSON.stringify(otpData), ttlSeconds);
        logger_1.logger.debug('OTP stored in Redis', { phoneNumber, expiresAt });
    }
    /**
     * Get OTP data for phone number
     */
    async get(phoneNumber) {
        // 🟢 เรียกใช้เมธอด get ของ redisService
        const dataStr = await redis_service_1.default.get(this.getKey(phoneNumber));
        if (!dataStr) {
            return null;
        }
        // แปลง JSON String กลับเป็น Object และแปลง Date string ให้กลับเป็น Date object
        const otpData = JSON.parse(dataStr);
        otpData.createdAt = new Date(otpData.createdAt);
        otpData.expiresAt = new Date(otpData.expiresAt);
        // ตรวจสอบแบบ Double-check เผื่อกรณีจังหวะคาบเกี่ยว
        if (new Date() > otpData.expiresAt) {
            await this.delete(phoneNumber);
            logger_1.logger.debug('OTP expired and removed', { phoneNumber });
            return null;
        }
        return otpData;
    }
    /**
     * Verify OTP and increment attempts
     */
    async verify(phoneNumber, otp) {
        const otpData = await this.get(phoneNumber);
        if (!otpData) {
            logger_1.logger.warn('OTP not found or expired', { phoneNumber });
            return false;
        }
        // Increment attempts
        otpData.attempts++;
        const maxAttempts = sms_config_1.smsConfig.otp.maxAttempts || 3;
        // Check max attempts
        if (otpData.attempts > maxAttempts) {
            await this.delete(phoneNumber);
            logger_1.logger.warn('Max OTP attempts exceeded', { phoneNumber });
            return false;
        }
        // 🟢 เนื่องจาก redisService.set() ของคุณเมื่อเซฟทับจะทำให้ TTL หายไป
        // เราจึงต้องคำนวณเวลาที่เหลืออยู่ (Remaining TTL) เพื่อเซ็ตกลับเข้าไปใหม่
        const remainingTtlSeconds = Math.max(1, Math.floor((otpData.expiresAt.getTime() - Date.now()) / 1000));
        // Verify OTP
        if (otpData.otp === otp) {
            otpData.verified = true;
            // อัปเดตสถานะ verified
            await redis_service_1.default.set(this.getKey(phoneNumber), JSON.stringify(otpData), remainingTtlSeconds);
            logger_1.logger.info('OTP verified successfully', { phoneNumber });
            return true;
        }
        // อัปเดตจำนวนครั้งที่เดาผิด
        await redis_service_1.default.set(this.getKey(phoneNumber), JSON.stringify(otpData), remainingTtlSeconds);
        logger_1.logger.warn('Invalid OTP attempt', {
            phoneNumber,
            attempts: otpData.attempts,
        });
        return false;
    }
    /**
     * Delete OTP data
     */
    async delete(phoneNumber) {
        // 🟢 เรียกใช้เมธอด del ของ redisService
        await redis_service_1.default.del(this.getKey(phoneNumber));
        logger_1.logger.debug('OTP deleted', { phoneNumber });
    }
    /**
     * Get remaining attempts
     */
    async getRemainingAttempts(phoneNumber) {
        const otpData = await this.get(phoneNumber);
        const maxAttempts = sms_config_1.smsConfig.otp.maxAttempts || 3;
        if (!otpData) {
            return maxAttempts;
        }
        return Math.max(0, maxAttempts - otpData.attempts);
    }
    /**
     * Check if OTP is verified
     */
    async isVerified(phoneNumber) {
        const otpData = await this.get(phoneNumber);
        return otpData?.verified || false;
    }
}
exports.OTPStorageService = OTPStorageService;
exports.otpStorageService = OTPStorageService.getInstance();
