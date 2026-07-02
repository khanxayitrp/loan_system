import { smsConfig } from '../config/sms.config';


/**
 * Generate a random OTP code
 * @param length - Length of OTP (default from config)
 * @returns string - Generated OTP
 */
export const generateOTP = (length: number = smsConfig.otp.length): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

/**
 * Format phone number for Lao Telecom (แปลงทุกรูปแบบให้เป็น 856 สำหรับ SMS Gateway)
 * @param phoneNumber - Phone number to format
 * @returns string - Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // ลบตัวอักษรหรือช่องว่างออกให้เหลือแต่ตัวเลข
  let formatted = phoneNumber.replace(/\D/g, '');
  
  // 1. ถ้าส่งมา 8 หลัก (เช่น 99853899) ให้เติม 85620
  if (formatted.length === 8) {
    return '85620' + formatted;
  }
  
  // 2. ถ้าส่งมา 7 หลัก ให้เติม 85630
  if (formatted.length === 7) {
    return '85630' + formatted;
  }

  // 3. ถ้าส่งมาแบบ 020 หรือ 030 ให้ตัด 0 ออก แล้วเติม 856 แทน
  if (formatted.startsWith('020') || formatted.startsWith('030')) {
    return '856' + formatted.substring(1);
  }

  // 4. ถ้าส่งมาแบบ 20 หรือ 30 ให้เติม 856 ข้างหน้าเลย
  if (formatted.startsWith('20') || formatted.startsWith('30')) {
    return '856' + formatted;
  }

  // 5. ถ้าส่งมา 856 อยู่แล้ว ปล่อยผ่าน
  if (formatted.startsWith('856')) {
    return formatted;
  }
  
  return formatted;
};

/**
 * Validate Lao phone number format
 * @param phoneNumber - Phone number to validate
 * @returns boolean - True if valid
 */
export const isValidLaoPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatPhoneNumber(phoneNumber);
  
  // ✅ ตรวจสอบว่าหลังจากแปลงแล้ว เป็น 85620 (ตามด้วย 8 หลัก) หรือ 85630 (ตามด้วย 7-8 หลัก)
  const laoPhoneRegex = /^856(20\d{8}|30\d{7,8})$/;
  
  const isValid = laoPhoneRegex.test(formatted);
  
  // สำหรับ debug
  if (!isValid) {
    console.log(`[DEBUG] Phone validation failed for SMS Gateway:`);
    console.log(`  Input: ${phoneNumber}`);
    console.log(`  Formatted: ${formatted}`);
    console.log(`  Length: ${formatted.length} digits`);
    console.log(`  Expected: 13 digits (85620 + 8 digits) or 12-13 digits for 85630`);
  }
  
  return isValid;
};

/**
 * Create OTP message template
 * @param otp - OTP code
 * @param expiryMinutes - Expiry time in minutes
 * @returns string - Formatted message
 */
export const createOTPMessage = (otp: string, expiryMinutes: number = smsConfig.otp.expiryMinutes): string => {
  return `Your OTP code is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`;
};