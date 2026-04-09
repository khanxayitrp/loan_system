"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpService = exports.OTPService = void 0;
const otpStorage_service_1 = require("./otpStorage.service");
const laotelecom_service_1 = require("./laotelecom.service");
const otp_1 = require("../utils/otp");
const logger_1 = require("../utils/logger");
const sms_config_1 = require("../config/sms.config");
class OTPService {
    constructor() { }
    static getInstance() {
        if (!OTPService.instance) {
            OTPService.instance = new OTPService();
        }
        return OTPService.instance;
    }
    /**
     * Send OTP to phone number
     */
    async sendOTP(request) {
        try {
            const { phoneNumber, message } = request;
            // Validate phone number
            if (!(0, otp_1.isValidLaoPhoneNumber)(phoneNumber)) {
                logger_1.logger.warn('Invalid phone number format', { phoneNumber });
                return {
                    success: false,
                    message: 'Invalid Lao phone number format',
                };
            }
            const formattedPhone = (0, otp_1.formatPhoneNumber)(phoneNumber);
            // Check if OTP already exists and not expired
            const existingOTP = await otpStorage_service_1.otpStorageService.get(formattedPhone);
            if (existingOTP && !existingOTP.verified) {
                const remainingTime = Math.ceil((existingOTP.expiresAt.getTime() - Date.now()) / 1000);
                // 🟢 ປ່ຽນເງື່ອນໄຂ: ຖ້າເວລາເຫຼືອ >= 60 ວິນາທີ ຈຶ່ງຈະບັອກບໍ່ໃຫ້ຂໍໃໝ່
                // (ແປວ່າຖ້າເຫຼືອ < 60 ວິນາທີ ຈະຫຼຸດອອກຈາກ if ນີ້ແລ້ວໄປສ້າງ OTP ໃໝ່ເລີຍ)
                if (remainingTime >= 60) {
                    logger_1.logger.info('OTP already sent and not expired yet', {
                        phoneNumber: formattedPhone,
                        remainingTime,
                    });
                    // ຄຳນວນເວລາທີ່ຕ້ອງລໍຖ້າແທ້ໆ (ລົບອອກ 60 ວິນາທີທີ່ອະນຸລົມໃຫ້)
                    const waitTime = remainingTime - 60;
                    return {
                        success: false,
                        message: `OTP already sent. Please wait ${waitTime} second(s) before requesting again.`,
                        data: {
                            expiresIn: remainingTime,
                            waitToResend: waitTime // ບອກ Client ວ່າຕ້ອງລໍຖ້າອີກຈັກວິນາທີຈຶ່ງກົດໄດ້
                        },
                    };
                }
            }
            // Generate OTP (ຖ້າເວລາເຫຼືອ < 60 ມັນຈະມາເຮັດວຽກບ່ອນນີ້ ແລະ ທັບ OTP ເກົ່າ)
            const otp = (0, otp_1.generateOTP)();
            // Create message
            const smsMessage = (0, otp_1.createOTPMessage)(otp);
            // Send SMS via Lao Telecom
            const smsResult = await laotelecom_service_1.laoTelecomService.sendSMS(formattedPhone, smsMessage);
            console.log('SMS Result:', smsResult);
            if (smsResult.status === 'error') {
                logger_1.logger.error('Failed to send OTP SMS', {
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
            // Store OTP (ນີ້ຈະເປັນການ Replace ລະຫັດ OTP ເກົ່າທີ່ຍັງເຫຼືອເວລາ < 60 ວິນາທີນັ້ນຖິ້ມເລີຍ)
            await otpStorage_service_1.otpStorageService.store(formattedPhone, otp);
            logger_1.logger.info('OTP sent successfully', {
                phoneNumber: formattedPhone,
                messageId: smsResult.messageId,
            });
            return {
                success: true,
                message: 'OTP sent successfully',
                data: {
                    phoneNumber: formattedPhone,
                    expiresIn: sms_config_1.smsConfig.otp.expiryMinutes * 60,
                    messageId: smsResult.messageId,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error sending OTP', { error: error.message });
            return {
                success: false,
                message: 'An error occurred while sending OTP',
            };
        }
    }
    /**
     * Verify OTP
     */
    async verifyOTP(request) {
        try {
            const { phoneNumber, otp } = request;
            // Validate inputs
            if (!phoneNumber || !otp) {
                return {
                    success: false,
                    message: 'Phone number and OTP are required',
                };
            }
            if (!(0, otp_1.isValidLaoPhoneNumber)(phoneNumber)) {
                return {
                    success: false,
                    message: 'Invalid Lao phone number format',
                };
            }
            const formattedPhone = (0, otp_1.formatPhoneNumber)(phoneNumber);
            // Get remaining attempts before verification
            const remainingAttempts = await otpStorage_service_1.otpStorageService.getRemainingAttempts(formattedPhone);
            // Verify OTP
            const isValid = await otpStorage_service_1.otpStorageService.verify(formattedPhone, otp);
            if (!isValid) {
                const newRemainingAttempts = await otpStorage_service_1.otpStorageService.getRemainingAttempts(formattedPhone);
                logger_1.logger.warn('OTP verification failed', {
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
            logger_1.logger.info('OTP verified successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Error verifying OTP', { error: error.message });
            return {
                success: false,
                message: 'An error occurred while verifying OTP',
            };
        }
    }
    /**
     * Resend OTP
     */
    async resendOTP(phoneNumber) {
        const formattedPhone = (0, otp_1.formatPhoneNumber)(phoneNumber);
        // Delete existing OTP
        await otpStorage_service_1.otpStorageService.delete(formattedPhone);
        // Send new OTP
        return this.sendOTP({ phoneNumber });
    }
    /**
     * Check OTP status
     */
    async checkStatus(phoneNumber) {
        try {
            const formattedPhone = (0, otp_1.formatPhoneNumber)(phoneNumber);
            const otpData = await otpStorage_service_1.otpStorageService.get(formattedPhone);
            if (!otpData) {
                return {
                    success: false,
                    message: 'No active OTP found',
                };
            }
            const remainingTime = Math.max(0, Math.ceil((otpData.expiresAt.getTime() - Date.now()) / 1000));
            const remainingAttempts = await otpStorage_service_1.otpStorageService.getRemainingAttempts(formattedPhone);
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
        }
        catch (error) {
            logger_1.logger.error('Error checking OTP status', { error: error.message });
            return {
                success: false,
                message: 'An error occurred while checking OTP status',
            };
        }
    }
}
exports.OTPService = OTPService;
exports.otpService = OTPService.getInstance();
