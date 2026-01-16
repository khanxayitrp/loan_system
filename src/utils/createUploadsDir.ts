
// ==========================================
// src/utils/createUploadsDir.ts
// สร้างโฟลเดอร์ uploads ตอน start server
// ==========================================

import fs from 'fs/promises';
import path from 'path';
import { FILE_UPLOAD_CONFIG } from '../types/file.types';

export async function createUploadDirectories(): Promise<void> {
  const uploadDirs = [
    FILE_UPLOAD_CONFIG.DOCUMENTS.uploadDir,
    FILE_UPLOAD_CONFIG.PRODUCT_IMAGES.uploadDir,
    FILE_UPLOAD_CONFIG.SHOP_LOGOS.uploadDir,
    FILE_UPLOAD_CONFIG.PAYMENT_PROOFS.uploadDir
  ];

  for (const dir of uploadDirs) {
    const fullPath = path.join(__dirname, '../../', dir);
    try {
      await fs.access(fullPath);
      console.log(`✓ Upload directory exists: ${dir}`);
    } catch {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`✓ Created upload directory: ${dir}`);
    }
  }
}