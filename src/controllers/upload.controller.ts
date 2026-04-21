// // src/controllers/upload.controller.ts
// // เวอร์ชันปรับปรุงให้เป็น Best Practice สำหรับระบบที่มีหลายประเภทไฟล์ (2026 style)

// import { Request, Response } from 'express';
// import documentService from '../services/document.service';
// import fileUploadService from '../services/fileUpload.service';
// import { FILE_UPLOAD_CONFIG, DocumentType, UploadedFile } from '../types/file.types';
// import { logger } from '../utils/logger';
// import { ValidationError, ForbiddenError, handleErrorResponse } from '../utils/errors';

// class UploadController {
//   private async handleFileUploadResponse(
//     res: Response,
//     result: any,
//     successMessage: string,
//     errorMessage: string
//   ): Promise<void> {
//     if (result.success === false) {
//       res.status(400).json({
//         success: false,
//         message: result.error || errorMessage
//       });
//       return;
//     }

//     res.status(201).json({
//       success: true,
//       message: successMessage,
//       data: result.data || result
//     });
//   }

//   public static validateRequiredFields(req: Request, required: string[]): void {
//     for (const field of required) {
//       if (!req.body[field] && !req.params[field]) {
//         throw new ValidationError(`Missing required field: ${field}`);
//       }
//     }
//   }

//   /**
//    * Best Practice: ใช้ method เดียวสำหรับทุกประเภท upload แต่แยก logic ตาม config
//    * แต่เนื่องจากคุณมีหลายประเภทชัดเจน จึงคงแยก method แต่เพิ่ม abstraction เล็กน้อย
//    */

//   // ── Application Documents ──────────────────────────────────────

//   async uploadApplicationDocument(req: Request, res: Response): Promise<void> {
//     try {
//       UploadController.validateRequiredFields(req, ['application_id', 'doc_type']);

//       const { application_id } = req.params;
//       const { doc_type } = req.body;

//       if (!req.file) {
//         throw new ValidationError('No file uploaded');
//       }

//       // Optional: เช็คสิทธิ์เฉพาะ application นี้ (เช่น เป็น requester หรือ approver)
//       // const app = await db.loan_applications.findByPk(application_id);
//       // if (req.user?.id !== app?.requester_id && req.user?.id !== app?.approver_id) {
//       //   throw new ForbiddenError('You are not authorized to upload documents for this application');
//       // }

//       const document = await documentService.uploadApplicationDocument({
//         application_id: parseInt(application_id),
//         doc_type: doc_type as DocumentType,
//         original_filename: req.file.originalname,
//         file_size: req.file.size,
//         mime_type: req.file.mimetype,
//         file: req.file as UploadedFile
//       });

//       res.status(201).json({
//         success: true,
//         message: 'Document uploaded successfully',
//         data: document
//       });
//     } catch (error) {
//       logger.error('Error in uploadApplicationDocument:', error);
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   async uploadMultipleDocuments(req: Request, res: Response): Promise<void> {
//     try {
//       UploadController.validateRequiredFields(req, ['application_id']);

//       const { application_id } = req.params;
//       const files = req.files as Express.Multer.File[];
//       const { doc_types } = req.body;

//       if (!files?.length) {
//         throw new ValidationError('No files uploaded');
//       }

//       if (!doc_types || !Array.isArray(doc_types) || doc_types.length !== files.length) {
//         throw new ValidationError('doc_types must be an array with the same length as uploaded files');
//       }

//       const documents = files.map((file, index) => ({
//         file: file as UploadedFile,
//         original_filename: file.originalname,
//         file_size: file.size,
//         mime_type: file.mimetype,
//         doc_type: doc_types[index] as DocumentType
//       }));

//       const results = await documentService.uploadMultipleDocuments(
//         parseInt(application_id),
//         documents
//       );

//       res.status(201).json({
//         success: true,
//         message: `${results.length} documents uploaded successfully`,
//         data: results
//       });
//     } catch (error) {
//       logger.error('Error in uploadMultipleDocuments:', error);
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   async getApplicationDocuments(req: Request, res: Response): Promise<void> {
//     try {
//       const { application_id } = req.params;
//       const documents = await documentService.getApplicationDocuments(parseInt(application_id));

//       res.status(200).json({
//         success: true,
//         data: documents
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   async deleteDocument(req: Request, res: Response): Promise<void> {
//     try {
//       const { document_id } = req.params;
//       await documentService.deleteDocument(parseInt(document_id));

//       res.status(200).json({
//         success: true,
//         message: 'Document deleted successfully'
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   async replaceDocument(req: Request, res: Response): Promise<void> {
//     try {
//       const { document_id } = req.params;

//       if (!req.file) {
//         throw new ValidationError('No file uploaded');
//       }

//       const updated = await documentService.replaceDocument(
//         parseInt(document_id),
//         req.file as UploadedFile
//       );

//       res.status(200).json({
//         success: true,
//         message: 'Document replaced successfully',
//         data: updated
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   // ── Product Images ─────────────────────────────────────────────

//   async uploadProductImage(req: Request, res: Response): Promise<void> {
//     try {
//       UploadController.validateRequiredFields(req, ['product_id']);

//       if (!req.file) {
//         throw new ValidationError('No file uploaded');
//       }

//       const { product_id } = req.params;

//       const result = await fileUploadService.uploadSingleFile(
//         req.file as UploadedFile,
//         FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
//         `product_${product_id}`
//       );

//       if (!result.success) {
//         throw new ValidationError(result.error || 'Failed to upload product image');
//       }

//       res.status(201).json({
//         success: true,
//         message: 'Product image uploaded successfully',
//         data: {
//           file_url: result.fileUrl,
//           file_name: result.fileName,
//           file_path: result.filePath
//         }
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   async uploadProductGallery(req: Request, res: Response): Promise<void> {
//     try {
//       const { product_id } = req.params;
//       const files = req.files as Express.Multer.File[];

//       if (!files?.length) {
//         throw new ValidationError('No files uploaded');
//       }

//       // ✅ 2. Log ข้อมูลไฟล์สำหรับ debug
//     logger.info('Uploading files:', {
//       productId: product_id,
//       fileCount: files.length,
//       files: files.map(f => ({
//         originalName: f.originalname,
//         mimetype: f.mimetype,
//         size: f.size,
//         hasBuffer: !!f.buffer,
//         bufferSize: f.buffer?.length,
//         bufferPreview: f.buffer?.slice(0, 20).toString('hex')
//       }))
//     });

//     // // ✅ 3. ตรวจสอบว่า buffer เป็น HTML หรือไม่
//     // for (const file of files) {
//     //   if (file.buffer && file.buffer.length > 0) {
//     //     const bufferPreview = file.buffer.slice(0, 20).toString('utf-8');
//     //     if (bufferPreview.includes('<!DOCTYPE') || bufferPreview.includes('<html')) {
//     //       logger.error('File is HTML, not image:', {
//     //         fileName: file.originalname,
//     //         bufferPreview
//     //       });
//     //       throw new ValidationError(`ไฟล์ ${file.originalname} เป็น HTML ไม่ใช่รูปภาพ`);
//     //     }
//     //   }
//     // }

//       const results = await fileUploadService.uploadMultipleFiles(
//         files as UploadedFile[],
//         FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
//         `product_${product_id}_gallery`
//       );

//       const successful = results.filter(r => r.success);
//       const failed = results.filter(r => !r.success);

//       res.status(201).json({
//         success: successful.length > 0,
//         message: `${successful.length} of ${files.length} images uploaded successfully`,
//         data: {
//           uploaded: successful.map(r => ({
//             file_url: r.fileUrl,
//             file_name: r.fileName
//           })),
//           failed: failed.map(r => ({
//           error: r.error,
//           fileName: files[failed.indexOf(r)]?.originalname
//         }))
//         }
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   async uploadVariantImage(req: Request, res: Response): Promise<void> {
//     try {
//       // 🟢 1. รับไฟล์เดียว (Single File) ไม่ต้องใช้ product_id เพราะเป็น Pre-upload
//       const file = req.file as Express.Multer.File;

//       if (!file) {
//         throw new ValidationError('No file uploaded');
//       }

//       // 🟢 2. Log ข้อมูลไฟล์สำหรับ debug
//       logger.info('Uploading variant image:', {
//         originalName: file.originalname,
//         mimetype: file.mimetype,
//         size: file.size,
//         hasBuffer: !!file.buffer,
//         bufferPreview: file.buffer ? file.buffer.slice(0, 20).toString('hex') : null
//       });

//       // 🟢 3. สร้าง Prefix โดยใช้ Timestamp เพื่อให้ชื่อไฟล์ไม่ซ้ำกัน
//       const timestamp = Date.now();
//       const prefix = `variant_${timestamp}`;

//       // 🟢 4. เรียกใช้ Service อัปโหลด (ถ้าคุณมี uploadSingleFile ใช้ตัวนั้นได้เลย 
//       // แต่ถ้ามีแค่ uploadMultipleFiles ก็สามารถส่งไฟล์ใส่ Array เข้าไปแบบนี้ได้ครับ)
//       // const results = await fileUploadService.uploadMultipleFiles(
//       //   [file] as UploadedFile[], // ส่งเข้าไปเป็น Array ที่มี 1 ไฟล์
//       //   FILE_UPLOAD_CONFIG.PRODUCT_IMAGES, // หรือสร้าง config ใหม่เป็น VARIANT_IMAGES ก็ได้
//       //   prefix
//       // );
//        const results = await fileUploadService.uploadSingleFile(
//         req.file as UploadedFile,
//         FILE_UPLOAD_CONFIG.VARIANT_IMAGES,
//         prefix
//       );

      

//       if (!results || !results.success) {
//         throw new Error(results?.error || 'Failed to upload variant image');
//       }

//       // 🟢 5. ตอบกลับด้วยโครงสร้างที่ตรงกับที่ Frontend (ProductPage.vue) คาดหวัง
//       res.status(201).json({
//         success: true,
//         message: 'Variant image uploaded successfully',
//         file_url: results.fileUrl, // ส่ง URL ออกไปตรงๆ ชั้นนอก
//         data: {
//           file_url: results.fileUrl,
//           file_name: results.fileName
//         }
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status || 500).json(errResp);
//     }
//   }

//   async uploadLocationImage(req: Request, res: Response): Promise<void> {
//     try {
//       const { customer_id } = req.params;
//       const files = req.files as Express.Multer.File[];
      
//       if (!files?.length) {
//         throw new ValidationError('No files uploaded');
//       }
//       logger.info('Uploading location images:', {
//         customerId: customer_id,
//         fileCount: files.length,
//         files: files.map(f => ({
//           originalName: f.originalname,
//           mimetype: f.mimetype,
//           size: f.size,
//           hasBuffer: !!f.buffer,
//           bufferSize: f.buffer?.length,
//           bufferPreview: f.buffer?.slice(0, 20).toString('hex')
//         }))
//       });

//       const results = await fileUploadService.uploadMultipleFiles(
//         files as UploadedFile[],
//         FILE_UPLOAD_CONFIG.LOCATION_IMAGES,
//         `customer_${customer_id}_location`
//       );

//       const successful = results.filter(r => r.success);
//       const failed = results.filter(r => !r.success);

//       res.status(201).json({
//         success: successful.length > 0,
//         message: `${successful.length} of ${files.length} location images uploaded successfully`,
//         data: {
//           uploaded: successful.map(r => ({
//             file_url: r.fileUrl,
//             file_name: r.fileName
//           })),
//           failed: failed.map(r => ({
//             error: r.error,
//             fileName: files[failed.indexOf(r)]?.originalname
//           }))
//         }
//       });
//     } catch (error: any) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   // ── Shop Logo ──────────────────────────────────────────────────

//   async uploadShopLogo(req: Request, res: Response): Promise<void> {
//     try {
//       // this.validateRequiredFields(req, ['partner_id']);
//        console.log('[UploadController] uploadShopLogo called');
//       console.log('[UploadController] Params:', req.params);
//       console.log('[UploadController] File:', req.file ? {
//         originalname: req.file.originalname,
//         size: req.file.size,
//         mimetype: req.file.mimetype
//       } : 'No file');


//       const { partner_id } = req.params;

//       if (!partner_id) {
//         throw new ValidationError('partner_id is required');
//       }
//       if (!req.file) {
//         throw new ValidationError('No file uploaded');
//       }

//       console.log('[UploadController] Uploading logo for shop:', partner_id);

//       const result = await fileUploadService.uploadSingleFile(
//         req.file as UploadedFile,
//         FILE_UPLOAD_CONFIG.SHOP_LOGOS,
//         `shop_${partner_id}_logo`
//       );

//       if (!result.success) {
//         throw new ValidationError(result.error || 'Failed to upload shop logo');
//       }

//       res.status(201).json({
//         success: true,
//         message: 'Shop logo uploaded successfully',
//         data: {
//           file_url: result.fileUrl,
//           file_name: result.fileName
//         }
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }

//   // ── Payment Proof ──────────────────────────────────────────────

//   async uploadPaymentProof(req: Request, res: Response): Promise<void> {
//     try {
//       UploadController.validateRequiredFields(req, ['transaction_id']);

//       if (!req.file) {
//         throw new ValidationError('No file uploaded');
//       }

//       const { transaction_id } = req.params;

//       const result = await fileUploadService.uploadSingleFile(
//         req.file as UploadedFile,
//         FILE_UPLOAD_CONFIG.PAYMENT_PROOFS,
//         `payment_${transaction_id}`
//       );

//       if (!result.success) {
//         throw new ValidationError(result.error || 'Failed to upload payment proof');
//       }

//       res.status(201).json({
//         success: true,
//         message: 'Payment proof uploaded successfully',
//         data: {
//           file_url: result.fileUrl,
//           file_name: result.fileName
//         }
//       });
//     } catch (error) {
//       const errResp = handleErrorResponse(error);
//       res.status(errResp.status).json(errResp);
//     }
//   }
// }

// export default new UploadController();

// src/controllers/upload.controller.ts
// เวอร์ชันสมบูรณ์ (Best Practice 2026) รองรับ MinIO และระบบกำจัดไฟล์ขยะอัตโนมัติครบทุกฟังก์ชัน 🧹🚀

import { Request, Response } from 'express';
import documentService from '../services/document.service';
import fileUploadService from '../services/fileUpload.service';
import { FILE_UPLOAD_CONFIG, DocumentType, UploadedFile } from '../types/file.types';
import { logger } from '../utils/logger';
import { ValidationError, ForbiddenError, handleErrorResponse } from '../utils/errors';
import { db } from '../models/init-models'; // 🌟 Import DB สำหรับค้นหาไฟล์เก่า

class UploadController {
  private async handleFileUploadResponse(
    res: Response,
    result: any,
    successMessage: string,
    errorMessage: string
  ): Promise<void> {
    if (result.success === false) {
      res.status(400).json({
        success: false,
        message: result.error || errorMessage
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: successMessage,
      data: result.data || result
    });
  }

  public static validateRequiredFields(req: Request, required: string[]): void {
    for (const field of required) {
      if (!req.body[field] && !req.params[field]) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }
  }

  // ============================================================================
  // ── 1. Application Documents (เอกสารสัญญาสินเชื่อ) ─────────────────────────
  // ============================================================================

  async uploadApplicationDocument(req: Request, res: Response): Promise<void> {
    try {
      UploadController.validateRequiredFields(req, ['customerId', 'doc_type']);

      const { customerId } = req.params;
      const { doc_type } = req.body;

      if (!req.file) throw new ValidationError('No file uploaded');

      const document = await documentService.uploadApplicationDocument({
        customer_id: parseInt(customerId),
        doc_type: doc_type as DocumentType,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        file: req.file as UploadedFile
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error in uploadApplicationDocument:', error);
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  async uploadMultipleDocuments(req: Request, res: Response): Promise<void> {
    try {
      UploadController.validateRequiredFields(req, ['customerId']);

      const { customerId } = req.params;
      const files = req.files as Express.Multer.File[];
      const { doc_types } = req.body;

      const userId = req.userPayload?.userId!;

      if (!files?.length) throw new ValidationError('No files uploaded');
      if (!doc_types || !Array.isArray(doc_types) || doc_types.length !== files.length) {
        throw new ValidationError('doc_types must be an array with the same length as uploaded files');
      }

      const documents = files.map((file, index) => ({
        file: file as UploadedFile,
        original_filename: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        doc_type: doc_types[index] as DocumentType
      }));

      const results = await documentService.uploadMultipleDocuments(parseInt(customerId), userId, documents);

      res.status(201).json({
        success: true,
        message: `${results.length} documents uploaded successfully`,
        data: results
      });
    } catch (error) {
      logger.error('Error in uploadMultipleDocuments:', error);
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  async getApplicationDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { application_id } = req.params;
      const documents = await documentService.getApplicationDocuments(parseInt(application_id));
      res.status(200).json({ success: true, data: documents });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { document_id } = req.params;
      await documentService.deleteDocument(parseInt(document_id));
      res.status(200).json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  async replaceDocument(req: Request, res: Response): Promise<void> {
    try {
      const { document_id } = req.params;
      if (!req.file) throw new ValidationError('No file uploaded');

      const updated = await documentService.replaceDocument(parseInt(document_id), req.file as UploadedFile);
      res.status(200).json({ success: true, message: 'Document replaced successfully', data: updated });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  // ============================================================================
  // ── 2. Product Images (รูปสินค้าหลัก และ Gallery) ───────────────────────────
  // ============================================================================

  async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      UploadController.validateRequiredFields(req, ['product_id']);
      if (!req.file) throw new ValidationError('No file uploaded');

      const { product_id } = req.params;

      // 🟢 1. เช็ครูปสินค้าเก่าเพื่อลบ (อย่าลืมเช็คชื่อฟิลด์ภาพสินค้าใน Model db.products ด้วยนะครับ)
      const product = await db.products.findByPk(product_id);
      const oldImageUrl = product?.image_url; 

      // 🟢 2. อัปโหลดรูปใหม่
      const result = await fileUploadService.uploadSingleFile(
        req.file as UploadedFile,
        FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
        `product_${product_id}_${Date.now()}`
      );

      if (!result.success) throw new ValidationError(result.error || 'Failed to upload product image');

      // 🟢 3. สั่งลบรูปเก่าจาก MinIO
      if (oldImageUrl) {
        fileUploadService.deleteFile(oldImageUrl).catch(err => 
          logger.warn(`Failed to delete orphaned product image: ${oldImageUrl}`, err)
        );
      }

      res.status(201).json({
        success: true,
        message: 'Product image uploaded successfully',
        data: {
          file_url: result.fileUrl,
          file_name: result.fileName,
          file_path: result.filePath
        }
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  async uploadProductGallery(req: Request, res: Response): Promise<void> {
    try {
      const { product_id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files?.length) throw new ValidationError('No files uploaded');

      // (Gallery จะถูกดักลบไฟล์เก่าอยู่ใน ProductGalleryService.addImageGallery() แล้ว จึงอัปโหลดได้เลย)
      const results = await fileUploadService.uploadMultipleFiles(
        files as UploadedFile[],
        FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
        `product_${product_id}_gallery_${Date.now()}`
      );

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.status(201).json({
        success: successful.length > 0,
        message: `${successful.length} of ${files.length} images uploaded successfully`,
        data: {
          uploaded: successful.map(r => ({ file_url: r.fileUrl, file_name: r.fileName })),
          failed: failed.map(r => ({ error: r.error, fileName: files[failed.indexOf(r)]?.originalname }))
        }
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  // ============================================================================
  // ── 3. Variant Images (รูปตัวเลือกสินค้า) ────────────────────────────────────
  // ============================================================================

  async uploadVariantImage(req: Request, res: Response): Promise<void> {
    try {
      // 🟢 1. รับไฟล์เดียว (Single File) ไม่ต้องใช้ product_id เพราะเป็น Pre-upload
      const file = req.file as Express.Multer.File;

      if (!file) {
        throw new ValidationError('No file uploaded');
      }

      // 🟢 2. Log ข้อมูลไฟล์สำหรับ debug
      logger.info('Uploading variant image:', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer,
        bufferPreview: file.buffer ? file.buffer.slice(0, 20).toString('hex') : null
      });

      // 🟢 3. สร้าง Prefix โดยใช้ Timestamp เพื่อให้ชื่อไฟล์ไม่ซ้ำกัน
      const timestamp = Date.now();
      const prefix = `variant_${timestamp}`;

      // 🟢 4. เรียกใช้ Service อัปโหลด (ถ้าคุณมี uploadSingleFile ใช้ตัวนั้นได้เลย 
      // แต่ถ้ามีแค่ uploadMultipleFiles ก็สามารถส่งไฟล์ใส่ Array เข้าไปแบบนี้ได้ครับ)
      // const results = await fileUploadService.uploadMultipleFiles(
      //   [file] as UploadedFile[], // ส่งเข้าไปเป็น Array ที่มี 1 ไฟล์
      //   FILE_UPLOAD_CONFIG.PRODUCT_IMAGES, // หรือสร้าง config ใหม่เป็น VARIANT_IMAGES ก็ได้
      //   prefix
      // );

       const results = await fileUploadService.uploadSingleFile(
        req.file as UploadedFile,
        FILE_UPLOAD_CONFIG.VARIANT_IMAGES,
        prefix
      );

      if (!results || !results.success) {
        throw new Error(results?.error || 'Failed to upload variant image');
      }

      // 🟢 5. ตอบกลับด้วยโครงสร้างที่ตรงกับที่ Frontend (ProductPage.vue) คาดหวัง
      res.status(201).json({
        success: true,
        message: 'Variant image uploaded successfully',
        file_url: results.fileUrl, // ส่ง URL ออกไปตรงๆ ชั้นนอก
        data: {
          file_url: results.fileUrl,
          file_name: results.fileName
        }
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status || 500).json(errResp);
    }
  }

  // ============================================================================
  // ── 4. Location Images (รูปร้านค้า/ที่ตั้งลูกค้า) ──────────────────────────
  // ============================================================================

  async uploadLocationImage(req: Request, res: Response): Promise<void> {
    try {
      const { customer_id, application_id } = req.params;
      const files = req.files as Express.Multer.File[];
      
      if (!files?.length) throw new ValidationError('No files uploaded');

      // 🟢 1. เช็คข้อมูลการลงพื้นที่เก่า
      const visit = await db.loan_field_visits.findOne({ 
        where: { application_id: application_id } 
      });
      
      // รวบรวม URL รูปเก่าที่มีอยู่ในระบบ (ถ้ามี)
      const oldUrls: string[] = [];
      if (visit?.photo_url_1) oldUrls.push(visit.photo_url_1);
      if (visit?.photo_url_2) oldUrls.push(visit.photo_url_2);

      // (ออปชันเสริมเพื่อความปลอดภัย) ถ้า Frontend ส่ง URL ของรูปเก่าที่ต้องการ "เก็บไว้" มาด้วย
      // เช่น req.body.retained_urls = ['http://minio.../photo1.jpg']
      let retainedUrls: string[] = [];
      if (req.body.retained_urls) {
        retainedUrls = Array.isArray(req.body.retained_urls) 
          ? req.body.retained_urls 
          : [req.body.retained_urls];
      }

      // กรองเอาเฉพาะรูปเก่าที่ "ไม่ได้อยู่ในรายการที่ต้องการเก็บไว้" (นั่นคือไฟล์ที่ต้องลบทิ้ง)
      const filesToDelete = oldUrls.filter(url => !retainedUrls.includes(url));

      // 🟢 2. อัปโหลดภาพใหม่ขึ้น MinIO
      const results = await fileUploadService.uploadMultipleFiles(
        files as UploadedFile[],
        FILE_UPLOAD_CONFIG.LOCATION_IMAGES,
        `customer_${customer_id}_location_${Date.now()}`
      );

      // 🟢 3. สั่งลบภาพเดิมที่ไม่ได้ใช้แล้วออกจาก MinIO (Background Process)
      if (filesToDelete.length > 0) {
        // ใช้ deleteFiles เพื่อลบทีเดียวหลายไฟล์เป็น Array ได้เลย
        fileUploadService.deleteFiles(filesToDelete).catch(err => 
          logger.warn(`Failed to delete old location images:`, err)
        );
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.status(201).json({
        success: successful.length > 0,
        message: `${successful.length} of ${files.length} location images uploaded successfully`,
        data: {
          uploaded: successful.map(r => ({ file_url: r.fileUrl, file_name: r.fileName })),
          failed: failed.map(r => ({ error: r.error, fileName: files[failed.indexOf(r)]?.originalname }))
        }
      });
    } catch (error: any) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  // ============================================================================
  // ── 5. Shop Logo (โลโก้ร้านค้า/Partner) ──────────────────────────────────────
  // ============================================================================

  async uploadShopLogo(req: Request, res: Response): Promise<void> {
    try {
      const { partner_id } = req.params;
      if (!partner_id) throw new ValidationError('partner_id is required');
      if (!req.file) throw new ValidationError('No file uploaded');

      // 🟢 1. ค้นหาข้อมูลร้านค้าเก่าเพื่อลบ
      const partner = await db.partners.findByPk(partner_id);
      const oldLogoUrl = partner?.shop_logo_url; // (เช็คชื่อฟิลด์โลโก้ใน db.partners)

      // 🟢 2. อัปโหลดโลโก้ใหม่
      const result = await fileUploadService.uploadSingleFile(
        req.file as UploadedFile,
        FILE_UPLOAD_CONFIG.SHOP_LOGOS,
        `shop_${partner_id}_logo_${Date.now()}`
      );

      if (!result.success) throw new ValidationError(result.error || 'Failed to upload shop logo');

      // 🟢 3. ลบโลโก้เก่าออกจาก MinIO
      if (oldLogoUrl) {
        fileUploadService.deleteFile(oldLogoUrl).catch(err => 
          logger.warn(`Failed to delete orphaned shop logo: ${oldLogoUrl}`, err)
        );
      }

      res.status(201).json({
        success: true,
        message: 'Shop logo uploaded successfully',
        data: {
          file_url: result.fileUrl,
          file_name: result.fileName
        }
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  // ============================================================================
  // ── 6. Payment Proof (สลิปการโอนเงิน) ───────────────────────────────────────
  // ============================================================================

  async uploadPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      UploadController.validateRequiredFields(req, ['transaction_id']);
      if (!req.file) throw new ValidationError('No file uploaded');

      const { transaction_id } = req.params;

      // 🟢 1. เช็คสลิปการโอนเก่า (ถ้ามี)
      const transaction = await db.payment_transactions.findByPk(transaction_id);
      const oldProofUrl = transaction?.proof_url; // (เช็คชื่อฟิลด์สลิปใน db.transactions)

      // 🟢 2. อัปโหลดสลิปใหม่
      const result = await fileUploadService.uploadSingleFile(
        req.file as UploadedFile,
        FILE_UPLOAD_CONFIG.PAYMENT_PROOFS,
        `payment_${transaction_id}_${Date.now()}`
      );

      if (!result.success) throw new ValidationError(result.error || 'Failed to upload payment proof');

      // 🟢 3. ลบสลิปเก่าออก (หากเป็นการอัปโหลดเพื่อแก้ไขสลิปเดิม)
      if (oldProofUrl) {
        fileUploadService.deleteFile(oldProofUrl).catch(err => 
          logger.warn(`Failed to delete old payment proof: ${oldProofUrl}`, err)
        );
      }

      res.status(201).json({
        success: true,
        message: 'Payment proof uploaded successfully',
        data: {
          file_url: result.fileUrl,
          file_name: result.fileName
        }
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }
}

export default new UploadController();