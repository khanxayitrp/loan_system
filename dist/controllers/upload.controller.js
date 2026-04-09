"use strict";
// // src/controllers/upload.controller.ts
// // เวอร์ชันปรับปรุงให้เป็น Best Practice สำหรับระบบที่มีหลายประเภทไฟล์ (2026 style)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const document_service_1 = __importDefault(require("../services/document.service"));
const fileUpload_service_1 = __importDefault(require("../services/fileUpload.service"));
const file_types_1 = require("../types/file.types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const init_models_1 = require("../models/init-models"); // 🌟 Import DB สำหรับค้นหาไฟล์เก่า
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
    // ============================================================================
    // ── 1. Application Documents (เอกสารสัญญาสินเชื่อ) ─────────────────────────
    // ============================================================================
    async uploadApplicationDocument(req, res) {
        try {
            UploadController.validateRequiredFields(req, ['application_id', 'doc_type']);
            const { application_id } = req.params;
            const { doc_type } = req.body;
            if (!req.file)
                throw new errors_1.ValidationError('No file uploaded');
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
            if (!files?.length)
                throw new errors_1.ValidationError('No files uploaded');
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
            res.status(200).json({ success: true, data: documents });
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
            res.status(200).json({ success: true, message: 'Document deleted successfully' });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    async replaceDocument(req, res) {
        try {
            const { document_id } = req.params;
            if (!req.file)
                throw new errors_1.ValidationError('No file uploaded');
            const updated = await document_service_1.default.replaceDocument(parseInt(document_id), req.file);
            res.status(200).json({ success: true, message: 'Document replaced successfully', data: updated });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    // ============================================================================
    // ── 2. Product Images (รูปสินค้าหลัก และ Gallery) ───────────────────────────
    // ============================================================================
    async uploadProductImage(req, res) {
        try {
            UploadController.validateRequiredFields(req, ['product_id']);
            if (!req.file)
                throw new errors_1.ValidationError('No file uploaded');
            const { product_id } = req.params;
            // 🟢 1. เช็ครูปสินค้าเก่าเพื่อลบ (อย่าลืมเช็คชื่อฟิลด์ภาพสินค้าใน Model db.products ด้วยนะครับ)
            const product = await init_models_1.db.products.findByPk(product_id);
            const oldImageUrl = product?.image_url;
            // 🟢 2. อัปโหลดรูปใหม่
            const result = await fileUpload_service_1.default.uploadSingleFile(req.file, file_types_1.FILE_UPLOAD_CONFIG.PRODUCT_IMAGES, `product_${product_id}_${Date.now()}`);
            if (!result.success)
                throw new errors_1.ValidationError(result.error || 'Failed to upload product image');
            // 🟢 3. สั่งลบรูปเก่าจาก MinIO
            if (oldImageUrl) {
                fileUpload_service_1.default.deleteFile(oldImageUrl).catch(err => logger_1.logger.warn(`Failed to delete orphaned product image: ${oldImageUrl}`, err));
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
            if (!files?.length)
                throw new errors_1.ValidationError('No files uploaded');
            // (Gallery จะถูกดักลบไฟล์เก่าอยู่ใน ProductGalleryService.addImageGallery() แล้ว จึงอัปโหลดได้เลย)
            const results = await fileUpload_service_1.default.uploadMultipleFiles(files, file_types_1.FILE_UPLOAD_CONFIG.PRODUCT_IMAGES, `product_${product_id}_gallery_${Date.now()}`);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            res.status(201).json({
                success: successful.length > 0,
                message: `${successful.length} of ${files.length} images uploaded successfully`,
                data: {
                    uploaded: successful.map(r => ({ file_url: r.fileUrl, file_name: r.fileName })),
                    failed: failed.map(r => ({ error: r.error, fileName: files[failed.indexOf(r)]?.originalname }))
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    // ============================================================================
    // ── 3. Variant Images (รูปตัวเลือกสินค้า) ────────────────────────────────────
    // ============================================================================
    async uploadVariantImage(req, res) {
        try {
            // 🟢 1. รับไฟล์เดียว (Single File) ไม่ต้องใช้ product_id เพราะเป็น Pre-upload
            const file = req.file;
            if (!file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            // 🟢 2. Log ข้อมูลไฟล์สำหรับ debug
            logger_1.logger.info('Uploading variant image:', {
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                hasBuffer: !!file.buffer,
                bufferPreview: file.buffer ? file.buffer.slice(0, 20).toString('hex') : null
            });
            // 🟢 3. สร้าง Prefix โดยใช้ Timestamp เพื่อให้ชื่อไฟล์ไม่ซ้ำกัน
            const timestamp = Date.now();
            const prefix = `variant_${timestamp}`;
            // 🟢 4. เรียกใช้ Service อัปโหลด (ถ้าคุณมี uploadSingleFile ใช้ตัวนั้นได้เลย 
            // แต่ถ้ามีแค่ uploadMultipleFiles ก็สามารถส่งไฟล์ใส่ Array เข้าไปแบบนี้ได้ครับ)
            // const results = await fileUploadService.uploadMultipleFiles(
            //   [file] as UploadedFile[], // ส่งเข้าไปเป็น Array ที่มี 1 ไฟล์
            //   FILE_UPLOAD_CONFIG.PRODUCT_IMAGES, // หรือสร้าง config ใหม่เป็น VARIANT_IMAGES ก็ได้
            //   prefix
            // );
            const results = await fileUpload_service_1.default.uploadSingleFile(req.file, file_types_1.FILE_UPLOAD_CONFIG.VARIANT_IMAGES, prefix);
            if (!results || !results.success) {
                throw new Error(results?.error || 'Failed to upload variant image');
            }
            // 🟢 5. ตอบกลับด้วยโครงสร้างที่ตรงกับที่ Frontend (ProductPage.vue) คาดหวัง
            res.status(201).json({
                success: true,
                message: 'Variant image uploaded successfully',
                file_url: results.fileUrl, // ส่ง URL ออกไปตรงๆ ชั้นนอก
                data: {
                    file_url: results.fileUrl,
                    file_name: results.fileName
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status || 500).json(errResp);
        }
    }
    // ============================================================================
    // ── 4. Location Images (รูปร้านค้า/ที่ตั้งลูกค้า) ──────────────────────────
    // ============================================================================
    async uploadLocationImage(req, res) {
        try {
            const { customer_id, application_id } = req.params;
            const files = req.files;
            if (!files?.length)
                throw new errors_1.ValidationError('No files uploaded');
            // 🟢 1. เช็คข้อมูลการลงพื้นที่เก่า
            const visit = await init_models_1.db.loan_field_visits.findOne({
                where: { application_id: application_id }
            });
            // รวบรวม URL รูปเก่าที่มีอยู่ในระบบ (ถ้ามี)
            const oldUrls = [];
            if (visit?.photo_url_1)
                oldUrls.push(visit.photo_url_1);
            if (visit?.photo_url_2)
                oldUrls.push(visit.photo_url_2);
            // (ออปชันเสริมเพื่อความปลอดภัย) ถ้า Frontend ส่ง URL ของรูปเก่าที่ต้องการ "เก็บไว้" มาด้วย
            // เช่น req.body.retained_urls = ['http://minio.../photo1.jpg']
            let retainedUrls = [];
            if (req.body.retained_urls) {
                retainedUrls = Array.isArray(req.body.retained_urls)
                    ? req.body.retained_urls
                    : [req.body.retained_urls];
            }
            // กรองเอาเฉพาะรูปเก่าที่ "ไม่ได้อยู่ในรายการที่ต้องการเก็บไว้" (นั่นคือไฟล์ที่ต้องลบทิ้ง)
            const filesToDelete = oldUrls.filter(url => !retainedUrls.includes(url));
            // 🟢 2. อัปโหลดภาพใหม่ขึ้น MinIO
            const results = await fileUpload_service_1.default.uploadMultipleFiles(files, file_types_1.FILE_UPLOAD_CONFIG.LOCATION_IMAGES, `customer_${customer_id}_location_${Date.now()}`);
            // 🟢 3. สั่งลบภาพเดิมที่ไม่ได้ใช้แล้วออกจาก MinIO (Background Process)
            if (filesToDelete.length > 0) {
                // ใช้ deleteFiles เพื่อลบทีเดียวหลายไฟล์เป็น Array ได้เลย
                fileUpload_service_1.default.deleteFiles(filesToDelete).catch(err => logger_1.logger.warn(`Failed to delete old location images:`, err));
            }
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            res.status(201).json({
                success: successful.length > 0,
                message: `${successful.length} of ${files.length} location images uploaded successfully`,
                data: {
                    uploaded: successful.map(r => ({ file_url: r.fileUrl, file_name: r.fileName })),
                    failed: failed.map(r => ({ error: r.error, fileName: files[failed.indexOf(r)]?.originalname }))
                }
            });
        }
        catch (error) {
            const errResp = (0, errors_1.handleErrorResponse)(error);
            res.status(errResp.status).json(errResp);
        }
    }
    // ============================================================================
    // ── 5. Shop Logo (โลโก้ร้านค้า/Partner) ──────────────────────────────────────
    // ============================================================================
    async uploadShopLogo(req, res) {
        try {
            const { partner_id } = req.params;
            if (!partner_id)
                throw new errors_1.ValidationError('partner_id is required');
            if (!req.file)
                throw new errors_1.ValidationError('No file uploaded');
            // 🟢 1. ค้นหาข้อมูลร้านค้าเก่าเพื่อลบ
            const partner = await init_models_1.db.partners.findByPk(partner_id);
            const oldLogoUrl = partner?.shop_logo_url; // (เช็คชื่อฟิลด์โลโก้ใน db.partners)
            // 🟢 2. อัปโหลดโลโก้ใหม่
            const result = await fileUpload_service_1.default.uploadSingleFile(req.file, file_types_1.FILE_UPLOAD_CONFIG.SHOP_LOGOS, `shop_${partner_id}_logo_${Date.now()}`);
            if (!result.success)
                throw new errors_1.ValidationError(result.error || 'Failed to upload shop logo');
            // 🟢 3. ลบโลโก้เก่าออกจาก MinIO
            if (oldLogoUrl) {
                fileUpload_service_1.default.deleteFile(oldLogoUrl).catch(err => logger_1.logger.warn(`Failed to delete orphaned shop logo: ${oldLogoUrl}`, err));
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
    // ============================================================================
    // ── 6. Payment Proof (สลิปการโอนเงิน) ───────────────────────────────────────
    // ============================================================================
    async uploadPaymentProof(req, res) {
        try {
            UploadController.validateRequiredFields(req, ['transaction_id']);
            if (!req.file)
                throw new errors_1.ValidationError('No file uploaded');
            const { transaction_id } = req.params;
            // 🟢 1. เช็คสลิปการโอนเก่า (ถ้ามี)
            const transaction = await init_models_1.db.payment_transactions.findByPk(transaction_id);
            const oldProofUrl = transaction?.proof_url; // (เช็คชื่อฟิลด์สลิปใน db.transactions)
            // 🟢 2. อัปโหลดสลิปใหม่
            const result = await fileUpload_service_1.default.uploadSingleFile(req.file, file_types_1.FILE_UPLOAD_CONFIG.PAYMENT_PROOFS, `payment_${transaction_id}_${Date.now()}`);
            if (!result.success)
                throw new errors_1.ValidationError(result.error || 'Failed to upload payment proof');
            // 🟢 3. ลบสลิปเก่าออก (หากเป็นการอัปโหลดเพื่อแก้ไขสลิปเดิม)
            if (oldProofUrl) {
                fileUpload_service_1.default.deleteFile(oldProofUrl).catch(err => logger_1.logger.warn(`Failed to delete old payment proof: ${oldProofUrl}`, err));
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
