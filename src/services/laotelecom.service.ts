import { smsConfig } from '../config/sms.config';
import * as soap from 'soap';
import dotenv from 'dotenv';

// import { smsConfig } from '../config/config';
import { logger } from '../utils/logger';
import {
    LaoTelecomSMSRequest,
    LaoTelecomSMSResponse,
    LaoTelecomSOAPHeader,
    LaoTelecomSMSMessage,
    SMSRequestParams,
} from '../types/sms.types';
import {
    generateSolution1Key,
    generateSolution2Key,
    generateTransactionId,
    validateSMSParams,
    parseResultCode,
    formatPhoneNumberForAPI,
} from '../utils/ltc-encrypt';

dotenv.config();
// Configuration: Choose encryption solution (1 or 2)
// Solution 1: userid + trans_id
// Solution 2: userid + trans_id + msisdn
const ENCRYPTION_SOLUTION = parseInt(process.env.LAO_TELECOM_ENCRYPTION_SOLUTION || '2', 10);

export class LaoTelecomService {
    private static instance: LaoTelecomService;
    private client: soap.Client | null = null;
    private isInitializing: boolean = false;

    private constructor() { }

    public static getInstance(): LaoTelecomService {
        if (!LaoTelecomService.instance) {
            LaoTelecomService.instance = new LaoTelecomService();
        }
        return LaoTelecomService.instance;
    }

    /**
     * Initialize SOAP client with retry logic
     */
    private async getClient(): Promise<soap.Client> {
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
            logger.info('Initializing Lao Telecom SOAP client...', {
                wsdlUrl: smsConfig.wsdlUrl!,
                userId: smsConfig.userId!,
                encryptionSolution: ENCRYPTION_SOLUTION,
            });

            // Create SOAP client with timeout
            // Create SOAP client WITHOUT timeout in options
            // Create SOAP client WITHOUT timeout option
            this.client = await soap.createClientAsync(smsConfig.wsdlUrl!, {
                endpoint: smsConfig.wsdlUrl?.replace('?WSDL', ''),
            });


            logger.info('Lao Telecom SOAP client initialized successfully');

            // Log available methods for debugging
            if (process.env.NODE_ENV === 'development') {
                const description = this.client.describe();
                logger.debug('Available SOAP services:', {
                    services: Object.keys(description),
                });
            }

            return this.client;
        } catch (error: any) {
            logger.error('Failed to initialize Lao Telecom SOAP client', {
                error: error.message,
                stack: error.stack,
                wsdlUrl: smsConfig.wsdlUrl!,
            });
            throw new Error(`Failed to connect to Lao Telecom service: ${error.message}`);
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Wait for ongoing initialization
     */
    private async waitForInitialization(maxWaitMs: number = 10000): Promise<void> {
        const startTime = Date.now();
        while (this.isInitializing && (Date.now() - startTime) < maxWaitMs) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Build SOAP request message
     */
    private async buildSMSRequest(params: SMSRequestParams): Promise<LaoTelecomSMSRequest> {
        // Validate parameters
        const validation = validateSMSParams({
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
        const transactionId = params.transactionId || generateTransactionId();

        // Format phone number for API
        const formattedMsisdn = formatPhoneNumberForAPI(params.msisdn);

        // Encrypt key based on selected solution
        let encryptedKey: string;
        if (ENCRYPTION_SOLUTION === 1) {
            // Solution 1: userid + trans_id
            encryptedKey = await generateSolution1Key(
                params.userId,
                transactionId,
                params.privateKey
            );
            logger.debug('Using encryption Solution 1', {
                dataEncrypted: `${params.userId}${transactionId}`,
            });
        } else {
            // Solution 2: userid + trans_id + msisdn
            encryptedKey = await generateSolution2Key(
                params.userId,
                transactionId,
                formattedMsisdn,
                params.privateKey
            );
            logger.debug('Using encryption Solution 2', {
                dataEncrypted: `${params.userId}${transactionId}${formattedMsisdn}`,
            });
        }

        logger.debug('Building SMS request', {
            userId: params.userId,
            transactionId,
            msisdn: formattedMsisdn,
            messageLength: params.message.length,
            headerSMS: params.headerSMS,
            encryptedKeyLength: encryptedKey.length,
            encryptionSolution: ENCRYPTION_SOLUTION,
        });

        // Build SOAP header
        const header: LaoTelecomSOAPHeader = {
            userid: params.userId,
            key: encryptedKey,
            trans_id: transactionId,
            version: '', // Version can be empty as per spec
        };

        // Build SMS message
        const message: LaoTelecomSMSMessage = {
            header,
            msisdn: formattedMsisdn,
            headerSMS: params.headerSMS || smsConfig.defaultSenderId || '',
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
    public async sendSMS(
        phoneNumber: string,
        message: string,
        senderId?: string,
        transactionId?: string
    ): Promise<LaoTelecomSMSResponse> {
        try {
            const client = await this.getClient();

            // Build request parameters
            const params: SMSRequestParams = {
                userId: smsConfig.userId!,
                privateKey: smsConfig.privateKey!,
                msisdn: phoneNumber,
                message: message,
                headerSMS: smsConfig.defaultSenderId,
                transactionId: transactionId,
            };

            // Build SOAP request
            const request = await this.buildSMSRequest(params);

            logger.info('Sending SMS via Lao Telecom', {
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
                result = await client.sendSMSAsync(request, { timeout: smsConfig.timeoutMs });
            } catch (soapError: any) {
                logger.error('SOAP method call failed', {
                    error: soapError.message,
                    method: 'sendSMS',
                });
                throw soapError;
            }

            // Parse response
            const responseData = result[0];
            const smsResult = responseData?.sendSMSResult;

            logger.info('SMS API response received', {
                resultCode: smsResult?.resultCode,
                resultDesc: smsResult?.resultDesc,
                transactionId: smsResult?.trans_id,
            });

            // Parse result code
            const resultInfo = parseResultCode(smsResult?.resultCode || '99');

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

        } catch (error: any) {
            logger.error('Failed to send SMS via Lao Telecom', {
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
    public async getBalance(): Promise<any> {
        try {
            const client = await this.getClient();

            logger.info('Checking account balance');

            // Build header for balance check
            const transactionId = generateTransactionId('BAL');

            // Use Solution 1 for balance check (no MSISDN)
            const encryptedKey = await generateSolution1Key(
                smsConfig.userId!,
                transactionId,
                smsConfig.privateKey!
            );

            const header: LaoTelecomSOAPHeader = {
                userid: smsConfig.userId!,
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
                const result = await client.getBalanceAsync({ header }, { timeout: smsConfig.timeoutMs });
                return result[0];
            } else if (typeof client.checkBalance === 'function') {
                const result = await client.checkBalanceAsync({ header }, { timeout: smsConfig.timeoutMs });
                return result[0];
            }
            else {
                throw new Error('Balance check not supported by this API');
            }
        } catch (error: any) {
            logger.error('Failed to check balance', {
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
    public async describeService(): Promise<{
        services: string[];
        methods: { [serviceName: string]: { [portName: string]: string[] } };
        encryptionSolution: number;
    }> {
        try {
            const client = await this.getClient();
            // Cast to Record to safely handle dynamic SOAP description structure
            const description = client.describe() as Record<string, Record<string, Record<string, unknown>>>;

            const formatted = {
                services: Object.keys(description),
                methods: {} as { [serviceName: string]: { [portName: string]: string[] } },
                encryptionSolution: ENCRYPTION_SOLUTION,
            };

            for (const [serviceName, service] of Object.entries(description)) {
                formatted.methods[serviceName] = {};
                for (const [portName, port] of Object.entries(service)) {
                    // Safely extract method names from port object
                    formatted.methods[serviceName][portName] = Object.keys(port as Record<string, unknown>);
                }
            }

            return formatted;
        } catch (error) {
            logger.error('Failed to describe service', { error });
            throw error;
        }
    }

    /**
     * Reset SOAP client connection
     */
    public resetClient(): void {
        logger.info('Resetting SOAP client');
        this.client = null;
    }

    /**
     * Test connection to Lao Telecom API
     */
    public async testConnection(): Promise<boolean> {
        try {
            await this.getClient();
            logger.info('Connection test successful', {
                encryptionSolution: ENCRYPTION_SOLUTION,
            });
            return true;
        } catch (error) {
            logger.error('Connection test failed', { error });
            return false;
        }
    }

    /**
     * Get current encryption solution
     */
    public getEncryptionSolution(): number {
        return ENCRYPTION_SOLUTION;
    }
}

export const laoTelecomService = LaoTelecomService.getInstance();