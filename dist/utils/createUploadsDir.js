"use strict";
// ==========================================
// src/utils/createUploadsDir.ts
// สร้างโฟลเดอร์ uploads ตอน start server
// ==========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadDirectories = createUploadDirectories;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const file_types_1 = require("../types/file.types");
async function createUploadDirectories() {
    const uploadDirs = [
        file_types_1.FILE_UPLOAD_CONFIG.DOCUMENTS.uploadDir,
        file_types_1.FILE_UPLOAD_CONFIG.LOCATION_IMAGES.uploadDir,
        file_types_1.FILE_UPLOAD_CONFIG.PRODUCT_IMAGES.uploadDir,
        file_types_1.FILE_UPLOAD_CONFIG.SHOP_LOGOS.uploadDir,
        file_types_1.FILE_UPLOAD_CONFIG.PAYMENT_PROOFS.uploadDir
    ];
    for (const dir of uploadDirs) {
        const fullPath = path_1.default.join(__dirname, '../../', dir);
        try {
            await promises_1.default.access(fullPath);
            console.log(`✓ Upload directory exists: ${dir}`);
        }
        catch {
            await promises_1.default.mkdir(fullPath, { recursive: true });
            console.log(`✓ Created upload directory: ${dir}`);
        }
    }
}
