"use strict";
// src/config/sms.config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Load from environment variables (BEST PRACTICE)
exports.smsConfig = {
    wsdlUrl: process.env.SMS_WSDL_URL,
    userId: process.env.LAOTEL_USERID,
    privateKey: process.env.LAOTEL_PRIVATE_KEY,
    defaultSenderId: process.env.SMS_SENDER_ID,
    timeoutMs: parseInt(process.env.SMS_TIMEOUT_MS || '30000', 10),
    otp: {
        length: parseInt(process.env.SMS_OTP_LENGTH || '6', 10),
        expiryMinutes: parseInt(process.env.SMS_OTP_EXPIRY_MINUTES || '5', 10),
        maxAttempts: parseInt(process.env.SMS_OTP_MAX_ATTEMPTS || '5', 10),
    },
};
// Validation (critical for security)
if (!exports.smsConfig.privateKey || exports.smsConfig.privateKey.length < 24) {
    throw new Error('INVALID_PRIVATE_KEY: Must be >=24 characters (Triple DES requirement)');
}
