// src/config/sms.config.ts

import dotenv from 'dotenv';
dotenv.config();

export interface SmsConfig {
  wsdlUrl?: string;
  userId?: string;
  privateKey?: string;
  defaultSenderId?: string;
  timeoutMs?: number;
  otp: {
    length: number;
    expiryMinutes: number;
    maxAttempts?: number;
  };
}

// Load from environment variables (BEST PRACTICE)
export const smsConfig: SmsConfig = {
  wsdlUrl: process.env.SMS_WSDL_URL,
  userId: process.env.LAOTEL_USERID,
  privateKey: process.env.LAOTEL_PRIVATE_KEY,
  defaultSenderId: process.env.SMS_SENDER_ID,
  timeoutMs: parseInt(process.env.SMS_TIMEOUT_MS || '30000', 10),
  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  },
};

// Validation (critical for security)
if (!smsConfig.privateKey || smsConfig.privateKey.length < 24) {
  throw new Error('INVALID_PRIVATE_KEY: Must be >=24 characters (Triple DES requirement)');
}