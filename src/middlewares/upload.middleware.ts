// src/middlewares/upload.middleware.ts

import multer from 'multer';
import { Request } from 'express';
import { FILE_UPLOAD_CONFIG } from '../types/file.types';
import path from 'path';

/**
 * Multer memory storage - เก็บไฟล์ใน buffer เพื่อให้ service จัดการต่อ
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter function
 */
const createFileFilter = (allowedMimeTypes: readonly string[]) => {
  return (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  };
};

/**
 * Multer configurations for different upload types
 */

// สำหรับเอกสาร (ID Card, House Reg, Salary Slip)
export const uploadDocument = multer({
  storage: memoryStorage,
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.DOCUMENTS.maxFileSize
  },
  fileFilter: createFileFilter(FILE_UPLOAD_CONFIG.DOCUMENTS.allowedMimeTypes)
});

// สำหรับรูปสินค้า
export const uploadProductImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.PRODUCT_IMAGES.maxFileSize,
    files: 5 // จำกัดไม่เกิน 5 รูป
  },
  fileFilter: createFileFilter(FILE_UPLOAD_CONFIG.PRODUCT_IMAGES.allowedMimeTypes)
});

// สำหรับโลโก้ร้านค้า
export const uploadShopLogo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.SHOP_LOGOS.maxFileSize
  },
  fileFilter: createFileFilter(FILE_UPLOAD_CONFIG.SHOP_LOGOS.allowedMimeTypes)
});

// สำหรับหลักฐานการชำระเงิน
export const uploadPaymentProof = multer({
  storage: memoryStorage,
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.PAYMENT_PROOFS.maxFileSize
  },
  fileFilter: createFileFilter(FILE_UPLOAD_CONFIG.PAYMENT_PROOFS.allowedMimeTypes)
});

/**
 * Generic upload middleware
 */
export const createUploadMiddleware = (
  maxFileSize: number,
  allowedMimeTypes: readonly string[],
  maxFiles: number = 1
) => {
  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter: createFileFilter(allowedMimeTypes)
  });
};