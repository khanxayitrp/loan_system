"use strict";
// // src/services/productGallery.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { Transaction } from 'sequelize';
// import { db } from '../models/init-models';
// import { logger } from '../utils/logger';
// import path from 'path';
// import fs from 'fs/promises';
// import fileUploadService from './fileUpload.service';
// import type { UploadedImage } from '../types/product';
// // 🟢 1. Import Helper ของเราเข้ามา
// import { logAudit } from '../utils/auditLogger';
// class ProductGalleryService {
//     /**
//      * ดึงรูปภาพทั้งหมดของสินค้า
//      */
//     async getAllImage(productId: number) {
//         try {
//             const allImages = await db.product_gallery.findAll({
//                 where: {
//                     product_id: productId
//                 },
//                 raw: true
//             });
//             return allImages;
//         } catch (error: any) {
//             logger.error('Error fetching all images for product', error);
//             throw error;
//         }
//     }
//     /**
//      * ✅ หาโฟลเดอร์ uploads ที่ถูกต้อง
//      */
//     private async findUploadsDirectory(): Promise<string | null> {
//         // ลำดับความสำคัญในการหา uploads folder
//         const possiblePaths = [
//             path.resolve(process.cwd(), 'public', 'uploads'),           // D:\workspace\my-node-app\public\uploads
//             path.resolve(process.cwd(), 'uploads'),                     // D:\workspace\my-node-app\uploads
//             path.resolve(process.cwd(), 'src', 'public', 'uploads'),    // D:\workspace\my-node-app\src\public\uploads
//             path.resolve(process.cwd(), '..', 'public', 'uploads'),     // D:\workspace\public\uploads
//         ];
//         logger.debug('🔍 Searching for uploads directory...');
//         for (const testPath of possiblePaths) {
//             try {
//                 await fs.access(testPath);
//                 logger.info(`✅ Found uploads directory: ${testPath}`);
//                 return testPath;
//             } catch {
//                 logger.debug(`❌ Not found: ${testPath}`);
//             }
//         }
//         logger.error('❌ Could not find uploads directory in any expected location');
//         logger.error('Searched paths:', possiblePaths);
//         return null;
//     }
//     /**
//      * ค้นหาไฟล์ทั้งหมดที่เกี่ยวข้องกับผลิตภัณฑ์ในโฟลเดอร์ uploads
//      */
//     private async findProductGalleryFiles(productId: number): Promise<string[]> {
//         try {
//             // ✅ ใช้ฟังก์ชันหา uploads directory ที่ถูกต้อง
//             const baseUploadDir = await this.findUploadsDirectory();
//             if (!baseUploadDir) {
//                 logger.error('❌ Cannot find uploads directory');
//                 return [];
//             }
//             logger.debug(`🔍 Searching in: ${baseUploadDir}`);
//             const pattern = `product_${productId}_gallery`;
//             const foundFiles: string[] = [];
//             // ฟังก์ชันค้นหาแบบรีเคอร์ซีฟ
//             const searchDirectory = async (dir: string) => {
//                 try {
//                     const entries = await fs.readdir(dir, { withFileTypes: true });
//                     for (const entry of entries) {
//                         const fullPath = path.join(dir, entry.name);
//                         if (entry.isDirectory()) {
//                             await searchDirectory(fullPath);
//                         } else if (entry.isFile()) {
//                             if (entry.name.includes(pattern) && 
//                                 /\.(jpg|jpeg|png|webp|gif)$/i.test(entry.name)) {
//                                 foundFiles.push(fullPath);
//                                 logger.debug(`✅ Found file: ${entry.name}`);
//                             }
//                         }
//                     }
//                 } catch (err) {
//                     logger.debug(`Cannot read directory ${dir}:`, err);
//                 }
//             };
//             await searchDirectory(baseUploadDir);
//             logger.info(`📊 Found ${foundFiles.length} file(s) matching pattern "${pattern}"`);
//             if (foundFiles.length > 0) {
//                 logger.debug('Files found:', foundFiles.map(f => path.basename(f)));
//             }
//             return foundFiles;
//         } catch (error) {
//             logger.error(`❌ Error finding product gallery files for product ${productId}:`, error);
//             return [];
//         }
//     }
//     /**
//      * ✅ แปลง file path เป็น URL ที่เก็บในฐานข้อมูล
//      * รองรับหลายรูปแบบของ path
//      */
//     private filePathToDbUrl(filePath: string): string {
//         try {
//             // แปลง \ เป็น / ทั้งหมดก่อน
//             const normalizedPath = filePath.replace(/\\/g, '/');
//             // ลอง match หลายรูปแบบ
//             const patterns = [
//                 /public\/uploads\/(.+)$/,           // .../public/uploads/products/file.jpg
//                 /uploads\/(.+)$/,                    // .../uploads/products/file.jpg
//                 /src\/public\/uploads\/(.+)$/,      // .../src/public/uploads/products/file.jpg
//             ];
//             for (const pattern of patterns) {
//                 const match = normalizedPath.match(pattern);
//                 if (match) {
//                     const dbUrl = `/uploads/${match[1]}`;
//                     logger.debug(`🔄 Converted: ${path.basename(filePath)} → ${dbUrl}`);
//                     return dbUrl;
//                 }
//             }
//             logger.warn(`⚠️ Could not convert path to DB URL: ${filePath}`);
//             return '';
//         } catch (error) {
//             logger.error(`❌ Error converting file path: ${filePath}`, error);
//             return '';
//         }
//     }
//     /**
//      * ลบไฟล์ที่ไม่มีในฐานข้อมูล (orphaned files)
//      */
//     private async cleanupOrphanedFiles(productId: number): Promise<number> {
//         try {
//             logger.info(`🧹 Starting cleanup for product ${productId}...`);
//             // 1. ดึงรายการ URL ทั้งหมดในฐานข้อมูล
//             const dbRecords = await db.product_gallery.findAll({
//                 where: { product_id: productId },
//                 attributes: ['image_url'],
//                 raw: true
//             });
//             const dbFileUrls = new Set(
//                 dbRecords
//                     .map((r: any) => r.image_url?.trim())
//                     .filter(Boolean)
//             );
//             logger.info(`📊 Database has ${dbFileUrls.size} image(s) for product ${productId}`);
//             if (dbFileUrls.size > 0) {
//                 logger.debug('URLs in DB:', Array.from(dbFileUrls));
//             }
//             // 2. ค้นหาไฟล์ทั้งหมดที่เกี่ยวข้อง
//             const allFilePaths = await this.findProductGalleryFiles(productId);
//             if (allFilePaths.length === 0) {
//                 logger.info(`ℹ️ No files found in uploads folder for product ${productId}`);
//                 return 0;
//             }
//             logger.info(`📊 Found ${allFilePaths.length} physical file(s) in server`);
//             // 3. กรองไฟล์ orphaned
//             const orphanedFiles: string[] = [];
//             for (const filePath of allFilePaths) {
//                 const dbUrl = this.filePathToDbUrl(filePath);
//                 if (!dbUrl) {
//                     logger.warn(`⚠️ Skipping invalid path: ${filePath}`);
//                     continue;
//                 }
//                 const existsInDb = dbFileUrls.has(dbUrl);
//                 logger.debug(
//                     `Checking: ${path.basename(filePath)} → ${dbUrl} → ` +
//                     `${existsInDb ? '✅ Keep' : '❌ Delete'}`
//                 );
//                 if (!existsInDb) {
//                     orphanedFiles.push(filePath);
//                 }
//             }
//             if (orphanedFiles.length === 0) {
//                 logger.info(`✅ No orphaned files found for product ${productId}`);
//                 return 0;
//             }
//             logger.info(`🗑️ Found ${orphanedFiles.length} orphaned file(s) to delete`);
//             logger.info('Files to delete:', orphanedFiles.map(f => path.basename(f)));
//             // 4. ลบไฟล์
//             try {
//                 await fileUploadService.deleteFiles(orphanedFiles);
//                 logger.info(`✅ Successfully deleted ${orphanedFiles.length} orphaned file(s)`);
//                 return orphanedFiles.length;
//             } catch (deleteError) {
//                 logger.error(`❌ Error using deleteFiles service:`, deleteError);
//                 // Fallback: ลบทีละไฟล์
//                 let deletedCount = 0;
//                 for (const filePath of orphanedFiles) {
//                     try {
//                         await fs.unlink(filePath);
//                         logger.info(`✅ Deleted: ${path.basename(filePath)}`);
//                         deletedCount++;
//                     } catch (err: any) {
//                         logger.error(`❌ Failed to delete ${path.basename(filePath)}:`, err.message);
//                     }
//                 }
//                 logger.info(`✅ Deleted ${deletedCount}/${orphanedFiles.length} files`);
//                 return deletedCount;
//             }
//         } catch (error) {
//             logger.error(`❌ Error cleaning up orphaned files for product ${productId}:`, error);
//             return 0;
//         }
//     }
//     /**
//      * เพิ่มรูปภาพใหม่และลบรูปเก่า
//      * 🟢 รับ performedBy เข้ามาเพื่อบันทึกว่าพนักงานคนไหนเป็นคนแก้ไข
//      */
//     async addImageGallery(productId: number, image_url: UploadedImage[], performedBy: number = 1): Promise<boolean> {
//         logger.info(`📥 Adding gallery for product ${productId}, images count: ${image_url?.length || 0}`);
//         logger.debug('Received images:', JSON.stringify(image_url, null, 2));
//         if (!image_url || image_url.length === 0) {
//             logger.error('❌ No images provided to add to gallery!');
//             throw new Error('No images provided to add to gallery!');
//         }
//         const transaction = await db.sequelize.transaction();
//         try {
//             // 1. ดึงรูปภาพเก่า (🟢 เอา attributes ออก เพื่อให้ได้ id มาสำหรับทำ Audit Log)
//             const oldRecords = await db.product_gallery.findAll({
//                 where: { product_id: productId },
//                 raw: true,
//                 transaction,
//                 lock: Transaction.LOCK.UPDATE
//             });
//             const oldImageUrls = oldRecords.map((r: any) => r.image_url).filter(Boolean);
//             logger.info(`📊 Old images count: ${oldImageUrls.length}`);
//             // 2. ลบข้อมูลเก่าในฐานข้อมูล
//             const deletedCount = await db.product_gallery.destroy({
//                 where: { product_id: productId },
//                 transaction
//             });
//             logger.info(`🗑️ Deleted ${deletedCount} old record(s) from database`);
//             // 🟢 บันทึก Audit Log สำหรับการ DELETE รูปเก่าทิ้งทั้งหมด
//             for (const oldRec of oldRecords) {
//                 await logAudit('product_gallery', oldRec.id, 'DELETE', oldRec, null, performedBy, transaction);
//             }
//             // 3. เตรียมข้อมูลใหม่
//             const galleryData = image_url
//                 .map(img => ({
//                     product_id: productId,
//                     image_url: img.file_url?.trim()
//                 }))
//                 .filter(img => img.image_url);
//             if (galleryData.length === 0) {
//                 throw new Error('No valid image URLs provided');
//             }
//             logger.info(`➕ Adding ${galleryData.length} new image(s) to database`);
//             logger.debug('Gallery data to insert:', JSON.stringify(galleryData, null, 2));
//             // 4. เพิ่มข้อมูลใหม่
//             const newRecords = await db.product_gallery.bulkCreate(galleryData, { transaction });
//             // 🟢 บันทึก Audit Log สำหรับการ CREATE รูปใหม่
//             for (const newRec of newRecords) {
//                 // newRec เป็น instance ของ Sequelize ควรใช้ .toJSON() ถ้ามี
//                 const logPayload = newRec.toJSON ? newRec.toJSON() : newRec;
//                 await logAudit('product_gallery', (newRec as any).id || 0, 'CREATE', null, logPayload, performedBy, transaction);
//             }
//             // 5. COMMIT
//             await transaction.commit();
//             logger.info(`✅ Database transaction committed successfully`);
//             // 6. ลบไฟล์ orphaned (ขั้นตอนนี้เกี่ยวกับไฟล์ ไม่ต้องเก็บ Audit Log)
//             logger.info(`🧹 Starting file cleanup...`);
//             const deletedFileCount = await this.cleanupOrphanedFiles(productId);
//             logger.info(`✅ File cleanup completed. Deleted ${deletedFileCount} file(s)`);
//             return true;
//         } catch (error) {
//             await transaction.rollback();
//             logger.error(`❌ Gallery update failed for Product ${productId}:`, error);
//             throw error;
//         }
//     }
// }
// export default new ProductGalleryService();
// src/services/productGallery.service.ts
const sequelize_1 = require("sequelize");
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const fileUpload_service_1 = __importDefault(require("./fileUpload.service"));
const auditLogger_1 = require("../utils/auditLogger");
class ProductGalleryService {
    /**
     * ดึงรูปภาพทั้งหมดของสินค้า
     */
    async getAllImage(productId) {
        try {
            const allImages = await init_models_1.db.product_gallery.findAll({
                where: {
                    product_id: productId
                },
                raw: true
            });
            return allImages;
        }
        catch (error) {
            logger_1.logger.error('Error fetching all images for product', error);
            throw error;
        }
    }
    /**
     * เพิ่มรูปภาพใหม่และลบรูปเก่า (รองรับ MinIO 100%)
     * 🟢 รับ performedBy เข้ามาเพื่อบันทึกว่าพนักงานคนไหนเป็นคนแก้ไข
     */
    async addImageGallery(productId, image_url, performedBy = 1) {
        logger_1.logger.info(`📥 Adding gallery for product ${productId}, images count: ${image_url?.length || 0}`);
        if (!image_url || image_url.length === 0) {
            logger_1.logger.error('❌ No images provided to add to gallery!');
            throw new Error('No images provided to add to gallery!');
        }
        const transaction = await init_models_1.db.sequelize.transaction();
        try {
            // 1. ดึงรูปภาพเก่าจาก DB (เพื่อเตรียมเปรียบเทียบ)
            const oldRecords = await init_models_1.db.product_gallery.findAll({
                where: { product_id: productId },
                raw: true,
                transaction,
                lock: sequelize_1.Transaction.LOCK.UPDATE
            });
            const oldImageUrls = oldRecords.map((r) => r.image_url).filter(Boolean);
            logger_1.logger.info(`📊 Old images count: ${oldImageUrls.length}`);
            // 2. ลบข้อมูลเก่าในฐานข้อมูล
            const deletedCount = await init_models_1.db.product_gallery.destroy({
                where: { product_id: productId },
                transaction
            });
            logger_1.logger.info(`🗑️ Deleted ${deletedCount} old record(s) from database`);
            // 🟢 บันทึก Audit Log สำหรับการ DELETE รูปเก่าทิ้งทั้งหมด
            for (const oldRec of oldRecords) {
                await (0, auditLogger_1.logAudit)('product_gallery', oldRec.id, 'DELETE', oldRec, null, performedBy, transaction);
            }
            // 3. เตรียมข้อมูลใหม่
            const newImageUrls = image_url.map(img => img.file_url?.trim()).filter(Boolean);
            const galleryData = newImageUrls.map(url => ({
                product_id: productId,
                image_url: url
            }));
            if (galleryData.length === 0) {
                throw new Error('No valid image URLs provided');
            }
            logger_1.logger.info(`➕ Adding ${galleryData.length} new image(s) to database`);
            // 4. เพิ่มข้อมูลใหม่
            const newRecords = await init_models_1.db.product_gallery.bulkCreate(galleryData, { transaction });
            // 🟢 บันทึก Audit Log สำหรับการ CREATE รูปใหม่
            for (const newRec of newRecords) {
                const logPayload = newRec.toJSON ? newRec.toJSON() : newRec;
                await (0, auditLogger_1.logAudit)('product_gallery', newRec.id || 0, 'CREATE', null, logPayload, performedBy, transaction);
            }
            // 5. COMMIT การเปลี่ยนแปลงใน Database ให้เสร็จสิ้น
            await transaction.commit();
            logger_1.logger.info(`✅ Database transaction committed successfully`);
            // =========================================================================
            // 6. 🌟 จัดการลบไฟล์ขยะออกจาก MinIO (Background Task)
            // =========================================================================
            logger_1.logger.info(`🧹 Starting MinIO file cleanup...`);
            // หา URL ที่มีในของเก่า แต่ไม่มีในของใหม่ (นั่นคือไฟล์ที่โดนผู้ใช้ลบออก)
            const filesToDeleteFromMinIO = oldImageUrls.filter(oldUrl => !newImageUrls.includes(oldUrl));
            if (filesToDeleteFromMinIO.length > 0) {
                logger_1.logger.info(`🗑️ Found ${filesToDeleteFromMinIO.length} obsolete file(s) to delete from MinIO.`);
                // ส่ง Array ของ URL ไปให้ fileUploadService สั่งลบทีเดียว
                // ไม่ต้องใช้ await เพื่อไม่ให้ API รอ (Background Process) แต่ถ้าอยากให้รอจนลบเสร็จค่อย response ก็ใส่ await ได้ครับ
                fileUpload_service_1.default.deleteFiles(filesToDeleteFromMinIO).catch(err => {
                    logger_1.logger.error(`❌ Failed to delete files from MinIO:`, err);
                });
                logger_1.logger.info(`✅ Successfully dispatched delete command to MinIO.`);
            }
            else {
                logger_1.logger.info(`ℹ️ No obsolete files to delete from MinIO.`);
            }
            return true;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error(`❌ Gallery update failed for Product ${productId}:`, error);
            throw error;
        }
    }
}
exports.default = new ProductGalleryService();
