"use strict";
// src/controllers/upload.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const document_service_1 = __importDefault(require("../services/document.service"));
const fileUpload_service_1 = __importDefault(require("../services/fileUpload.service"));
const file_types_1 = require("../types/file.types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class UploadController {
    async handleFileUploadResponse(res, result, successMessage, errorMessage) {
        if (result.success === false) {
            res.status(400).json({
                success: false,
                message: result.error || errorMessage
            });
            return;
        }
        res.status(201).json({
            success: true,
            message: successMessage,
            data: result.data || result
        });
    }
    static validateRequiredFields(req, required) {
        for (const field of required) {
            if (!req.body[field] && !req.params[field]) {
                throw new errors_1.ValidationError(`Missing required field: ${field}`);
            }
        }
    }
    /**
     * Best Practice: ใช้ method เดียวสำหรับทุกประเภท upload แต่แยก logic ตาม config
     * แต่เนื่องจากคุณมีหลายประเภทชัดเจน จึงคงแยก method แต่เพิ่ม abstraction เล็กน้อย
     */
    // ── Application Documents ──────────────────────────────────────
    async uploadApplicationDocument(req, res) {
        try {
            UploadController.validateRequiredFields(req, ['application_id', 'doc_type']);
            const { application_id } = req.params;
            const { doc_type } = req.body;
            if (!req.file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            // Optional: เช็คสิทธิ์เฉพาะ application นี้ (เช่น เป็น requester หรือ approver)
            // const app = await db.loan_applications.findByPk(application_id);
            // if (req.user?.id !== app?.requester_id && req.user?.id !== app?.approver_id) {
            //   throw new ForbiddenError('You are not authorized to upload documents for this application');
            // }
            const document = await document_service_1.default.uploadApplicationDocument({
                application_id: parseInt(application_id),
                doc_type: doc_type,
                original_filename: req.file.originalname,
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                file: req.file
            });
            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                data: document
            });
        }
        catch (error) {
            logger_1.logger.error('Error in uploadApplicationDocument:', error);
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    async uploadMultipleDocuments(req, res) {
        try {
            UploadController.validateRequiredFields(req, ['application_id']);
            const { application_id } = req.params;
            const files = req.files;
            const { doc_types } = req.body;
            if (!files?.length) {
                throw new errors_1.ValidationError('No files uploaded');
            }
            if (!doc_types || !Array.isArray(doc_types) || doc_types.length !== files.length) {
                throw new errors_1.ValidationError('doc_types must be an array with the same length as uploaded files');
            }
            const documents = files.map((file, index) => ({
                file: file,
                original_filename: file.originalname,
                file_size: file.size,
                mime_type: file.mimetype,
                doc_type: doc_types[index]
            }));
            const results = await document_service_1.default.uploadMultipleDocuments(parseInt(application_id), documents);
            res.status(201).json({
                success: true,
                message: `${results.length} documents uploaded successfully`,
                data: results
            });
        }
        catch (error) {
            logger_1.logger.error('Error in uploadMultipleDocuments:', error);
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    async getApplicationDocuments(req, res) {
        try {
            const { application_id } = req.params;
            const documents = await document_service_1.default.getApplicationDocuments(parseInt(application_id));
            res.status(200).json({
                success: true,
                data: documents
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    async deleteDocument(req, res) {
        try {
            const { document_id } = req.params;
            await document_service_1.default.deleteDocument(parseInt(document_id));
            res.status(200).json({
                success: true,
                message: 'Document deleted successfully'
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    async replaceDocument(req, res) {
        try {
            const { document_id } = req.params;
            if (!req.file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            const updated = await document_service_1.default.replaceDocument(parseInt(document_id), req.file);
            res.status(200).json({
                success: true,
                message: 'Document replaced successfully',
                data: updated
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    // ── Product Images ─────────────────────────────────────────────
    async uploadProductImage(req, res) {
        try {
            UploadController.validateRequiredFields(req, ['product_id']);
            if (!req.file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            const { product_id } = req.params;
            const result = await fileUpload_service_1.default.uploadSingleFile(req.file, file_types_1.FILE_UPLOAD_CONFIG.PRODUCT_IMAGES, `product_${product_id}`);
            if (!result.success) {
                throw new errors_1.ValidationError(result.error || 'Failed to upload product image');
            }
            res.status(201).json({
                success: true,
                message: 'Product image uploaded successfully',
                data: {
                    file_url: result.fileUrl,
                    file_name: result.fileName,
                    file_path: result.filePath
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    async uploadProductGallery(req, res) {
        try {
            const { product_id } = req.params;
            const files = req.files;
            if (!files?.length) {
                throw new errors_1.ValidationError('No files uploaded');
            }
            // ✅ 2. Log ข้อมูลไฟล์สำหรับ debug
            logger_1.logger.info('Uploading files:', {
                productId: product_id,
                fileCount: files.length,
                files: files.map(f => ({
                    originalName: f.originalname,
                    mimetype: f.mimetype,
                    size: f.size,
                    hasBuffer: !!f.buffer,
                    bufferSize: f.buffer?.length,
                    bufferPreview: f.buffer?.slice(0, 20).toString('hex')
                }))
            });
            // // ✅ 3. ตรวจสอบว่า buffer เป็น HTML หรือไม่
            // for (const file of files) {
            //   if (file.buffer && file.buffer.length > 0) {
            //     const bufferPreview = file.buffer.slice(0, 20).toString('utf-8');
            //     if (bufferPreview.includes('<!DOCTYPE') || bufferPreview.includes('<html')) {
            //       logger.error('File is HTML, not image:', {
            //         fileName: file.originalname,
            //         bufferPreview
            //       });
            //       throw new ValidationError(`ไฟล์ ${file.originalname} เป็น HTML ไม่ใช่รูปภาพ`);
            //     }
            //   }
            // }
            const results = await fileUpload_service_1.default.uploadMultipleFiles(files, file_types_1.FILE_UPLOAD_CONFIG.PRODUCT_IMAGES, `product_${product_id}_gallery`);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            res.status(201).json({
                success: successful.length > 0,
                message: `${successful.length} of ${files.length} images uploaded successfully`,
                data: {
                    uploaded: successful.map(r => ({
                        file_url: r.fileUrl,
                        file_name: r.fileName
                    })),
                    failed: failed.map(r => ({
                        error: r.error,
                        fileName: files[failed.indexOf(r)]?.originalname
                    }))
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    async uploadLocationImage(req, res) {
        try {
            const { customer_id } = req.params;
            const files = req.files;
            if (!files?.length) {
                throw new errors_1.ValidationError('No files uploaded');
            }
            logger_1.logger.info('Uploading location images:', {
                customerId: customer_id,
                fileCount: files.length,
                files: files.map(f => ({
                    originalName: f.originalname,
                    mimetype: f.mimetype,
                    size: f.size,
                    hasBuffer: !!f.buffer,
                    bufferSize: f.buffer?.length,
                    bufferPreview: f.buffer?.slice(0, 20).toString('hex')
                }))
            });
            const results = await fileUpload_service_1.default.uploadMultipleFiles(files, file_types_1.FILE_UPLOAD_CONFIG.LOCATION_IMAGES, `customer_${customer_id}_location`);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            res.status(201).json({
                success: successful.length > 0,
                message: `${successful.length} of ${files.length} location images uploaded successfully`,
                data: {
                    uploaded: successful.map(r => ({
                        file_url: r.fileUrl,
                        file_name: r.fileName
                    })),
                    failed: failed.map(r => ({
                        error: r.error,
                        fileName: files[failed.indexOf(r)]?.originalname
                    }))
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    // ── Shop Logo ──────────────────────────────────────────────────
    async uploadShopLogo(req, res) {
        try {
            // this.validateRequiredFields(req, ['partner_id']);
            console.log('[UploadController] uploadShopLogo called');
            console.log('[UploadController] Params:', req.params);
            console.log('[UploadController] File:', req.file ? {
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            } : 'No file');
            const { partner_id } = req.params;
            if (!partner_id) {
                throw new errors_1.ValidationError('partner_id is required');
            }
            if (!req.file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            console.log('[UploadController] Uploading logo for shop:', partner_id);
            const result = await fileUpload_service_1.default.uploadSingleFile(req.file, file_types_1.FILE_UPLOAD_CONFIG.SHOP_LOGOS, `shop_${partner_id}_logo`);
            if (!result.success) {
                throw new errors_1.ValidationError(result.error || 'Failed to upload shop logo');
            }
            res.status(201).json({
                success: true,
                message: 'Shop logo uploaded successfully',
                data: {
                    file_url: result.fileUrl,
                    file_name: result.fileName
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    // ── Payment Proof ──────────────────────────────────────────────
    async uploadPaymentProof(req, res) {
        try {
            UploadController.validateRequiredFields(req, ['transaction_id']);
            if (!req.file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            const { transaction_id } = req.params;
            const result = await fileUpload_service_1.default.uploadSingleFile(req.file, file_types_1.FILE_UPLOAD_CONFIG.PAYMENT_PROOFS, `payment_${transaction_id}`);
            if (!result.success) {
                throw new errors_1.ValidationError(result.error || 'Failed to upload payment proof');
            }
            res.status(201).json({
                success: true,
                message: 'Payment proof uploaded successfully',
                data: {
                    file_url: result.fileUrl,
                    file_name: result.fileName
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
}
exports.default = new UploadController();
