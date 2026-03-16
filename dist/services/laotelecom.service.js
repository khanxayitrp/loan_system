"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.laoTelecomService = exports.LaoTelecomService = void 0;
const sms_config_1 = require("../config/sms.config");
const soap = __importStar(require("soap"));
const dotenv_1 = __importDefault(require("dotenv"));
// import { smsConfig } from '../config/config';
const logger_1 = require("../utils/logger");
const ltc_encrypt_1 = require("../utils/ltc-encrypt");
dotenv_1.default.config();
// Configuration: Choose encryption solution (1 or 2)
// Solution 1: userid + trans_id
// Solution 2: userid + trans_id + msisdn
const ENCRYPTION_SOLUTION = parseInt(process.env.LAO_TELECOM_ENCRYPTION_SOLUTION || '2', 10);
class LaoTelecomService {
    constructor() {
        this.client = null;
        this.isInitializing = false;
    }
    static getInstance() {
        if (!LaoTelecomService.instance) {
            LaoTelecomService.instance = new LaoTelecomService();
        }
        return LaoTelecomService.instance;
    }
    /**
     * Initialize SOAP client with retry logic
     */
    async getClient() {
        // Return existing client if available
        if (this.client) {
            return this.client;
        }
        // Wait if another initialization is in progress
        if (this.isInitializing) {
            await this.waitForInitialization();
            if (this.client) {
                return this.client;
            }
        }
        this.isInitializing = true;
        try {
            logger_1.logger.info('Initializing Lao Telecom SOAP client...', {
                wsdlUrl: sms_config_1.smsConfig.wsdlUrl,
                userId: sms_config_1.smsConfig.userId,
                encryptionSolution: ENCRYPTION_SOLUTION,
            });
            // Create SOAP client with timeout
            // Create SOAP client WITHOUT timeout in options
            // Create SOAP client WITHOUT timeout option
            this.client = await soap.createClientAsync(sms_config_1.smsConfig.wsdlUrl, {
                endpoint: sms_config_1.smsConfig.wsdlUrl?.replace('?WSDL', ''),
            });
            logger_1.logger.info('Lao Telecom SOAP client initialized successfully');
            // Log available methods for debugging
            if (process.env.NODE_ENV === 'development') {
                const description = this.client.describe();
                logger_1.logger.debug('Available SOAP services:', {
                    services: Object.keys(description),
                });
            }
            return this.client;
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Lao Telecom SOAP client', {
                error: error.message,
                stack: error.stack,
                wsdlUrl: sms_config_1.smsConfig.wsdlUrl,
            });
            throw new Error(`Failed to connect to Lao Telecom service: ${error.message}`);
        }
        finally {
            this.isInitializing = false;
        }
    }
    /**
     * Wait for ongoing initialization
     */
    async waitForInitialization(maxWaitMs = 10000) {
        const startTime = Date.now();
        while (this.isInitializing && (Date.now() - startTime) < maxWaitMs) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    /**
     * Build SOAP request message
     */
    async buildSMSRequest(params) {
        // Validate parameters
        const validation = (0, ltc_encrypt_1.validateSMSParams)({
            userId: params.userId,
            privateKey: params.privateKey,
            msisdn: params.msisdn,
            message: params.message,
            headerSMS: params.headerSMS,
        });
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        // Generate transaction ID if not provided
        const transactionId = params.transactionId || (0, ltc_encrypt_1.generateTransactionId)();
        // Format phone number for API
        const formattedMsisdn = (0, ltc_encrypt_1.formatPhoneNumberForAPI)(params.msisdn);
        // Encrypt key based on selected solution
        let encryptedKey;
        if (ENCRYPTION_SOLUTION === 1) {
            // Solution 1: userid + trans_id
            encryptedKey = await (0, ltc_encrypt_1.generateSolution1Key)(params.userId, transactionId, params.privateKey);
            logger_1.logger.debug('Using encryption Solution 1', {
                dataEncrypted: `${params.userId}${transactionId}`,
            });
        }
        else {
            // Solution 2: userid + trans_id + msisdn
            encryptedKey = await (0, ltc_encrypt_1.generateSolution2Key)(params.userId, transactionId, formattedMsisdn, params.privateKey);
            logger_1.logger.debug('Using encryption Solution 2', {
                dataEncrypted: `${params.userId}${transactionId}${formattedMsisdn}`,
            });
        }
        logger_1.logger.debug('Building SMS request', {
            userId: params.userId,
            transactionId,
            msisdn: formattedMsisdn,
            messageLength: params.message.length,
            headerSMS: params.headerSMS,
            encryptedKeyLength: encryptedKey.length,
            encryptionSolution: ENCRYPTION_SOLUTION,
        });
        // Build SOAP header
        const header = {
            userid: params.userId,
            key: encryptedKey,
            trans_id: transactionId,
            version: '', // Version can be empty as per spec
        };
        // Build SMS message
        const message = {
            header,
            msisdn: formattedMsisdn,
            headerSMS: params.headerSMS || sms_config_1.smsConfig.defaultSenderId || '',
            message: params.message,
        };
        // Build complete request
        return {
            msg: message,
        };
    }
    /**
     * Send SMS via Lao Telecom API
     * @param phoneNumber - Recipient phone number
     * @param message - SMS message content
     * @param senderId - Optional sender ID (max 11 chars)
     * @param transactionId - Optional custom transaction ID
     * @returns Promise<LaoTelecomSMSResponse>
     */
    async sendSMS(phoneNumber, message, senderId, transactionId) {
        try {
            const client = await this.getClient();
            // Build request parameters
            const params = {
                userId: sms_config_1.smsConfig.userId,
                privateKey: sms_config_1.smsConfig.privateKey,
                msisdn: phoneNumber,
                message: message,
                headerSMS: sms_config_1.smsConfig.defaultSenderId,
                transactionId: transactionId,
            };
            // Build SOAP request
            const request = await this.buildSMSRequest(params);
            logger_1.logger.info('Sending SMS via Lao Telecom', {
                phoneNumber: request.msg.msisdn,
                messageLength: request.msg.message.length,
                senderId: request.msg.headerSMS,
                transactionId: request.msg.header.trans_id,
                encryptionSolution: ENCRYPTION_SOLUTION,
            });
            // Call SOAP service
            //   let result;
            //   try {
            //     result = await client.sendSMSAsync(request);
            //   } catch (soapError: any) {
            //     logger.error('SOAP method call failed', {
            //       error: soapError.message,
            //       method: 'sendSMS',
            //     });
            //     throw soapError;
            //   }
            let result;
            try {
                result = await client.sendSMSAsync(request, { timeout: sms_config_1.smsConfig.timeoutMs });
            }
            catch (soapError) {
                logger_1.logger.error('SOAP method call failed', {
                    error: soapError.message,
                    method: 'sendSMS',
                });
                throw soapError;
            }
            // Parse response
            const responseData = result[0];
            const smsResult = responseData?.sendSMSResult;
            logger_1.logger.info('SMS API response received', {
                resultCode: smsResult?.resultCode,
                resultDesc: smsResult?.resultDesc,
                transactionId: smsResult?.trans_id,
            });
            // Parse result code
            const resultInfo = (0, ltc_encrypt_1.parseResultCode)(smsResult?.resultCode || '99');
            if (!resultInfo.success) {
                return {
                    status: 'error',
                    errorCode: smsResult?.resultCode || 'UNKNOWN_ERROR',
                    errorMessage: smsResult?.resultDesc || resultInfo.description,
                    transactionId: smsResult?.trans_id,
                };
            }
            return {
                status: 'success',
                messageId: smsResult?.trans_id,
                transactionId: smsResult?.trans_id,
                sendSMSResult: smsResult,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send SMS via Lao Telecom', {
                error: error.message,
                phoneNumber,
                stack: error.stack,
            });
            // Reset client on connection errors
            if (error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT') ||
                error.message.includes('ENOTFOUND')) {
                this.client = null;
            }
            return {
                status: 'error',
                errorCode: error.code || 'UNKNOWN_ERROR',
                errorMessage: error.message || 'Failed to send SMS',
            };
        }
    }
    /**
     * Get account balance (if supported by API)
     * Note: This might require a different SOAP method
     */
    async getBalance() {
        try {
            const client = await this.getClient();
            logger_1.logger.info('Checking account balance');
            // Build header for balance check
            const transactionId = (0, ltc_encrypt_1.generateTransactionId)('BAL');
            // Use Solution 1 for balance check (no MSISDN)
            const encryptedKey = await (0, ltc_encrypt_1.generateSolution1Key)(sms_config_1.smsConfig.userId, transactionId, sms_config_1.smsConfig.privateKey);
            const header = {
                userid: sms_config_1.smsConfig.userId,
                key: encryptedKey,
                trans_id: transactionId,
                version: '',
            };
            // Try common balance check methods
            //   if (typeof client.getBalance === 'function') {
            //     const result = await client.getBalanceAsync({ header });
            //     return result[0];
            //   } else if (typeof client.checkBalance === 'function') {
            //     const result = await client.checkBalanceAsync({ header });
            //     return result[0];
            //   }
            if (typeof client.getBalance === 'function') {
                const result = await client.getBalanceAsync({ header }, { timeout: sms_config_1.smsConfig.timeoutMs });
                return result[0];
            }
            else if (typeof client.checkBalance === 'function') {
                const result = await client.checkBalanceAsync({ header }, { timeout: sms_config_1.smsConfig.timeoutMs });
                return result[0];
            }
            else {
                throw new Error('Balance check not supported by this API');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to check balance', {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Get WSDL description (for debugging)
     */
    /**
   * Get WSDL description (for debugging)
   */
    async describeService() {
        try {
            const client = await this.getClient();
            // Cast to Record to safely handle dynamic SOAP description structure
            const description = client.describe();
            const formatted = {
                services: Object.keys(description),
                methods: {},
                encryptionSolution: ENCRYPTION_SOLUTION,
            };
            for (const [serviceName, service] of Object.entries(description)) {
                formatted.methods[serviceName] = {};
                for (const [portName, port] of Object.entries(service)) {
                    // Safely extract method names from port object
                    formatted.methods[serviceName][portName] = Object.keys(port);
                }
            }
            return formatted;
        }
        catch (error) {
            logger_1.logger.error('Failed to describe service', { error });
            throw error;
        }
    }
    /**
     * Reset SOAP client connection
     */
    resetClient() {
        logger_1.logger.info('Resetting SOAP client');
        this.client = null;
    }
    /**
     * Test connection to Lao Telecom API
     */
    async testConnection() {
        try {
            await this.getClient();
            logger_1.logger.info('Connection test successful', {
                encryptionSolution: ENCRYPTION_SOLUTION,
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Connection test failed', { error });
            return false;
        }
    }
    /**
     * Get current encryption solution
     */
    getEncryptionSolution() {
        return ENCRYPTION_SOLUTION;
    }
}
exports.LaoTelecomService = LaoTelecomService;
exports.laoTelecomService = LaoTelecomService.getInstance();
