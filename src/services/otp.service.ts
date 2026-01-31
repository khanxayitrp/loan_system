import { otpStorageService } from './otpStorage.service';

import { laoTelecomService } from './laotelecom.service';
import { generateOTP, formatPhoneNumber, isValidLaoPhoneNumber, createOTPMessage } from '../utils/otp';
import { logger } from '../utils/logger';
import { OTPResponse, SendOTPRequest, VerifyOTPRequest } from '../types/sms.types';
import { smsConfig } from '../config/sms.config';

export class OTPService {
  private static instance: OTPService;

  private constructor() {}

  public static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  /**
   * Send OTP to phone number
   */
  public async sendOTP(request: SendOTPRequest): Promise<OTPResponse> {
    try {
      const { phoneNumber, message } = request;

      // Validate phone number
      if (!isValidLaoPhoneNumber(phoneNumber)) {
        logger.warn('Invalid phone number format', { phoneNumber });
        return {
          success: false,
          message: 'Invalid Lao phone number format',
        };
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Check if OTP already exists and not expired
      const existingOTP = await otpStorageService.get(formattedPhone);
      if (existingOTP && !existingOTP.verified) {
        const remainingTime = Math.ceil((existingOTP.expiresAt.getTime() - Date.now()) / 1000);
        if (remainingTime > 0) {
          logger.info('OTP already sent and not expired', {
            phoneNumber: formattedPhone,
            remainingTime,
          });
          return {
            success: false,
            message: `OTP already sent. Please wait ${Math.ceil(remainingTime / 60)} minute(s) before requesting again.`,
            data: {
              expiresIn: remainingTime,
            },
          };
        }
      }

      // Generate OTP
      const otp = generateOTP();

      // Create message
      const smsMessage = message || createOTPMessage(otp);

      // Send SMS via Lao Telecom
      const smsResult = await laoTelecomService.sendSMS(formattedPhone, smsMessage);
      console.log('SMS Result:', smsResult);

      if (smsResult.status === 'error') {
        logger.error('Failed to send OTP SMS', {
          phoneNumber: formattedPhone,
          error: smsResult.errorMessage,
        });
        return {
          success: false,
          message: 'Failed to send OTP. Please try again later.',
          data: {
            errorCode: smsResult.errorCode,
          },
        };
      }

      // Store OTP
      await otpStorageService.store(formattedPhone, otp);

      logger.info('OTP sent successfully', {
        phoneNumber: formattedPhone,
        messageId: smsResult.messageId,
      });

      return {
        success: true,
        message: 'OTP sent successfully',
        data: {
          phoneNumber: formattedPhone,
          expiresIn: smsConfig.otp.expiryMinutes * 60,
          messageId: smsResult.messageId,
        },
      };
    } catch (error: any) {
      logger.error('Error sending OTP', { error: error.message });
      return {
        success: false,
        message: 'An error occurred while sending OTP',
      };
    }
  }

  /**
   * Verify OTP
   */
  public async verifyOTP(request: VerifyOTPRequest): Promise<OTPResponse> {
    try {
      const { phoneNumber, otp } = request;

      // Validate inputs
      if (!phoneNumber || !otp) {
        return {
          success: false,
          message: 'Phone number and OTP are required',
        };
      }

      if (!isValidLaoPhoneNumber(phoneNumber)) {
        return {
          success: false,
          message: 'Invalid Lao phone number format',
        };
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Get remaining attempts before verification
      const remainingAttempts = await otpStorageService.getRemainingAttempts(formattedPhone);

      // Verify OTP
      const isValid = await otpStorageService.verify(formattedPhone, otp);

      if (!isValid) {
        const newRemainingAttempts = await otpStorageService.getRemainingAttempts(formattedPhone);

        logger.warn('OTP verification failed', {
          phoneNumber: formattedPhone,
          remainingAttempts: newRemainingAttempts,
        });

        if (newRemainingAttempts === 0) {
          return {
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new OTP.',
            data: {
              remainingAttempts: 0,
            },
          };
        }

        return {
          success: false,
          message: 'Invalid OTP',
          data: {
            remainingAttempts: newRemainingAttempts,
          },
        };
      }

      logger.info('OTP verified successfully', {
        phoneNumber: formattedPhone,
      });

      // Optionally delete OTP after successful verification
      // await otpStorageService.delete(formattedPhone);

      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          phoneNumber: formattedPhone,
          verified: true,
        },
      };
    } catch (error: any) {
      logger.error('Error verifying OTP', { error: error.message });
      return {
        success: false,
        message: 'An error occurred while verifying OTP',
      };
    }
  }

  /**
   * Resend OTP
   */
  public async resendOTP(phoneNumber: string): Promise<OTPResponse> {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Delete existing OTP
    await otpStorageService.delete(formattedPhone);

    // Send new OTP
    return this.sendOTP({ phoneNumber });
  }

  /**
   * Check OTP status
   */
  public async checkStatus(phoneNumber: string): Promise<OTPResponse> {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const otpData = await otpStorageService.get(formattedPhone);

      if (!otpData) {
        return {
          success: false,
          message: 'No active OTP found',
        };
      }

      const remainingTime = Math.max(0, Math.ceil((otpData.expiresAt.getTime() - Date.now()) / 1000));
      const remainingAttempts = await otpStorageService.getRemainingAttempts(formattedPhone);

      return {
        success: true,
        message: 'OTP status retrieved',
        data: {
          phoneNumber: formattedPhone,
          verified: otpData.verified,
          expiresIn: remainingTime,
          remainingAttempts,
          createdAt: otpData.createdAt,
        },
      };
    } catch (error: any) {
      logger.error('Error checking OTP status', { error: error.message });
      return {
        success: false,
        message: 'An error occurred while checking OTP status',
      };
    }
  }

  /**
   * Get service statistics
   */
  public getStats() {
    return otpStorageService.getStats();
  }
}

export const otpService = OTPService.getInstance();