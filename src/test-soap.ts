/**
 * Encryption Examples and Testing
 * 
 * This file demonstrates how to use the encryption utilities
 * for Lao Telecom API
 */

import {
  generateSolution1Key,
  generateSolution2Key,
  generateTransactionId,
  validateSMSParams,
  parseResultCode,
  formatPhoneNumberForAPI,
} from './utils/ltc-encrypt';

// Example 1: Generate Transaction ID
export function exampleGenerateTransactionId() {
  console.log('\n=== Example: Generate Transaction ID ===');
  
  const transId1 = generateTransactionId(); // Default prefix "OTP"
  const transId2 = generateTransactionId('PAY'); // Custom prefix
  const transId3 = generateTransactionId('VER'); // Another custom prefix
  
  console.log('Transaction ID 1:', transId1);
  console.log('Transaction ID 2:', transId2);
  console.log('Transaction ID 3:', transId3);
  console.log('Max length: 20 characters');
}

// Example 2: Encrypt Key
export async function exampleEncryptKey() {
  console.log('\n=== Example: Encrypt Key ===');
  
  const userId = 'TEST';
  const transactionId = generateTransactionId();
  const msisdn = '20xxxxxxxx';
  const privateKey = 'YK7nv6jQmS6Mr4lMVK1RXwTesting'; // Min 24 chars
  
  console.log('Input:');
  console.log('  userId:', userId);
  console.log('  transactionId:', transactionId);
  console.log('  msisdn:', msisdn);
  console.log('  privateKey:', privateKey.substring(0, 10) + '...');
  
  // Solution 1: userid + trans_id
  const encryptedKey1 = await generateSolution1Key(userId, transactionId, privateKey);
  console.log('\nSolution 1 (userid + trans_id):');
  console.log('  Data encrypted:', userId + transactionId);
  console.log('  Encrypted key:', encryptedKey1);
  console.log('  Key length:', encryptedKey1.length);
  console.log('  Encoding: Base64');
  
  // Solution 2: userid + trans_id + msisdn
  const encryptedKey2 = await generateSolution2Key(userId, transactionId, msisdn, privateKey);
  console.log('\nSolution 2 (userid + trans_id + msisdn):');
  console.log('  Data encrypted:', userId + transactionId + msisdn);
  console.log('  Encrypted key:', encryptedKey2);
  console.log('  Key length:', encryptedKey2.length);
  console.log('  Encoding: Base64');
}

// Example 3: Validate SMS Parameters
export function exampleValidateSMSParams() {
  console.log('\n=== Example: Validate SMS Parameters ===');
  
  // Valid parameters
  const validParams = {
    userId: 'TEST',
    privateKey: 'YK7nv6jQmS6Mr4lMVK1RXwTesting',
    msisdn: '20xxxxxxxx',
    message: 'Your OTP is: 123456',
    headerSMS: 'MyBrand',
  };
  
  console.log('\n1. Valid parameters:');
  const result1 = validateSMSParams(validParams);
  console.log('  Result:', result1);
  
  // Invalid: Short private key
  console.log('\n2. Invalid: Private key too short');
  const result2 = validateSMSParams({
    ...validParams,
    privateKey: 'short',
  });
  console.log('  Result:', result2);
  
  // Invalid: Message too long
  console.log('\n3. Invalid: Message too long');
  const result3 = validateSMSParams({
    ...validParams,
    message: 'x'.repeat(321), // 321 chars
  });
  console.log('  Result:', result3);
  
  // Invalid: Sender ID too long
  console.log('\n4. Invalid: Sender ID too long');
  const result4 = validateSMSParams({
    ...validParams,
    headerSMS: 'VeryLongBrandName123', // 20 chars, max 11
  });
  console.log('  Result:', result4);
}

// Example 4: Parse Result Codes
export function exampleParseResultCode() {
  console.log('\n=== Example: Parse Result Codes ===');
  
  const codes = ['0', '00', '000', '1', '2', '3', '4', '5', '99', 'UNKNOWN'];
  
  codes.forEach(code => {
    const result = parseResultCode(code);
    console.log(`Code "${code}":`, result);
  });
}

// Example 5: Format Phone Number
export function exampleFormatPhoneNumber() {
  console.log('\n=== Example: Format Phone Number ===');
  
  const phoneNumbers = [
    '856 20 1234 5678',
    '85620xxxxxxxx',
    '20xxxxxxxx',
    '030xxxxxxx',
    '+856-20-xxxx-xxxx',
  ];
  
  phoneNumbers.forEach(phone => {
    const formatted = formatPhoneNumberForAPI(phone);
    console.log(`Input:  "${phone}"`);
    console.log(`Output: "${formatted}"\n`);
  });
}

// Example 6: Complete SMS Request Flow
export function exampleCompleteSMSFlow() {
  console.log('\n=== Example: Complete SMS Request Flow ===');
  
  // Step 1: Prepare parameters
  const userId = 'TEST';
  const privateKey = 'YK7nv6jQmS6Mr4lMVK1RXwTesting';
  const phoneNumber = '856 20 1234 5678';
  const message = 'Your OTP code is: 123456. Valid for 5 minutes.';
  const senderId = 'MyApp';
  
  console.log('Step 1: Input parameters');
  console.log('  userId:', userId);
  console.log('  phoneNumber:', phoneNumber);
  console.log('  message:', message);
  console.log('  senderId:', senderId);
  
  // Step 2: Format phone number
  const msisdn = formatPhoneNumberForAPI(phoneNumber);
  console.log('\nStep 2: Format phone number');
  console.log('  Formatted:', msisdn);
  
  // Step 3: Validate parameters
  console.log('\nStep 3: Validate parameters');
  const validation = validateSMSParams({
    userId,
    privateKey,
    msisdn,
    message,
    headerSMS: senderId,
  });
  
  if (!validation.valid) {
    console.log('  ❌ Validation failed:', validation.error);
    return;
  }
  console.log('  ✅ Validation passed');
  
  // Step 4: Generate transaction ID
  const transactionId = generateTransactionId('OTP');
  console.log('\nStep 4: Generate transaction ID');
  console.log('  Transaction ID:', transactionId);
  
  // Step 5: Encrypt key (both solutions)
  console.log('\nStep 5: Encrypt key');
  
  const encryptedKey1 = generateSolution1Key(userId, transactionId, privateKey);
  console.log('\n  Solution 1 (userid + trans_id):');
  console.log('    Data to encrypt:', userId + transactionId);
  console.log('    Encrypted key:', encryptedKey1);
  
  const encryptedKey2 = generateSolution2Key(userId, transactionId, msisdn, privateKey);
  console.log('\n  Solution 2 (userid + trans_id + msisdn):');
  console.log('    Data to encrypt:', userId + transactionId + msisdn);
  console.log('    Encrypted key:', encryptedKey2);
  
  // Step 6: Build SOAP request (using Solution 2)
  console.log('\nStep 6: Build SOAP request structure (using Solution 2)');
  const soapRequest = {
    msg: {
      header: {
        userid: userId,
        key: encryptedKey2,
        trans_id: transactionId,
        verson: '',
      },
      msisdn: msisdn,
      headerSMS: senderId,
      message: message,
    },
  };
  
  console.log('  Request structure:');
  console.log(JSON.stringify(soapRequest, null, 2));
  
  console.log('\n✅ Ready to send to SOAP API!');
  console.log('\nNote: Set LAO_TELECOM_ENCRYPTION_SOLUTION=1 or 2 in .env to choose encryption method');
}

// Run all examples
export function runAllExamples() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     ENCRYPTION UTILITIES EXAMPLES         ║');
  console.log('╚═══════════════════════════════════════════╝');
  
  exampleGenerateTransactionId();
  exampleEncryptKey();
  exampleValidateSMSParams();
  exampleParseResultCode();
  exampleFormatPhoneNumber();
  exampleCompleteSMSFlow();
  
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║         EXAMPLES COMPLETED                ║');
  console.log('╚═══════════════════════════════════════════╝\n');
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const example = args[0];
  
  switch (example) {
    case 'transaction':
      exampleGenerateTransactionId();
      break;
    case 'encrypt':
      exampleEncryptKey();
      break;
    case 'validate':
      exampleValidateSMSParams();
      break;
    case 'resultcode':
      exampleParseResultCode();
      break;
    case 'phone':
      exampleFormatPhoneNumber();
      break;
    case 'flow':
      exampleCompleteSMSFlow();
      break;
    case 'all':
    default:
      runAllExamples();
      break;
  }
}

export default {
  exampleGenerateTransactionId,
  exampleEncryptKey,
  exampleValidateSMSParams,
  exampleParseResultCode,
  exampleFormatPhoneNumber,
  exampleCompleteSMSFlow,
  runAllExamples,
};