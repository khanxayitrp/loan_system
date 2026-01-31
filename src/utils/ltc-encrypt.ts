import * as crypto from 'crypto';
import { logger } from './logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ENCRYPT_JAR_PATH = './src/utils/encrypt.jar';
const DECRYPT_JAR_PATH = './src/utils/decrypt.jar';

/**
 * Laotel-compatible encryption (Triple DES ECB mode)
 * Matches Java `ltc.encrypt()` behavior
 * 
 * @param data - Plaintext to encrypt (userid + trans_id or userid + trans_id + msisdn)
 * @param privateKey - 24+ char key (padded to 24 bytes)
 * @returns Base64-encoded encrypted string
 */
export async function encryptKey(data: string, privateKey: string): Promise<string> {
//   try {
//     // Pad/truncate key to 24 bytes (Triple DES requirement)
//     const keyBuffer = Buffer.from(privateKey.padEnd(24).slice(0, 24), 'utf-8');
    
//     // Create cipher (ECB mode has NO IV - matches Java examples)
//     // Note: 'des-ede3' is Triple DES, ECB mode
//     const cipher = crypto.createCipheriv('des-ede3', keyBuffer, Buffer.alloc(0));
//     cipher.setAutoPadding(true); // PKCS5/PKCS7 padding
    
//     // Encrypt and base64 encode
//     const encrypted = Buffer.concat([
//       cipher.update(data, 'utf8'),
//       cipher.final()
//     ]);
    
//     const result = encrypted.toString('base64');
    
//     logger.debug('Key encrypted successfully', {
//       inputLength: data.length,
//       outputLength: result.length,
//       encoding: 'base64',
//     });

//     return result;
//   } catch (error: any) {
//     logger.error('Failed to encrypt key', {
//       error: error.message,
//       dataLength: data.length,
//     });
//     throw new Error(`Encryption failed: ${error.message}`);
//   }
// }
try {
    const command = `java -jar "${ENCRYPT_JAR_PATH}" "${data}" "${privateKey}"`;
    logger.debug('Executing encrypt command:', command);

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      logger.error('Encrypt stderr:', stderr);
      throw new Error(`Encryption failed: ${stderr}`);
    }

    let encrypted = stdout.trim(); // JAR อาจ return ค่ามี newline
    logger.debug('Encrypted result:', encrypted);
    // ตัด prefix "OK\r\n" หรือ "OK\n" ออก (ปัญหาจาก JAR return)
    if (encrypted.startsWith('OK')) {
      encrypted = encrypted.replace(/^OK\s*\r?\n/, '').trim();
    }
    logger.debug('Cleaned encrypted result:', encrypted);

    return encrypted;
  } catch (error: any) {
    logger.error('Failed to encrypt key with JAR', { error: error.message });
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt for validation/debugging ONLY (not used in OTP flow)
 * 
 * @param encryptedBase64 - Base64 encoded encrypted string
 * @param privateKey - Private key
 * @returns Decrypted plaintext
 */
export async function decryptKey(encrypted: string, privateKey: string): Promise<string> {
//   try {
//     const keyBuffer = Buffer.from(privateKey.padEnd(24).slice(0, 24), 'utf-8');
//     const decipher = crypto.createDecipheriv('des-ede3', keyBuffer, Buffer.alloc(0));
//     decipher.setAutoPadding(true);
    
//     const decrypted = Buffer.concat([
//       decipher.update(Buffer.from(encryptedBase64, 'base64')),
//       decipher.final()
//     ]);
    
//     return decrypted.toString('utf8');
//   } catch (error: any) {
//     logger.error('Failed to decrypt key', {
//       error: error.message,
//     });
//     throw new Error(`Decryption failed: ${error.message}`);
//   }
// }
try {
    const command = `java -jar "${DECRYPT_JAR_PATH}" "${encrypted}" "${privateKey}"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      logger.error('Decrypt stderr:', stderr);
      throw new Error(`Decryption failed: ${stderr}`);
    }

    return stdout.trim();
  } catch (error: any) {
    logger.error('Failed to decrypt key with JAR', { error: error.message });
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Generate encryption key - Solution 1: userid + trans_id
 * Use this if API expects only userid + trans_id
 * 
 * @param userId - User ID
 * @param transactionId - Transaction ID
 * @param privateKey - Private key
 * @returns Encrypted key
 */
export async function generateSolution1Key(
  userId: string,
  transactionId: string,
  privateKey: string
): Promise<string> {
  const data = `${userId.trim()}${transactionId.trim()}`;
  logger.debug('Generating Solution 1 key', {
    userId,
    transactionId,
    dataToEncrypt: data,
  });
  return encryptKey(data, privateKey);
}

/**
 * Generate encryption key - Solution 2: userid + trans_id + msisdn
 * Use this if API expects userid + trans_id + msisdn
 * 
 * @param userId - User ID
 * @param transactionId - Transaction ID
 * @param msisdn - Phone number
 * @param privateKey - Private key
 * @returns Encrypted key
 */
export async function generateSolution2Key(
  userId: string,
  transactionId: string,
  msisdn: string,
  privateKey: string
): Promise<string> {
  const data = `${userId.trim()}${transactionId.trim()}${msisdn.trim()}`;
  logger.debug('Generating Solution 2 key', {
    userId,
    transactionId,
    msisdn,
    dataToEncrypt: data,
  });
  return encryptKey(data, privateKey);
}

/**
 * Generate unique transaction ID
 * Format: timestamp + random string
 * 
 * @param prefix - Optional prefix for transaction ID
 * @returns Unique transaction ID (max 20 chars)
 */
export function generateTransactionId(prefix: string = 'OTP'): string {
  const timestamp = Date.now().toString().slice(-10); // Last 10 digits
  const random = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 random chars
  
  const transId = `${prefix}${timestamp}${random}`;
  
  // Ensure max 20 characters
  return transId.substring(0, 20);
}

/**
 * Validate Lao Telecom SMS parameters
 */
export function validateSMSParams(params: {
  userId: string;
  privateKey: string;
  msisdn: string;
  message: string;
  headerSMS?: string;
}): { valid: boolean; error?: string } {
  // Validate userId
  if (!params.userId || params.userId.length > 10) {
    return { valid: false, error: 'userId must be 1-10 characters' };
  }

  // Validate privateKey
  if (!params.privateKey || params.privateKey.length < 24) {
    return { valid: false, error: 'privateKey must be at least 24 characters for 3DES encryption' };
  }

  // Validate msisdn
  if (!params.msisdn || params.msisdn.length > 15) {
    return { valid: false, error: 'msisdn must be 1-15 characters' };
  }

  // Validate message
  if (!params.message || params.message.length > 320) {
    return { valid: false, error: 'message must be 1-320 characters' };
  }

  // Validate headerSMS (optional)
  if (params.headerSMS && params.headerSMS.length > 11) {
    return { valid: false, error: 'headerSMS must be max 11 characters' };
  }

  return { valid: true };
}

/**
 * Parse result code from Lao Telecom response
 * 
 * @param resultCode - Result code from API
 * @returns Object with success status and description
 */
// 
export function parseResultCode(resultCode: string): {
  success: boolean;
  description: string;
} {
  const resultCodes: { [key: string]: { success: boolean; description: string } } = {
    // Success codes
    '20': { success: true, description: 'Operation is successfully' },
    '0': { success: true, description: 'Success (fallback)' },     // บางกรณีอาจใช้ 0
    '00': { success: true, description: 'Success (fallback)' },

    // Error codes (ตรงตามเอกสาร)
    '01': { success: false, description: 'Please try again' },
    '02': { success: false, description: 'Incorrect {Parameter}' },
    '03': { success: false, description: 'Incorrect msisdn' },
    '04': { success: false, description: 'You can not use this Service' },
    '05': { success: false, description: 'Header Message Incorrect' },
    '06': { success: false, description: 'Incorrect remote IP' },
    '07': { success: false, description: 'Incorrect amount' },
    '10': { success: false, description: 'User or Key incorrect' },
    '11': { success: false, description: 'Can not generate transaction ID' },
    '12': { success: false, description: 'Can insert transaction ID' },
    '13': { success: false, description: 'Subscriber is not found' },
    '14': { success: false, description: 'This number is not prepaid number' },
    '15': { success: false, description: 'Your Sim Master is not correct' },
    '16': { success: false, description: 'Your Sim Master balance is not enough' },
    '17': { success: false, description: 'You can not use this Service' },
    '18': { success: false, description: 'Can not adjust balance Sim Master' },
    '21': { success: false, description: 'can not recharge money to OCS' },
    '22': { success: false, description: 'can not payment to BSS' },
    '23': { success: false, description: 'can not payment to Billing' },
    '30': { success: false, description: 'incorrect network type' },
    '100': { success: false, description: 'Error' },
  };

  const result = resultCodes[resultCode] || {
    success: false,
    description: `Unknown result code: ${resultCode}`,
  };

  logger.debug('Parsed result code', {
    code: resultCode,
    success: result.success,
    description: result.description,
  });

  return result;
}

/**
 * Format phone number for Lao Telecom API
 * Ensures proper format without country code prefix
 * 
 * @param phoneNumber - Input phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumberForAPI(phoneNumber: string): string {
  // Remove all non-digit characters
  let formatted = phoneNumber.replace(/\D/g, '');

  // Remove country code if present (856)
  if (formatted.startsWith('856')) {
    formatted = formatted.substring(3);
  }

  // Ensure max 15 characters
  return formatted.substring(0, 15);
}

/**
 * Test encryption/decryption (for debugging)
 */
export async function testEncryption(
  userId: string,
  transactionId: string,
  msisdn: string,
  privateKey: string
): Promise<{
  solution1: { encrypted: string; decrypted: string };
  solution2: { encrypted: string; decrypted: string };
}> {
  // Test Solution 1
  const data1 = `${userId}${transactionId}`;
  const encrypted1 = await encryptKey(data1, privateKey);
  const decrypted1 = await decryptKey(encrypted1, privateKey);

  // Test Solution 2
  const data2 = `${userId}${transactionId}${msisdn}`;
  const encrypted2 = await encryptKey(data2, privateKey);
  const decrypted2 = await decryptKey(encrypted2, privateKey);

  return {
    solution1: {
      encrypted: encrypted1,
      decrypted: decrypted1,
    },
    solution2: {
      encrypted: encrypted2,
      decrypted: decrypted2,
    },
  };
}