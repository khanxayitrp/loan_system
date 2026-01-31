// src/services/fileUpload.service.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp'; // สำหรับ optimize รูปภาพ
import {
    UploadedFile,
    FileValidationResult,
    UploadResult,
    FileUploadConfig,
    FILE_UPLOAD_CONFIG
} from '../types/file.types';
import { logger } from '../utils/logger';
import {
    ValidationError,
    ForbiddenError,
    NotFoundError,
    InternalServerError
} from '../utils/errors'; // ← เพิ่ม import นี้

class FileUploadService {
    /**
     * ตรวจสอบความถูกต้องของไฟล์
     */
    validateFile(
        file: UploadedFile,
        config: FileUploadConfig
    ): FileValidationResult {
        try {
            // ตรวจสอบขนาดไฟล์
            if (file.size > config.maxFileSize) {
                const maxSizeMB = config.maxFileSize / (1024 * 1024);
                return {
                    isValid: false,
                    error: `File size exceeds ${maxSizeMB}MB limit`
                };
            }

            // ตรวจสอบ MIME type
            if (!config.allowedMimeTypes.includes(file.mimetype)) {
                return {
                    isValid: false,
                    error: `File type ${file.mimetype} is not allowed`
                };
            }

            // ตรวจสอบ extension
            const ext = path.extname(file.originalname).toLowerCase();
            const allowedExts = config.allowedMimeTypes
                .map(mime => this.getMimeExtension(mime))
                .flat();

            if (!allowedExts.includes(ext)) {
                return {
                    isValid: false,
                    error: `File extension ${ext} is not allowed`
                };
            }

            return { isValid: true };
        } catch (error) {
            logger.error('Error validating file:', error);
            return {
                isValid: false,
                error: 'Error validating file'
            };
        }
    }

    /**
     * สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
     */
    generateFileName(originalName: string, prefix?: string): string {
        const ext = path.extname(originalName);
        const timestamp = Date.now();
        const uuid = uuidv4().split('-')[0]; // ใช้แค่ส่วนแรกของ UUID

        if (prefix) {
            return `${prefix}_${timestamp}_${uuid}${ext}`;
        }

        return `${timestamp}_${uuid}${ext}`;
    }

    /**
     * สร้างโฟลเดอร์ถ้ายังไม่มี
     */
    async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            logger.info(`Created directory: ${dirPath}`);
        }
    }
    // เพิ่มฟังก์ชันช่วยจัดการ Path เล็กน้อย
    private formatPathToUrl(filePath: string): string {
        // แยกส่วนประกอบของ path และกรองเอาเฉพาะส่วนที่อยู่หลัง 'uploads'
        const parts = filePath.split(path.sep);
        const uploadIndex = parts.indexOf('uploads');
        if (uploadIndex !== -1) {
            return '/' + parts.slice(uploadIndex).join('/');
        }
        return '/' + filePath.replace(/\\/g, '/');
    }

    /**
     * อัปโหลดไฟล์เดียว
     */
    async uploadSingleFile(
        file: UploadedFile,
        config: FileUploadConfig,
        prefix?: string
    ): Promise<UploadResult> {
        let savedFilePath: string | null = null; // เก็บไว้ลบถ้าพัง
        try {
            // Validate file
            const validation = this.validateFile(file, config);
            if (!validation.isValid) {
                throw new ValidationError(validation.error || 'ไฟล์ไม่ผ่านการตรวจสอบ');
            }

            // สร้างโฟลเดอร์ถ้ายังไม่มี
            await this.ensureDirectoryExists(config.uploadDir);

            // Generate unique filename
            const fileName = this.generateFileName(file.originalname, prefix);
            const filePath = path.join(config.uploadDir, fileName);
            savedFilePath = filePath;

            // บันทึกไฟล์
            if (file.buffer) {
                // ถ้าเป็นรูปภาพ ให้ optimize ก่อน
                if (file.mimetype.startsWith('image/')) {
                    await this.optimizeAndSaveImage(file.buffer, filePath);
                } else {
                    await fs.writeFile(filePath, file.buffer);
                }
            } else if (file.path) {
                // ถ้ามีการเก็บไฟล์ชั่วคราวแล้ว
                // await fs.rename(file.path, filePath);

                // ใช้ fs.copyFile แล้ว fs.unlink จะปลอดภัยกว่า rename ข้าม partition
                await fs.copyFile(file.path, filePath);
                await fs.unlink(file.path);
            } else {
                throw new Error('No file data found');
            }

            // สร้าง URL สำหรับเข้าถึงไฟล์
            const fileUrl = `/${filePath.replace(/\\/g, '/')}`;

            logger.info(`File uploaded successfully: ${fileName}`);

            return {
                success: true,
                fileUrl: this.formatPathToUrl(filePath), // ใช้ตัวจัดการ path ที่เขียนใหม่
                fileName,
                filePath
            };
        } catch (error) {
            logger.error('Error uploading file:', error);
            // ถ้าเกิด error ระหว่างอัปโหลด ให้ throw custom error
            if (error instanceof ValidationError) {
                throw error;
            }

            throw new InternalServerError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
        }
    }

    /**
     * อัปโหลดหลายไฟล์
     */
    async uploadMultipleFiles(
        files: UploadedFile[],
        config: FileUploadConfig,
        prefix?: string
    ): Promise<UploadResult[]> {
        const results: UploadResult[] = [];

        for (const file of files) {
            try {
                const result = await this.uploadSingleFile(file, config, prefix);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
                });
            }

        }

        return results;
    }

    /**
     * Optimize และบันทึกรูปภาพ
     */
    private async optimizeAndSaveImage(
        buffer: Buffer,
        outputPath: string
    ): Promise<void> {
        const ext = path.extname(outputPath).toLowerCase();

        let sharpInstance = sharp(buffer);

        // Resize ถ้ารูปใหญ่เกินไป (max width 1920px)
        const metadata = await sharpInstance.metadata();
        if (metadata.width && metadata.width > 1920) {
            sharpInstance = sharpInstance.resize(1920, null, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Optimize ตามประเภทไฟล์
        switch (ext) {
            case '.jpg':
            case '.jpeg':
                sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
                break;
            case '.png':
                sharpInstance = sharpInstance.png({ compressionLevel: 8 });
                break;
            case '.webp':
                sharpInstance = sharpInstance.webp({ quality: 85 });
                break;
        }

        await sharpInstance.toFile(outputPath);
    }

    /**
     * ลบไฟล์
     */
    async deleteFile(filePath: string): Promise<boolean> {
        try {
            await fs.unlink(filePath);
            logger.info(`File deleted: ${filePath}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting file ${filePath}:`, error);
            return false;
        }
    }

    /**
     * ลบหลายไฟล์
     */
    async deleteFiles(filePaths: string[]): Promise<void> {
        await Promise.all(filePaths.map(path => this.deleteFile(path)));
    }

    /**
     * แปลง MIME type เป็น extension
     */
    private getMimeExtension(mimeType: string): string[] {
        const mimeMap: Record<string, string[]> = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'application/pdf': ['.pdf']
        };

        return mimeMap[mimeType] || [];
    }

    /**
     * แปลง file path เป็น URL
     */
    getFileUrl(filePath: string): string {
        return `/${filePath.replace(/\\/g, '/')}`;
    }

    /**
     * ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

export default new FileUploadService();