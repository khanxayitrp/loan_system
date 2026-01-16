// src/types/file.types.ts

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  filePath?: string;
  error?: string;
}

export interface FileUploadConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[] | readonly string[];
  uploadDir: string;
  fileNamePrefix?: string;
}

export type DocumentType = 'id_card' | 'house_reg' | 'salary_slip' | 'other';
export type ImageType = 'product' | 'shop_logo' | 'payment_proof';

export const FILE_UPLOAD_CONFIG = {
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
  
  // Product images
  PRODUCT_IMAGES: {
    maxFileSize: 3 * 1024 * 1024, // 3MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ],
    uploadDir: 'uploads/products'
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
} as const;

export const ALLOWED_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.webp'],
  DOCUMENTS: ['.jpg', '.jpeg', '.png', '.pdf']
} as const;