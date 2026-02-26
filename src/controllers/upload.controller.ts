// src/controllers/upload.controller.ts

/* import { Request, Response } from 'express';
import documentService from '../services/document.service';
import fileUploadService from '../services/fileUpload.service';
import { FILE_UPLOAD_CONFIG } from '../types/file.types';
import {logger} from '../utils/logger';

class UploadController { */
  /**
   * อัปโหลดเอกสารสำหรับ loan application
   * POST /api/upload/application/:application_id/document
   */
  /* async uploadApplicationDocument(req: Request, res: Response): Promise<void> {
    try {
      const { application_id } = req.params;
      const { doc_type } = req.body;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const document = await documentService.uploadApplicationDocument({
        application_id: parseInt(application_id),
        doc_type,
        file: req.file as any
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error in uploadApplicationDocument:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading document'
      });
    }
  } */

  /**
   * อัปโหลดหลายเอกสารพร้อมกัน
   * POST /api/upload/application/:application_id/documents
   */
  /* async uploadMultipleDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { application_id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
        return;
      }

      // สมมติว่า doc_type ส่งมาเป็น array ใน body
      const { doc_types } = req.body;
      
      const documents = files.map((file, index) => ({
        file: file as any,
        doc_type: doc_types[index]
      }));

      const results = await documentService.uploadMultipleDocuments(
        parseInt(application_id),
        documents
      );

      res.status(201).json({
        success: true,
        message: `${results.length} documents uploaded successfully`,
        data: results
      });
    } catch (error) {
      logger.error('Error in uploadMultipleDocuments:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading documents'
      });
    }
  } */

  /**
   * ดึงเอกสารทั้งหมดของ application
   * GET /api/upload/application/:application_id/documents
   */
  /* async getApplicationDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { application_id } = req.params;
      
      const documents = await documentService.getApplicationDocuments(
        parseInt(application_id)
      );

      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      logger.error('Error in getApplicationDocuments:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error getting documents'
      });
    }
  } */

  /**
   * ลบเอกสาร
   * DELETE /api/upload/document/:document_id
   */
  /* async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { document_id } = req.params;
      
      await documentService.deleteDocument(parseInt(document_id));

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteDocument:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error deleting document'
      });
    }
  } */

  /**
   * แทนที่เอกสาร
   * PUT /api/upload/document/:document_id
   */
  /* async replaceDocument(req: Request, res: Response): Promise<void> {
    try {
      const { document_id } = req.params;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const document = await documentService.replaceDocument(
        parseInt(document_id),
        req.file as any
      );

      res.status(200).json({
        success: true,
        message: 'Document replaced successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error in replaceDocument:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error replacing document'
      });
    }
  } */

  /**
   * อัปโหลดรูปสินค้า
   * POST /api/upload/product/:product_id/image
   */
  /* async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      const { product_id } = req.params;
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const result = await fileUploadService.uploadSingleFile(
        req.file as any,
        FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
        `product_${product_id}`
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Product image uploaded successfully',
        data: {
          file_url: result.fileUrl,
          file_name: result.fileName
        }
      });
    } catch (error) {
      logger.error('Error in uploadProductImage:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading image'
      });
    }
  } */

  /**
   * อัปโหลดรูปสินค้าหลายรูป (gallery)
   * POST /api/upload/product/:product_id/gallery
   */
  /* async uploadProductGallery(req: Request, res: Response): Promise<void> {
    try {
      const { product_id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
        return;
      }

      const results = await fileUploadService.uploadMultipleFiles(
        files as any,
        FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
        `product_${product_id}_gallery`
      );

      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      res.status(201).json({
        success: true,
        message: `${successfulUploads.length} images uploaded successfully`,
        data: {
          uploaded: successfulUploads.map(r => ({
            file_url: r.fileUrl,
            file_name: r.fileName
          })),
          failed: failedUploads.map(r => r.error)
        }
      });
    } catch (error) {
      logger.error('Error in uploadProductGallery:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading gallery'
      });
    }
  } */

  /**
   * อัปโหลดโลโก้ร้านค้า
   * POST /api/upload/shop/:partner_id/logo
   */
  /* async uploadShopLogo(req: Request, res: Response): Promise<void> {
    try {
      const { partner_id } = req.params;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const result = await fileUploadService.uploadSingleFile(
        req.file as any,
        FILE_UPLOAD_CONFIG.SHOP_LOGOS,
        `shop_${partner_id}_logo`
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
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
      logger.error('Error in uploadShopLogo:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading logo'
      });
    }
  } */

  /**
   * อัปโหลดหลักฐานการชำระเงิน
   * POST /api/upload/payment/:transaction_id/proof
   */
  /* async uploadPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id } = req.params;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const result = await fileUploadService.uploadSingleFile(
        req.file as any,
        FILE_UPLOAD_CONFIG.PAYMENT_PROOFS,
        `payment_${transaction_id}`
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
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
      logger.error('Error in uploadPaymentProof:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error uploading proof'
      });
    }
  }
} */

/* export default new UploadController(); */


// src/controllers/upload.controller.ts
// เวอร์ชันปรับปรุงให้เป็น Best Practice สำหรับระบบที่มีหลายประเภทไฟล์ (2026 style)

import { Request, Response } from 'express';
import documentService from '../services/document.service';
import fileUploadService from '../services/fileUpload.service';
import { FILE_UPLOAD_CONFIG, DocumentType, UploadedFile } from '../types/file.types';
import { logger } from '../utils/logger';
import { ValidationError, ForbiddenError, handleErrorResponse } from '../utils/errors';

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

  /**
   * Best Practice: ใช้ method เดียวสำหรับทุกประเภท upload แต่แยก logic ตาม config
   * แต่เนื่องจากคุณมีหลายประเภทชัดเจน จึงคงแยก method แต่เพิ่ม abstraction เล็กน้อย
   */

  // ── Application Documents ──────────────────────────────────────

  async uploadApplicationDocument(req: Request, res: Response): Promise<void> {
    try {
      UploadController.validateRequiredFields(req, ['application_id', 'doc_type']);

      const { application_id } = req.params;
      const { doc_type } = req.body;

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Optional: เช็คสิทธิ์เฉพาะ application นี้ (เช่น เป็น requester หรือ approver)
      // const app = await db.loan_applications.findByPk(application_id);
      // if (req.user?.id !== app?.requester_id && req.user?.id !== app?.approver_id) {
      //   throw new ForbiddenError('You are not authorized to upload documents for this application');
      // }

      const document = await documentService.uploadApplicationDocument({
        application_id: parseInt(application_id),
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
      UploadController.validateRequiredFields(req, ['application_id']);

      const { application_id } = req.params;
      const files = req.files as Express.Multer.File[];
      const { doc_types } = req.body;

      if (!files?.length) {
        throw new ValidationError('No files uploaded');
      }

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

      const results = await documentService.uploadMultipleDocuments(
        parseInt(application_id),
        documents
      );

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

      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { document_id } = req.params;
      await documentService.deleteDocument(parseInt(document_id));

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  async replaceDocument(req: Request, res: Response): Promise<void> {
    try {
      const { document_id } = req.params;

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const updated = await documentService.replaceDocument(
        parseInt(document_id),
        req.file as UploadedFile
      );

      res.status(200).json({
        success: true,
        message: 'Document replaced successfully',
        data: updated
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  // ── Product Images ─────────────────────────────────────────────

  async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      UploadController.validateRequiredFields(req, ['product_id']);

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const { product_id } = req.params;

      const result = await fileUploadService.uploadSingleFile(
        req.file as UploadedFile,
        FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
        `product_${product_id}`
      );

      if (!result.success) {
        throw new ValidationError(result.error || 'Failed to upload product image');
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

      if (!files?.length) {
        throw new ValidationError('No files uploaded');
      }

      // ✅ 2. Log ข้อมูลไฟล์สำหรับ debug
    logger.info('Uploading files:', {
      productId: product_id,
      fileCount: files.length,
      files: files.map(f => ({
        originalName: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        hasBuffer: !!f.buffer,
        bufferSize: f.buffer?.length,
        bufferPreview: f.buffer?.slice(0, 20).toString('hex')
      }))
    });

    // // ✅ 3. ตรวจสอบว่า buffer เป็น HTML หรือไม่
    // for (const file of files) {
    //   if (file.buffer && file.buffer.length > 0) {
    //     const bufferPreview = file.buffer.slice(0, 20).toString('utf-8');
    //     if (bufferPreview.includes('<!DOCTYPE') || bufferPreview.includes('<html')) {
    //       logger.error('File is HTML, not image:', {
    //         fileName: file.originalname,
    //         bufferPreview
    //       });
    //       throw new ValidationError(`ไฟล์ ${file.originalname} เป็น HTML ไม่ใช่รูปภาพ`);
    //     }
    //   }
    // }

      const results = await fileUploadService.uploadMultipleFiles(
        files as UploadedFile[],
        FILE_UPLOAD_CONFIG.PRODUCT_IMAGES,
        `product_${product_id}_gallery`
      );

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.status(201).json({
        success: successful.length > 0,
        message: `${successful.length} of ${files.length} images uploaded successfully`,
        data: {
          uploaded: successful.map(r => ({
            file_url: r.fileUrl,
            file_name: r.fileName
          })),
          failed: failed.map(r => ({
          error: r.error,
          fileName: files[failed.indexOf(r)]?.originalname
        }))
        }
      });
    } catch (error) {
      const errResp = handleErrorResponse(error);
      res.status(errResp.status).json(errResp);
    }
  }

  // ── Shop Logo ──────────────────────────────────────────────────

  async uploadShopLogo(req: Request, res: Response): Promise<void> {
    try {
      // this.validateRequiredFields(req, ['partner_id']);
       console.log('[UploadController] uploadShopLogo called');
      console.log('[UploadController] Params:', req.params);
      console.log('[UploadController] File:', req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file');


      const { partner_id } = req.params;

      if (!partner_id) {
        throw new ValidationError('partner_id is required');
      }
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      console.log('[UploadController] Uploading logo for shop:', partner_id);

      const result = await fileUploadService.uploadSingleFile(
        req.file as UploadedFile,
        FILE_UPLOAD_CONFIG.SHOP_LOGOS,
        `shop_${partner_id}_logo`
      );

      if (!result.success) {
        throw new ValidationError(result.error || 'Failed to upload shop logo');
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

  // ── Payment Proof ──────────────────────────────────────────────

  async uploadPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      UploadController.validateRequiredFields(req, ['transaction_id']);

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const { transaction_id } = req.params;

      const result = await fileUploadService.uploadSingleFile(
        req.file as UploadedFile,
        FILE_UPLOAD_CONFIG.PAYMENT_PROOFS,
        `payment_${transaction_id}`
      );

      if (!result.success) {
        throw new ValidationError(result.error || 'Failed to upload payment proof');
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