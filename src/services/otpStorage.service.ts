import { smsConfig } from '../config/sms.config';
import { OTPData } from '../types/sms.types';
import { logger } from '../utils/logger';

/**
 * In-memory OTP storage service
 * For production, consider using Redis or database
 */
export class OTPStorageService {
  private static instance: OTPStorageService;
  private otpStore: Map<string, OTPData> = new Map();

  private constructor() {
    // Clean up expired OTPs every minute
    setInterval(() => this.cleanupExpiredOTPs(), 60000);
  }

  public static getInstance(): OTPStorageService {
    if (!OTPStorageService.instance) {
      OTPStorageService.instance = new OTPStorageService();
    }
    return OTPStorageService.instance;
  }

  /**
   * Store OTP data
   */
  public async store(phoneNumber: string, otp: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + smsConfig.otp.expiryMinutes * 60000);

    const otpData: OTPData = {
      phoneNumber,
      otp,
      createdAt: now,
      expiresAt,
      attempts: 0,
      verified: false,
    };

    this.otpStore.set(phoneNumber, otpData);
    logger.debug('OTP stored', { phoneNumber, expiresAt });
  }

  /**
   * Get OTP data for phone number
   */
  public async get(phoneNumber: string): Promise<OTPData | null> {
    const otpData = this.otpStore.get(phoneNumber);

    if (!otpData) {
      return null;
    }

    // Check if expired
    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(phoneNumber);
      logger.debug('OTP expired and removed', { phoneNumber });
      return null;
    }

    return otpData;
  }

  /**
   * Verify OTP and increment attempts
   */
  public async verify(phoneNumber: string, otp: string): Promise<boolean> {
    const otpData = await this.get(phoneNumber);

    if (!otpData) {
      logger.warn('OTP not found or expired', { phoneNumber });
      return false;
    }

    // Increment attempts
    otpData.attempts++;

    // Check max attempts
    if (otpData.attempts > smsConfig.otp.maxAttempts!) {
      this.otpStore.delete(phoneNumber);
      logger.warn('Max OTP attempts exceeded', { phoneNumber });
      return false;
    }

    // Verify OTP
    if (otpData.otp === otp) {
      otpData.verified = true;
      this.otpStore.set(phoneNumber, otpData);
      logger.info('OTP verified successfully', { phoneNumber });
      return true;
    }

    // Update attempts
    this.otpStore.set(phoneNumber, otpData);
    logger.warn('Invalid OTP attempt', {
      phoneNumber,
      attempts: otpData.attempts,
    });
    return false;
  }

  /**
   * Delete OTP data
   */
  public async delete(phoneNumber: string): Promise<void> {
    this.otpStore.delete(phoneNumber);
    logger.debug('OTP deleted', { phoneNumber });
  }

  /**
   * Get remaining attempts
   */
  public async getRemainingAttempts(phoneNumber: string): Promise<number> {
    const otpData = await this.get(phoneNumber);
    if (!otpData) {
      return smsConfig.otp.maxAttempts || 0;
    }
    return Math.max(0, (smsConfig.otp.maxAttempts || 0) - otpData.attempts);
  }

  /**
   * Check if OTP is verified
   */
  public async isVerified(phoneNumber: string): Promise<boolean> {
    const otpData = await this.get(phoneNumber);
    return otpData?.verified || false;
  }

  /**
   * Cleanup expired OTPs
   */
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [phoneNumber, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(phoneNumber);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cleaned up expired OTPs', { count: cleanedCount });
    }
  }

  /**
   * Get storage statistics
   */
  public getStats(): { total: number; verified: number; expired: number } {
    const now = new Date();
    let verified = 0;
    let expired = 0;

    for (const otpData of this.otpStore.values()) {
      if (otpData.verified) verified++;
      if (now > otpData.expiresAt) expired++;
    }

    return {
      total: this.otpStore.size,
      verified,
      expired,
    };
  }
}

export const otpStorageService = OTPStorageService.getInstance();