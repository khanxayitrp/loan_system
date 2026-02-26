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
            // ✅ 1. ตรวจสอบว่า buffer มีข้อมูลจริง
            if (!file.buffer || file.buffer.length === 0) {
                return {
                    isValid: false,
                    error: 'ไฟล์ว่างเปล่า (0 bytes)'
                };
            }
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
    // src/services/fileUpload.service.ts

    async uploadSingleFile(
        file: UploadedFile,
        config: FileUploadConfig,
        prefix?: string
    ): Promise<UploadResult> {
        let savedFilePath: string | null = null;

        try {
            // ✅ 1. Validate file
            const validation = this.validateFile(file, config);
            if (!validation.isValid) {
                logger.warn('File validation failed:', {
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    error: validation.error
                });
                throw new ValidationError(validation.error || 'ไฟล์ไม่ผ่านการตรวจสอบ');
            }

            // ✅ 2. สร้างโฟลเดอร์ถ้ายังไม่มี
            await this.ensureDirectoryExists(config.uploadDir);

            // ✅ 3. Generate unique filename
            const fileName = this.generateFileName(file.originalname, prefix);
            const filePath = path.join(config.uploadDir, fileName);
            savedFilePath = filePath; // ✅ เก็บ path ไว้ cleanup

            // ✅ 4. บันทึกไฟล์
            if (file.buffer) {
                if (file.mimetype.startsWith('image/')) {
                    await this.optimizeAndSaveImage(file.buffer, filePath, file.mimetype);
                } else {
                    await fs.writeFile(filePath, file.buffer);
                }
            } else if (file.path) {
                await fs.copyFile(file.path, filePath);
                await fs.unlink(file.path);
            } else {
                throw new Error('No file data found');
            }

            // ✅ 5. สร้าง URL
            const fileUrl = this.formatPathToUrl(filePath);

            logger.info(`File uploaded successfully: ${fileName}`, {
                fileUrl,
                size: file.size,
                mimetype: file.mimetype
            });

            return {
                success: true,
                fileUrl,
                fileName,
                filePath
            };

        } catch (error) {
            logger.error('Error uploading file:', {
                error: error instanceof Error ? error.message : error,
                fileName: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });

            // ✅ 6. Cleanup ถ้าเกิด error และไฟล์ถูกสร้างแล้ว
            if (savedFilePath) {
                try {
                    const fileExists = await this.fileExists(savedFilePath);
                    if (fileExists) {
                        await fs.unlink(savedFilePath);
                        logger.info('Cleaned up partial file:', savedFilePath);
                    }
                } catch (cleanupError) {
                    logger.error('Error cleaning up partial file:', cleanupError);
                }
            }

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
    // src/services/fileUpload.service.ts

    private async optimizeAndSaveImage(
        buffer: Buffer,
        outputPath: string,
        mimetype: string
    ): Promise<void> {
        try {
            // ✅ 1. ตรวจสอบ buffer
            if (!buffer || buffer.length === 0) {
                throw new ValidationError('Buffer ว่างเปล่า');
            }

            // // ✅ 2. ตรวจสอบว่า buffer เป็นรูปภาพจริง (ไม่ใช่ HTML)
            // const bufferPreview = buffer.slice(0, 20).toString('utf-8');
            // if (bufferPreview.includes('<!DOCTYPE') || bufferPreview.includes('<html')) {
            //     logger.error('Received HTML instead of image:', {
            //         bufferPreview,
            //         mimetype,
            //         bufferSize: buffer.length
            //     });
            //     throw new ValidationError('ไฟล์ที่รับมาเป็น HTML ไม่ใช่รูปภาพ');
            // }

            // ✅ 3. ตรวจสอบ MIME type
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedImageTypes.includes(mimetype)) {
                throw new ValidationError(`Unsupported image type: ${mimetype}`);
            }

            // ✅ 4. ตรวจสอบไฟล์ด้วย Sharp ก่อนประมวลผล
            let metadata;
            try {
                metadata = await sharp(buffer).metadata();
            } catch (sharpError: any) {
                logger.error('Sharp metadata error:', {
                    error: sharpError.message,
                    mimetype,
                    bufferSize: buffer.length,
                    bufferPreview: buffer.slice(0, 20).toString('hex')
                });
                throw new ValidationError(`ไฟล์รูปภาพเสียหายหรือไม่ถูกต้อง: ${sharpError.message}`);
            }

            // ✅ 5. ตรวจสอบว่าเป็นรูปภาพจริง
            if (!metadata || !metadata.format) {
                throw new ValidationError('ไม่สามารถระบุรูปแบบรูปภาพได้');
            }

            // ✅ 6. สร้าง Sharp instance
            let sharpInstance = sharp(buffer);

            // ✅ 7. Resize ถ้ารูปใหญ่เกินไป
            if (metadata.width && metadata.width > 1920) {
                sharpInstance = sharpInstance.resize(1920, null, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // ✅ 8. Optimize ตามประเภทไฟล์
            const ext = path.extname(outputPath).toLowerCase();
            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    sharpInstance = sharpInstance.jpeg({
                        quality: 85,
                        progressive: true,
                        mozjpeg: true
                    });
                    break;
                case '.png':
                    sharpInstance = sharpInstance.png({
                        compressionLevel: 8,
                        palette: true
                    });
                    break;
                case '.webp':
                    sharpInstance = sharpInstance.webp({ quality: 85 });
                    break;
                default:
                    sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
            }

            // ✅ 9. บันทึกไฟล์
            await sharpInstance.toFile(outputPath);

            logger.info('Image optimized and saved:', {
                outputPath,
                originalSize: buffer.length,
                format: metadata.format
            });

        } catch (error: any) {
            logger.error('Error in optimizeAndSaveImage:', {
                error: error.message,
                outputPath,
                mimetype,
                bufferSize: buffer?.length
            });
            throw error;
        }
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
            'image/jpg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'image/gif': ['.gif'],
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