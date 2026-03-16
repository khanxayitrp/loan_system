"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOTPMessage = exports.isValidLaoPhoneNumber = exports.formatPhoneNumber = exports.generateOTP = void 0;
const sms_config_1 = require("../config/sms.config");
/**
 * Generate a random OTP code
 * @param length - Length of OTP (default from config)
 * @returns string - Generated OTP
 */
const generateOTP = (length = sms_config_1.smsConfig.otp.length) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};
exports.generateOTP = generateOTP;
/**
 * Format phone number for Lao Telecom (remove special characters and ensure proper format)
 * @param phoneNumber - Phone number to format
 * @returns string - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    let formatted = phoneNumber.replace(/\D/g, '');
    // ตรวจสอบและเพิ่มรหัสประเทศหากจำเป็น
    if (formatted.startsWith('856')) {
        // ถ้าเริ่มด้วย 856 ให้ใช้เลย
        return formatted;
    }
    else if (formatted.startsWith('20') || formatted.startsWith('30')) {
        // ถ้าเริ่มด้วย 20 หรือ 30 (ไม่มีรหัสประเทศ) ให้เพิ่ม 856
        // ตรวจสอบว่ามี 10 หลัก (20/30 + 8 digits)
        if (formatted.length === 10) {
            return '856' + formatted;
        }
        return formatted;
    }
    else if (formatted.length === 8) {
        // ถ้ามีแค่ 8 หลัก ให้สมมติว่าเป็นหมายเลขท้องถิ่น
        return '85620' + formatted;
    }
    return formatted;
};
exports.formatPhoneNumber = formatPhoneNumber;
/**
 * Validate Lao phone number format
 * @param phoneNumber - Phone number to validate
 * @returns boolean - True if valid
 */
const isValidLaoPhoneNumber = (phoneNumber) => {
    const formatted = (0, exports.formatPhoneNumber)(phoneNumber);
    // ✅ แก้ไข: หมายเลขลาวมี 8 หลักหลังรหัสผู้ให้บริการ (รวม 13 หลัก)
    // 856 (3) + 20/30 (2) + 8 digits = 13 หลัก
    const laoPhoneRegex = /^856(20|30)\d{8}$/;
    const isValid = laoPhoneRegex.test(formatted);
    // สำหรับ debug
    if (!isValid) {
        console.log(`[DEBUG] Phone validation failed:`);
        console.log(`  Input: ${phoneNumber}`);
        console.log(`  Formatted: ${formatted}`);
        console.log(`  Length: ${formatted.length} digits`);
        console.log(`  Expected: 13 digits (856 + 20/30 + 8 digits)`);
    }
    return isValid;
};
exports.isValidLaoPhoneNumber = isValidLaoPhoneNumber;
/**
 * Create OTP message template
 * @param otp - OTP code
 * @param expiryMinutes - Expiry time in minutes
 * @returns string - Formatted message
 */
const createOTPMessage = (otp, expiryMinutes = sms_config_1.smsConfig.otp.expiryMinutes) => {
    return `Your OTP code is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`;
};
exports.createOTPMessage = createOTPMessage;
