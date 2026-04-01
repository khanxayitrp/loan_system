// // src/services/fileUpload.service.ts

// import multer from 'multer';
// import path from 'path';
// import fs from 'fs/promises';
// import { v4 as uuidv4 } from 'uuid';
// import sharp from 'sharp'; // สำหรับ optimize รูปภาพ
// import {
//     UploadedFile,
//     FileValidationResult,
//     UploadResult,
//     FileUploadConfig,
//     FILE_UPLOAD_CONFIG
// } from '../types/file.types';
// import { logger } from '../utils/logger';
// import {
//     ValidationError,
//     ForbiddenError,
//     NotFoundError,
//     InternalServerError
// } from '../utils/errors'; // ← เพิ่ม import นี้

// class FileUploadService {
//     /**
//      * ตรวจสอบความถูกต้องของไฟล์
//      */
//     validateFile(
//         file: UploadedFile,
//         config: FileUploadConfig
//     ): FileValidationResult {
//         try {
//             // ✅ 1. ตรวจสอบว่า buffer มีข้อมูลจริง
//             if (!file.buffer || file.buffer.length === 0) {
//                 return {
//                     isValid: false,
//                     error: 'ไฟล์ว่างเปล่า (0 bytes)'
//                 };
//             }
//             // ตรวจสอบขนาดไฟล์
//             if (file.size > config.maxFileSize) {
//                 const maxSizeMB = config.maxFileSize / (1024 * 1024);
//                 return {
//                     isValid: false,
//                     error: `File size exceeds ${maxSizeMB}MB limit`
//                 };
//             }


//             // ตรวจสอบ MIME type
//             if (!config.allowedMimeTypes.includes(file.mimetype)) {
//                 return {
//                     isValid: false,
//                     error: `File type ${file.mimetype} is not allowed`
//                 };
//             }

//             // ตรวจสอบ extension
//             const ext = path.extname(file.originalname).toLowerCase();
//             const allowedExts = config.allowedMimeTypes
//                 .map(mime => this.getMimeExtension(mime))
//                 .flat();

//             if (!allowedExts.includes(ext)) {
//                 return {
//                     isValid: false,
//                     error: `File extension ${ext} is not allowed`
//                 };
//             }

//             return { isValid: true };
//         } catch (error) {
//             logger.error('Error validating file:', error);
//             return {
//                 isValid: false,
//                 error: 'Error validating file'
//             };
//         }
//     }

//     /**
//      * สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
//      */
//     generateFileName(originalName: string, prefix?: string): string {
//         const ext = path.extname(originalName);
//         const timestamp = Date.now();
//         const uuid = uuidv4().split('-')[0]; // ใช้แค่ส่วนแรกของ UUID

//         if (prefix) {
//             return `${prefix}_${timestamp}_${uuid}${ext}`;
//         }

//         return `${timestamp}_${uuid}${ext}`;
//     }

//     /**
//      * สร้างโฟลเดอร์ถ้ายังไม่มี
//      */
//     async ensureDirectoryExists(dirPath: string): Promise<void> {
//         try {
//             await fs.access(dirPath);
//         } catch {
//             await fs.mkdir(dirPath, { recursive: true });
//             logger.info(`Created directory: ${dirPath}`);
//         }
//     }
//     // เพิ่มฟังก์ชันช่วยจัดการ Path เล็กน้อย
//     private formatPathToUrl(filePath: string): string {
//         // แยกส่วนประกอบของ path และกรองเอาเฉพาะส่วนที่อยู่หลัง 'uploads'
//         const parts = filePath.split(path.sep);
//         const uploadIndex = parts.indexOf('uploads');
//         if (uploadIndex !== -1) {
//             return '/' + parts.slice(uploadIndex).join('/');
//         }
//         return '/' + filePath.replace(/\\/g, '/');
//     }

//     /**
//      * อัปโหลดไฟล์เดียว
//      */
//     // src/services/fileUpload.service.ts

//     async uploadSingleFile(
//         file: UploadedFile,
//         config: FileUploadConfig,
//         prefix?: string
//     ): Promise<UploadResult> {
//         let savedFilePath: string | null = null;

//         try {
//             // ✅ 1. Validate file
//             const validation = this.validateFile(file, config);
//             if (!validation.isValid) {
//                 logger.warn('File validation failed:', {
//                     originalName: file.originalname,
//                     mimetype: file.mimetype,
//                     size: file.size,
//                     error: validation.error
//                 });
//                 throw new ValidationError(validation.error || 'ไฟล์ไม่ผ่านการตรวจสอบ');
//             }

//             // ✅ 2. สร้างโฟลเดอร์ถ้ายังไม่มี
//             await this.ensureDirectoryExists(config.uploadDir);

//             // ✅ 3. Generate unique filename
//             const fileName = this.generateFileName(file.originalname, prefix);
//             const filePath = path.join(config.uploadDir, fileName);
//             savedFilePath = filePath; // ✅ เก็บ path ไว้ cleanup

//             // ✅ 4. บันทึกไฟล์
//             if (file.buffer) {
//                 if (file.mimetype.startsWith('image/')) {
//                     await this.optimizeAndSaveImage(file.buffer, filePath, file.mimetype);
//                 } else {
//                     await fs.writeFile(filePath, file.buffer);
//                 }
//             } else if (file.path) {
//                 await fs.copyFile(file.path, filePath);
//                 await fs.unlink(file.path);
//             } else {
//                 throw new Error('No file data found');
//             }

//             // ✅ 5. สร้าง URL
//             const fileUrl = this.formatPathToUrl(filePath);

//             logger.info(`File uploaded successfully: ${fileName}`, {
//                 fileUrl,
//                 size: file.size,
//                 mimetype: file.mimetype
//             });

//             return {
//                 success: true,
//                 fileUrl,
//                 fileName,
//                 filePath
//             };

//         } catch (error) {
//             logger.error('Error uploading file:', {
//                 error: error instanceof Error ? error.message : error,
//                 fileName: file.originalname,
//                 mimetype: file.mimetype,
//                 size: file.size
//             });

//             // ✅ 6. Cleanup ถ้าเกิด error และไฟล์ถูกสร้างแล้ว
//             if (savedFilePath) {
//                 try {
//                     const fileExists = await this.fileExists(savedFilePath);
//                     if (fileExists) {
//                         await fs.unlink(savedFilePath);
//                         logger.info('Cleaned up partial file:', savedFilePath);
//                     }
//                 } catch (cleanupError) {
//                     logger.error('Error cleaning up partial file:', cleanupError);
//                 }
//             }

//             if (error instanceof ValidationError) {
//                 throw error;
//             }

//             throw new InternalServerError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
//         }
//     }

//     /**
//      * อัปโหลดหลายไฟล์
//      */
//     async uploadMultipleFiles(
//         files: UploadedFile[],
//         config: FileUploadConfig,
//         prefix?: string
//     ): Promise<UploadResult[]> {
//         const results: UploadResult[] = [];

//         for (const file of files) {
//             try {
//                 const result = await this.uploadSingleFile(file, config, prefix);
//                 results.push(result);
//             } catch (error) {
//                 results.push({
//                     success: false,
//                     error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
//                 });
//             }

//         }

//         return results;
//     }

//     /**
//      * Optimize และบันทึกรูปภาพ
//      */
//     // src/services/fileUpload.service.ts

//     private async optimizeAndSaveImage(
//         buffer: Buffer,
//         outputPath: string,
//         mimetype: string
//     ): Promise<void> {
//         try {
//             // ✅ 1. ตรวจสอบ buffer
//             if (!buffer || buffer.length === 0) {
//                 throw new ValidationError('Buffer ว่างเปล่า');
//             }

//             // // ✅ 2. ตรวจสอบว่า buffer เป็นรูปภาพจริง (ไม่ใช่ HTML)
//             // const bufferPreview = buffer.slice(0, 20).toString('utf-8');
//             // if (bufferPreview.includes('<!DOCTYPE') || bufferPreview.includes('<html')) {
//             //     logger.error('Received HTML instead of image:', {
//             //         bufferPreview,
//             //         mimetype,
//             //         bufferSize: buffer.length
//             //     });
//             //     throw new ValidationError('ไฟล์ที่รับมาเป็น HTML ไม่ใช่รูปภาพ');
//             // }

//             // ✅ 3. ตรวจสอบ MIME type
//             const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
//             if (!allowedImageTypes.includes(mimetype)) {
//                 throw new ValidationError(`Unsupported image type: ${mimetype}`);
//             }

//             // ✅ 4. ตรวจสอบไฟล์ด้วย Sharp ก่อนประมวลผล
//             let metadata;
//             try {
//                 metadata = await sharp(buffer).metadata();
//             } catch (sharpError: any) {
//                 logger.error('Sharp metadata error:', {
//                     error: sharpError.message,
//                     mimetype,
//                     bufferSize: buffer.length,
//                     bufferPreview: buffer.slice(0, 20).toString('hex')
//                 });
//                 throw new ValidationError(`ไฟล์รูปภาพเสียหายหรือไม่ถูกต้อง: ${sharpError.message}`);
//             }

//             // ✅ 5. ตรวจสอบว่าเป็นรูปภาพจริง
//             if (!metadata || !metadata.format) {
//                 throw new ValidationError('ไม่สามารถระบุรูปแบบรูปภาพได้');
//             }

//             // ✅ 6. สร้าง Sharp instance
//             let sharpInstance = sharp(buffer);

//             // ✅ 7. Resize ถ้ารูปใหญ่เกินไป
//             if (metadata.width && metadata.width > 1920) {
//                 sharpInstance = sharpInstance.resize(1920, null, {
//                     fit: 'inside',
//                     withoutEnlargement: true
//                 });
//             }

//             // ✅ 8. Optimize ตามประเภทไฟล์
//             const ext = path.extname(outputPath).toLowerCase();
//             switch (ext) {
//                 case '.jpg':
//                 case '.jpeg':
//                     sharpInstance = sharpInstance.jpeg({
//                         quality: 85,
//                         progressive: true,
//                         mozjpeg: true
//                     });
//                     break;
//                 case '.png':
//                     sharpInstance = sharpInstance.png({
//                         compressionLevel: 8,
//                         palette: true
//                     });
//                     break;
//                 case '.webp':
//                     sharpInstance = sharpInstance.webp({ quality: 85 });
//                     break;
//                 default:
//                     sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
//             }

//             // ✅ 9. บันทึกไฟล์
//             await sharpInstance.toFile(outputPath);

//             logger.info('Image optimized and saved:', {
//                 outputPath,
//                 originalSize: buffer.length,
//                 format: metadata.format
//             });

//         } catch (error: any) {
//             logger.error('Error in optimizeAndSaveImage:', {
//                 error: error.message,
//                 outputPath,
//                 mimetype,
//                 bufferSize: buffer?.length
//             });
//             throw error;
//         }
//     }

//     /**
//      * ลบไฟล์
//      */
//     async deleteFile(filePath: string): Promise<boolean> {
//         try {
//             await fs.unlink(filePath);
//             logger.info(`File deleted: ${filePath}`);
//             return true;
//         } catch (error) {
//             logger.error(`Error deleting file ${filePath}:`, error);
//             return false;
//         }
//     }

//     /**
//      * ลบหลายไฟล์
//      */
//     async deleteFiles(filePaths: string[]): Promise<void> {
//         await Promise.all(filePaths.map(path => this.deleteFile(path)));
//     }

//     /**
//      * แปลง MIME type เป็น extension
//      */
//     private getMimeExtension(mimeType: string): string[] {
//         const mimeMap: Record<string, string[]> = {
//             'image/jpeg': ['.jpg', '.jpeg'],
//             'image/jpg': ['.jpg', '.jpeg'],
//             'image/png': ['.png'],
//             'image/webp': ['.webp'],
//             'image/gif': ['.gif'],
//             'application/pdf': ['.pdf']
//         };

//         return mimeMap[mimeType] || [];
//     }

//     /**
//      * แปลง file path เป็น URL
//      */
//     getFileUrl(filePath: string): string {
//         return `/${filePath.replace(/\\/g, '/')}`;
//     }

//     /**
//      * ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
//      */
//     async fileExists(filePath: string): Promise<boolean> {
//         try {
//             await fs.access(filePath);
//             return true;
//         } catch {
//             return false;
//         }
//     }
// }

// export default new FileUploadService();

// src/services/fileUpload.service.ts

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
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
    InternalServerError
} from '../utils/errors';
import fs from 'fs/promises'; // เก็บไว้เผื่อกรณี multer ส่งมาเป็น file.path (diskStorage)

// ============================================================================
// 🟢 1. ตั้งค่า S3 Client สำหรับเชื่อมต่อ MinIO
// ============================================================================
const s3Client = new S3Client({
    region: 'ap-southeast-1', // MinIO ไม่ได้ใช้ Region แจ้งเป็นค่า default
    endpoint: `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    forcePathStyle: true, // 🌟 สำคัญมากสำหรับ MinIO เพื่อให้รองรับ path-style URL
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_SECRET_KEY || '',
    },
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'insee-storage';

class FileUploadService {
    /**
     * ตรวจสอบความถูกต้องของไฟล์
     */
    validateFile(
        file: UploadedFile,
        config: FileUploadConfig
    ): FileValidationResult {
        try {
            // ตรวจสอบว่ามีข้อมูลไฟล์จริง
            if ((!file.buffer || file.buffer.length === 0) && !file.path) {
                return { isValid: false, error: 'ไฟล์ว่างเปล่า (0 bytes)' };
            }
            
            // ตรวจสอบขนาดไฟล์
            if (file.size > config.maxFileSize) {
                const maxSizeMB = config.maxFileSize / (1024 * 1024);
                return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
            }

            // ตรวจสอบ MIME type
            if (!config.allowedMimeTypes.includes(file.mimetype)) {
                return { isValid: false, error: `File type ${file.mimetype} is not allowed` };
            }

            // ตรวจสอบ extension
            const ext = path.extname(file.originalname).toLowerCase();
            const allowedExts = config.allowedMimeTypes
                .map(mime => this.getMimeExtension(mime))
                .flat();

            if (!allowedExts.includes(ext)) {
                return { isValid: false, error: `File extension ${ext} is not allowed` };
            }

            return { isValid: true };
        } catch (error) {
            logger.error('Error validating file:', error);
            return { isValid: false, error: 'Error validating file' };
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
     * อัปโหลดไฟล์เดียวขึ้น MinIO
     */
    async uploadSingleFile(
        file: UploadedFile,
        config: FileUploadConfig,
        prefix?: string
    ): Promise<UploadResult> {
        try {
            // 1. Validate file
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

            // 2. เตรียม Buffer (กรณี Multer ใช้ MemoryStorage หรือ DiskStorage)
            let fileBuffer = file.buffer;
            if (!fileBuffer && file.path) {
                fileBuffer = await fs.readFile(file.path);
                // ลบไฟล์ temp ทิ้งหลังอ่านเสร็จ
                fs.unlink(file.path).catch(e => logger.warn('Failed to delete temp file', e));
            }

            if (!fileBuffer) {
                throw new Error('ไม่พบข้อมูล Buffer ของไฟล์');
            }

            // 3. Generate unique filename และ Object Key สำหรับ MinIO
            const fileName = this.generateFileName(file.originalname, prefix);
            
            // เปลี่ยนจาก 'uploads/documents' เป็น 'documents' เพื่อใช้เป็น Folder (Prefix) ใน MinIO
            const folderPrefix = config.uploadDir.replace(/^uploads[\\/]/, '').replace(/\\/g, '/');
            const objectKey = folderPrefix ? `${folderPrefix}/${fileName}` : fileName;

            let uploadBuffer = fileBuffer;
            let finalMimeType = file.mimetype;

            // 4. บีบอัดรูปภาพด้วย Sharp (ถ้าเป็นไฟล์ภาพ)
            if (file.mimetype.startsWith('image/')) {
                const optimized = await this.optimizeImageBuffer(fileBuffer, file.mimetype);
                uploadBuffer = optimized.buffer;
                finalMimeType = optimized.mimetype;
                // ถ้า Sharp แปลงเป็น format อื่น ให้แก้ extension ของชื่อไฟล์และ Key ด้วย
                if (finalMimeType === 'image/jpeg' && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg')) {
                    // ปรับแต่งเพิ่มเติมได้ตามต้องการ (ส่วนใหญ่ browser อ่านได้อยู่แล้ว)
                }
            }

            // 5. โยนไฟล์ขึ้น MinIO
            const putCommand = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: objectKey,
                Body: uploadBuffer,
                ContentType: finalMimeType,
            });

            await s3Client.send(putCommand);

            // 🌟 6. [แก้ไขตรงนี้] สร้าง URL สาธารณะ (ดึงจาก Domain ถ้ามี, ถ้าไม่มีค่อย fallback ไปใช้ IP)
            const publicBaseUrl = process.env.MINIO_PUBLIC_URL || `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;

            // หมายเหตุ: ตัด / ออกจากท้าย BUCKET_NAME หรือ publicBaseUrl เพื่อป้องกัน // ซ้อนกัน
            const cleanBaseUrl = publicBaseUrl.replace(/\/$/, '');
            const fileUrl = `${cleanBaseUrl}/${BUCKET_NAME}/${objectKey}`;

            logger.info(`File uploaded successfully to MinIO: ${objectKey}`, { size: uploadBuffer.length });

            return {
                success: true,
                fileUrl,
                fileName,
                filePath: objectKey // 🌟 ส่ง objectKey กลับไปเป็น filePath เพื่อใช้ลบในอนาคต
            };

        } catch (error) {
            logger.error('Error uploading file to MinIO:', {
                error: error instanceof Error ? error.message : error,
                fileName: file.originalname
            });

            if (error instanceof ValidationError) {
                throw error;
            }
            throw new InternalServerError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์ขึ้น Cloud');
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
     * 🌟 [อัปเดตใหม่] Optimize รูปภาพและส่งกลับเป็น Buffer (แทนการเขียนลง Disk)
     */
    private async optimizeImageBuffer(
        buffer: Buffer,
        mimetype: string
    ): Promise<{ buffer: Buffer, mimetype: string }> {
        try {
            if (!buffer || buffer.length === 0) {
                throw new ValidationError('Buffer ว่างเปล่า');
            }

            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedImageTypes.includes(mimetype)) {
                throw new ValidationError(`Unsupported image type: ${mimetype}`);
            }

            // ตรวจสอบ metadata
            let metadata;
            try {
                metadata = await sharp(buffer).metadata();
            } catch (sharpError: any) {
                throw new ValidationError(`ไฟล์รูปภาพเสียหายหรือไม่ถูกต้อง: ${sharpError.message}`);
            }

            if (!metadata || !metadata.format) {
                throw new ValidationError('ไม่สามารถระบุรูปแบบรูปภาพได้');
            }

            let sharpInstance = sharp(buffer);
            let finalMimeType = mimetype;

            // Resize ถ้ารูปใหญ่เกินไป
            if (metadata.width && metadata.width > 1920) {
                sharpInstance = sharpInstance.resize(1920, null, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Optimize ตามประเภทไฟล์
            if (mimetype === 'image/png') {
                sharpInstance = sharpInstance.png({ compressionLevel: 8, palette: true });
            } else if (mimetype === 'image/webp') {
                sharpInstance = sharpInstance.webp({ quality: 85 });
            } else if (mimetype === 'image/gif') {
                 // ปล่อยผ่าน GIF ไป (Sharp จัดการ animation ค่อนข้างซับซ้อน)
            } else {
                sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true, mozjpeg: true });
                finalMimeType = 'image/jpeg';
            }

            // สร้าง Buffer ใหม่
            const optimizedBuffer = await sharpInstance.toBuffer();

            logger.info('Image optimized in memory:', {
                originalSize: buffer.length,
                optimizedSize: optimizedBuffer.length,
                format: finalMimeType
            });

            return { buffer: optimizedBuffer, mimetype: finalMimeType };

        } catch (error: any) {
            logger.error('Error in optimizeImageBuffer:', error.message);
            throw error;
        }
    }

    /**
     * ลบไฟล์ออกจาก MinIO
     * @param identifier สามารถรับได้ทั้งแบบ Object Key ("documents/file.jpg") หรือ Full URL ("http://...")
     */
    async deleteFile(identifier: string): Promise<boolean> {
        try {
            // สกัดเอาเฉพาะ Object Key จาก URL
            // const baseUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/`;
            // 🌟 [แก้ไขตรงนี้] ดึง public URL หรือ IP มาใช้ตัด String
            const publicBaseUrl = process.env.MINIO_PUBLIC_URL || `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
            const cleanBaseUrl = publicBaseUrl.replace(/\/$/, '');
            const baseUrl = `${cleanBaseUrl}/${BUCKET_NAME}/`;

            const objectKey = identifier.replace(baseUrl, '').split('?')[0]; // ตัด query params เผื่อไว้

            const command = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: objectKey,
            });

            await s3Client.send(command);
            logger.info(`File deleted from MinIO: ${objectKey}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting file from MinIO ${identifier}:`, error);
            return false; // ไม่โยน Error เพื่อให้ Process อื่นทำงานต่อได้
        }
    }

    /**
     * ลบหลายไฟล์
     */
    async deleteFiles(identifiers: string[]): Promise<void> {
        await Promise.all(identifiers.map(id => this.deleteFile(id)));
    }

    /**
     * ตรวจสอบว่ามีไฟล์อยู่บน MinIO หรือไม่
     */
    async fileExists(objectKey: string): Promise<boolean> {
        try {
            // const baseUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/`;
            // 🌟 [แก้ไขตรงนี้] ดึง public URL หรือ IP มาใช้ตัด String
            const publicBaseUrl = process.env.MINIO_PUBLIC_URL || `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
            const cleanBaseUrl = publicBaseUrl.replace(/\/$/, '');
            const baseUrl = `${cleanBaseUrl}/${BUCKET_NAME}/`;
            
            const cleanKey = objectKey.replace(baseUrl, '').split('?')[0];

            const command = new HeadObjectCommand({
                Bucket: BUCKET_NAME,
                Key: cleanKey,
            });
            await s3Client.send(command);
            return true;
        } catch (error: any) {
            // HTTP 404 แปลว่าไม่พบไฟล์
            if (error.$metadata?.httpStatusCode === 404) return false;
            logger.error('Error checking file existence in MinIO:', error);
            return false;
        }
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
}

export default new FileUploadService();