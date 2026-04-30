"use strict";
// src/middlewares/upload.middleware.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadMiddleware = exports.uploadSignature = exports.uploadPaymentProof = exports.uploadShopLogo = exports.uploadProductImage = exports.uploadVariantImage = exports.uploadLocationImage = exports.uploadDocument = void 0;
const multer_1 = __importDefault(require("multer"));
const file_types_1 = require("../types/file.types");
/**
 * Multer memory storage - เก็บไฟล์ใน buffer เพื่อให้ service จัดการต่อ
 */
const memoryStorage = multer_1.default.memoryStorage();
/**
 * File filter function
 */
const createFileFilter = (allowedMimeTypes) => {
    return (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
        }
    };
};
/**
 * Multer configurations for different upload types
 */
// สำหรับเอกสาร (ID Card, House Reg, Salary Slip)
exports.uploadDocument = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: file_types_1.FILE_UPLOAD_CONFIG.DOCUMENTS.maxFileSize
    },
    fileFilter: createFileFilter(file_types_1.FILE_UPLOAD_CONFIG.DOCUMENTS.allowedMimeTypes)
});
// สำหรับรูปสถานที
exports.uploadLocationImage = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: file_types_1.FILE_UPLOAD_CONFIG.LOCATION_IMAGES.maxFileSize,
        files: 2 // จำกัดไม่เกิน 2 รูป
    },
    fileFilter: createFileFilter(file_types_1.FILE_UPLOAD_CONFIG.LOCATION_IMAGES.allowedMimeTypes)
});
// สำหรับรูปสินค้าย่อย
exports.uploadVariantImage = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: file_types_1.FILE_UPLOAD_CONFIG.VARIANT_IMAGES.maxFileSize,
        files: 2 // จำกัดไม่เกิน 2 รูป
    },
    fileFilter: createFileFilter(file_types_1.FILE_UPLOAD_CONFIG.VARIANT_IMAGES.allowedMimeTypes)
});
// สำหรับรูปสินค้า
exports.uploadProductImage = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: file_types_1.FILE_UPLOAD_CONFIG.PRODUCT_IMAGES.maxFileSize,
        files: 5 // จำกัดไม่เกิน 5 รูป
    },
    fileFilter: createFileFilter(file_types_1.FILE_UPLOAD_CONFIG.PRODUCT_IMAGES.allowedMimeTypes)
});
// สำหรับโลโก้ร้านค้า
exports.uploadShopLogo = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: file_types_1.FILE_UPLOAD_CONFIG.SHOP_LOGOS.maxFileSize
    },
    fileFilter: createFileFilter(file_types_1.FILE_UPLOAD_CONFIG.SHOP_LOGOS.allowedMimeTypes)
});
// สำหรับหลักฐานการชำระเงิน
exports.uploadPaymentProof = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: file_types_1.FILE_UPLOAD_CONFIG.PAYMENT_PROOFS.maxFileSize
    },
    fileFilter: createFileFilter(file_types_1.FILE_UPLOAD_CONFIG.PAYMENT_PROOFS.allowedMimeTypes)
});
// สำหรับรูปภาพเซ็นชื่อ
exports.uploadSignature = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: file_types_1.FILE_UPLOAD_CONFIG.SIGNATURE_IMAGES.maxFileSize
    },
    fileFilter: createFileFilter(file_types_1.FILE_UPLOAD_CONFIG.SIGNATURE_IMAGES.allowedMimeTypes)
});
/**
 * Generic upload middleware
 */
const createUploadMiddleware = (maxFileSize, allowedMimeTypes, maxFiles = 1) => {
    return (0, multer_1.default)({
        storage: memoryStorage,
        limits: {
            fileSize: maxFileSize,
            files: maxFiles
        },
        fileFilter: createFileFilter(allowedMimeTypes)
    });
};
exports.createUploadMiddleware = createUploadMiddleware;
