/**
 * OTP Service Test Suite
 * 
 * Tests all OTP service functionality including:
 * - Send OTP
 * - Verify OTP
 * - Resend OTP
 * - Check status
 * - Invalid inputs
 * - Statistics
 */

import { otpService } from './services/otp.service';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const TEST_PHONE_NUMBERS = [
  '8562094142529', // Test number 1
  '8562099349790', // Test number 2
  '2099349790',    // Test number 3 (without country code)
];

async function testSendOTP() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║        TEST 1: SEND OTP                   ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    const phoneNumber = TEST_PHONE_NUMBERS[0];
    console.log(`Sending OTP to: ${phoneNumber}`);
    
    const result = await otpService.sendOTP({
      phoneNumber,
      message: 'Your OTP code is: {OTP}. Valid for 5 minutes.',
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ OTP sent successfully!');
      console.log(`   Phone: ${result.data?.phoneNumber}`);
      console.log(`   Expires in: ${result.data?.expiresIn} seconds`);
      console.log(`   Message ID: ${result.data?.messageId}`);
      
      if (result.data?.errorCode) {
        console.log(`   ⚠️  Error Code: ${result.data.errorCode}`);
      }
    } else {
      console.log('\n❌ Failed to send OTP');
      console.log(`   Error: ${result.message}`);
      if (result.data?.errorCode) {
        console.log(`   Error Code: ${result.data.errorCode}`);
      }
    }
  } catch (error: any) {
    console.error('\n❌ Error sending OTP:', error.message);
    console.error('Stack:', error.stack);
    logger.error('Test send OTP failed', { error: error.message, stack: error.stack });
  }
}

async function testVerifyOTP() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║        TEST 2: VERIFY OTP                 ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    const phoneNumber = TEST_PHONE_NUMBERS[0];
    
    // 1. Send OTP first
    console.log('Step 1: Sending OTP...');
    const sendResult = await otpService.sendOTP({ phoneNumber });
    
    if (!sendResult.success) {
      console.log('❌ Cannot send OTP, skipping verification test');
      console.log('   Error:', sendResult.message);
      return;
    }

    console.log('✅ OTP sent successfully');
    
    // 2. Check status to see OTP details
    console.log('\nStep 2: Checking OTP status...');
    const statusResult = await otpService.checkStatus(phoneNumber);
    console.log('Status:', JSON.stringify(statusResult, null, 2));
    
    if (statusResult.success && statusResult.data) {
      console.log('\n📊 OTP Status:');
      console.log(`   Phone: ${statusResult.data.phoneNumber}`);
      console.log(`   Verified: ${statusResult.data.verified}`);
      console.log(`   Expires in: ${statusResult.data.expiresIn} seconds`);
      console.log(`   Remaining attempts: ${statusResult.data.remainingAttempts}`);
      console.log(`   Created at: ${statusResult.data.createdAt}`);
    }
    
    console.log('\n⚠️  Note: For actual OTP verification, use the code received via SMS');
    console.log('   Example: await otpService.verifyOTP({ phoneNumber, otp: "123456" })');
    
  } catch (error: any) {
    console.error('\n❌ Error verifying OTP:', error.message);
    logger.error('Test verify OTP failed', { error: error.message });
  }
}

async function testResendOTP() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║        TEST 3: RESEND OTP                 ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    const phoneNumber = TEST_PHONE_NUMBERS[1];
    
    // Send first OTP
    console.log('Step 1: Sending first OTP...');
    const firstResult = await otpService.sendOTP({ phoneNumber });
    console.log('First OTP Result:', JSON.stringify(firstResult, null, 2));
    
    if (!firstResult.success) {
      console.log('❌ Cannot send first OTP');
      console.log('   Error:', firstResult.message);
      return;
    }
    
    console.log('✅ First OTP sent successfully');
    
    // Wait 3 seconds
    console.log('\nWaiting 3 seconds before resend...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Resend OTP
    console.log('\nStep 2: Resending OTP...');
    const resendResult = await otpService.resendOTP(phoneNumber);
    console.log('Resend Result:', JSON.stringify(resendResult, null, 2));
    
    if (resendResult.success) {
      console.log('\n✅ OTP resent successfully!');
      console.log(`   Message ID: ${resendResult.data?.messageId}`);
    } else {
      console.log('\n⚠️  Resend result:', resendResult.message);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error resending OTP:', error.message);
    logger.error('Test resend OTP failed', { error: error.message });
  }
}

async function testCheckStatus() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║        TEST 4: CHECK OTP STATUS           ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    const phoneNumber = TEST_PHONE_NUMBERS[2];
    
    // Send OTP first
    console.log('Step 1: Sending OTP...');
    const sendResult = await otpService.sendOTP({ phoneNumber });
    
    if (!sendResult.success) {
      console.log('❌ Cannot send OTP');
      console.log('   Error:', sendResult.message);
      return;
    }
    
    console.log('✅ OTP sent successfully');
    
    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check status
    console.log('\nStep 2: Checking OTP status...');
    const statusResult = await otpService.checkStatus(phoneNumber);
    console.log('Status:', JSON.stringify(statusResult, null, 2));
    
    if (statusResult.success && statusResult.data) {
      console.log('\n✅ OTP status retrieved successfully!');
      console.log(`   Phone: ${statusResult.data.phoneNumber}`);
      console.log(`   Verified: ${statusResult.data.verified ? '✅' : '❌'}`);
      console.log(`   Expires in: ${statusResult.data.expiresIn} seconds`);
      console.log(`   Remaining attempts: ${statusResult.data.remainingAttempts}/${statusResult.data.remainingAttempts + (statusResult.data.verified ? 0 : 0)}`);
      console.log(`   Created: ${new Date(statusResult.data.createdAt).toLocaleString()}`);
    } else {
      console.log('\n❌ Failed to get status');
      console.log('   Error:', statusResult.message);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error checking OTP status:', error.message);
    logger.error('Test check status failed', { error: error.message });
  }
}

async function testInvalidPhoneNumber() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║        TEST 5: INVALID PHONE NUMBER       ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    const invalidNumbers = [
      '123456789',      // Too short
      '123',            // Way too short
      'abcdefgh',       // Not a number
      '85612345',       // Wrong format
    ];
    
    for (const invalidPhone of invalidNumbers) {
      console.log(`\nTesting invalid number: "${invalidPhone}"`);
      
      const result = await otpService.sendOTP({ phoneNumber: invalidPhone });
      
      if (!result.success) {
        console.log(`  ✅ Correctly rejected: ${result.message}`);
      } else {
        console.log(`  ⚠️  Unexpectedly accepted invalid number`);
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    logger.error('Test invalid phone number failed', { error: error.message });
  }
}

async function testStats() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║        TEST 6: GET STATISTICS             ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    const stats = otpService.getStats();
    console.log('Statistics:', JSON.stringify(stats, null, 2));
    
    console.log('\n✅ Statistics retrieved successfully!');
    console.log(`   Total OTPs in memory: ${stats.total || 0}`);
    console.log(`   Verified OTPs: ${stats.verified || 0}`);
    console.log(`   Expired OTPs: ${stats.expired || 0}`);
    
  } catch (error: any) {
    console.error('\n❌ Error getting statistics:', error.message);
    logger.error('Test stats failed', { error: error.message });
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          OTP SERVICE COMPREHENSIVE TEST SUITE             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nStarted at: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Encryption: Solution ${process.env.LAO_TELECOM_ENCRYPTION_SOLUTION || '2'}\n`);

  const startTime = Date.now();

  try {
    // Test 1: Send OTP
    await testSendOTP();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Verify OTP (check status)
    await testVerifyOTP();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Resend OTP
    await testResendOTP();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Check status
    await testCheckStatus();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5: Invalid phone numbers
    await testInvalidPhoneNumber();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 6: Statistics
    await testStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║        ALL TESTS COMPLETED                ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log(`\nCompleted at: ${new Date().toISOString()}`);
    console.log(`Total duration: ${duration} seconds\n`);
    
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
    logger.error('Test suite failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'send':
    testSendOTP().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'verify':
    testVerifyOTP().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'resend':
    testResendOTP().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'status':
    testCheckStatus().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'invalid':
    testInvalidPhoneNumber().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'stats':
    testStats().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  case 'all':
    runAllTests().then(() => process.exit(0)).catch(() => process.exit(1));
    break;
  default:
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║        OTP SERVICE TEST COMMANDS          ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log('Usage: npm run test:otp <command>\n');
    console.log('Commands:');
    console.log('  send      - Test sending OTP');
    console.log('  verify    - Test verifying OTP (checks status)');
    console.log('  resend    - Test resending OTP');
    console.log('  status    - Test checking OTP status');
    console.log('  invalid   - Test with invalid phone numbers');
    console.log('  stats     - Test getting statistics');
    console.log('  all       - Run all tests\n');
    console.log('Examples:');
    console.log('  npm run test:otp send');
    console.log('  npm run test:otp all\n');
    process.exit(0);
}