"use strict";
// src/types/file.types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_EXTENSIONS = exports.FILE_UPLOAD_CONFIG = void 0;
exports.FILE_UPLOAD_CONFIG = {
    // Document uploads (ID Card, House Registration, etc.)
    DOCUMENTS: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf'
        ],
        uploadDir: 'uploads/documents'
    },
    // Location images
    LOCATION_IMAGES: {
        maxFileSize: 3 * 1024 * 1024, // 3MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif'
        ],
        uploadDir: 'uploads/locations'
    },
    // Product images
    PRODUCT_IMAGES: {
        maxFileSize: 3 * 1024 * 1024, // 3MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif'
        ],
        uploadDir: 'uploads/products'
    },
    // Variant images
    VARIANT_IMAGES: {
        maxFileSize: 3 * 1024 * 1024, // 3MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif'
        ],
        uploadDir: 'uploads/variants'
    },
    // Shop logos
    SHOP_LOGOS: {
        maxFileSize: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ],
        uploadDir: 'uploads/shops'
    },
    // Payment proofs
    PAYMENT_PROOFS: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf'
        ],
        uploadDir: 'uploads/payments'
    }
};
exports.ALLOWED_EXTENSIONS = {
    IMAGES: ['.jpg', '.jpeg', '.png', '.webp'],
    DOCUMENTS: ['.jpg', '.jpeg', '.png', '.pdf']
};
