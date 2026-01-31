// src/types/sms.types.ts
export interface OTPData {
  phoneNumber: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

export interface SendOTPRequest {
  phoneNumber: string;
  message?: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Lao Telecom SOAP API Types
export interface LaoTelecomSOAPHeader {
  userid: string;
  key: string;        // Encrypted: userid+transactionid+msisdn
  trans_id: string;   // Unique transaction ID
  version: string;     // API version (can be empty)
}

export interface LaoTelecomSMSMessage {
  header: LaoTelecomSOAPHeader;
  msisdn: string;     // Phone number
  headerSMS: string;  // Sender ID (max 11 chars)
  message: string;    // SMS content (max 320 chars)
}

export interface LaoTelecomSMSRequest {
  msg: LaoTelecomSMSMessage;
}

export interface LaoTelecomSMSResult {
  resultCode: string;
  resultDesc: string;
  trans_id: string;
  networkType?: string;
  type?: number;
  balance?: number;
  LtcTopupBalance?: number;
  TplusTopupBalance?: number;
  LtcVolumnData?: number;
  responeMsg?: string;
}

export interface LaoTelecomSMSResponse {
  sendSMSResult?: LaoTelecomSMSResult;
  status: string;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  transactionId?: string;
}

// Helper types for building requests
export interface SMSRequestParams {
  userId: string;
  privateKey: string;
  msisdn: string;
  message: string;
  headerSMS?: string;
  transactionId?: string;
}