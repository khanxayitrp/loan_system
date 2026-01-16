// src/controllers/upload.controller.ts

import { Request, Response } from 'express';
import documentService from '../services/document.service';
import fileUploadService from '../services/fileUpload.service';
import { FILE_UPLOAD_CONFIG } from '../types/file.types';
import {logger} from '../utils/logger';

class UploadController {
  /**
   * อัปโหลดเอกสารสำหรับ loan application
   * POST /api/upload/application/:application_id/document
   */
  async uploadApplicationDocument(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * อัปโหลดหลายเอกสารพร้อมกัน
   * POST /api/upload/application/:application_id/documents
   */
  async uploadMultipleDocuments(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * ดึงเอกสารทั้งหมดของ application
   * GET /api/upload/application/:application_id/documents
   */
  async getApplicationDocuments(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * ลบเอกสาร
   * DELETE /api/upload/document/:document_id
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * แทนที่เอกสาร
   * PUT /api/upload/document/:document_id
   */
  async replaceDocument(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * อัปโหลดรูปสินค้า
   * POST /api/upload/product/:product_id/image
   */
  async uploadProductImage(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * อัปโหลดรูปสินค้าหลายรูป (gallery)
   * POST /api/upload/product/:product_id/gallery
   */
  async uploadProductGallery(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * อัปโหลดโลโก้ร้านค้า
   * POST /api/upload/shop/:partner_id/logo
   */
  async uploadShopLogo(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * อัปโหลดหลักฐานการชำระเงิน
   * POST /api/upload/payment/:transaction_id/proof
   */
  async uploadPaymentProof(req: Request, res: Response): Promise<void> {
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
}

export default new UploadController();