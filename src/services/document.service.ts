// src/services/document.service.ts

import { db } from '../models/init-models';
import fileUploadService from './fileUpload.service';
import { FILE_UPLOAD_CONFIG, DocumentType, UploadedFile } from '../types/file.types';
import {logger} from '../utils/logger';

interface CreateDocumentData {
  application_id: number;
  doc_type: DocumentType;
  file: UploadedFile;
}

interface DocumentRecord {
  id: number;
  application_id: number;
  file_url: string;
  doc_type: DocumentType;
  uploaded_at?: Date;
}

class DocumentService {
  /**
   * อัปโหลดเอกสารสำหรับ loan application
   */
  async uploadApplicationDocument(
    data: CreateDocumentData
  ): Promise<DocumentRecord> {

    const transaction = await db.sequelize.transaction(); // เริ่ม Transaction
    let uploadedPath: string | null = null;
    try {
      // ตรวจสอบว่า application มีอยู่จริง
      const application = await db.loan_applications.findByPk(data.application_id);
      if (!application) {
        throw new Error('Loan application not found');
      }

      // อัปโหลดไฟล์
      const uploadResult = await fileUploadService.uploadSingleFile(
        data.file,
        FILE_UPLOAD_CONFIG.DOCUMENTS,
        `app_${data.application_id}_${data.doc_type}`
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // บันทึกข้อมูลลง database
      const document = await db.application_documents.create({
        application_id: data.application_id,
        file_url: uploadResult.fileUrl!,
        doc_type: data.doc_type
      });

      logger.info(
        `Document uploaded for application ${data.application_id}: ${uploadResult.fileName}`
      );

    //   return document.get({ plain: true });
    // Since you just created it with a valid doc_type, it's safe to assert
const plain = document.get({ plain: true }) as DocumentRecord;
return plain;
    } catch (error) {
      logger.error('Error uploading application document:', error);
      throw error;
    }
  }

  /**
   * อัปโหลดหลายเอกสารพร้อมกัน
   */
  async uploadMultipleDocuments(
    application_id: number,
    documents: Array<{ file: UploadedFile; doc_type: DocumentType }>
  ): Promise<DocumentRecord[]> {
    try {
      const results: DocumentRecord[] = [];

      for (const doc of documents) {
        const result = await this.uploadApplicationDocument({
          application_id,
          file: doc.file,
          doc_type: doc.doc_type
        });
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Error uploading multiple documents:', error);
      throw error;
    }
  }

  /**
   * ดึงเอกสารทั้งหมดของ application
   */
  async getApplicationDocuments(
    application_id: number
  ): Promise<DocumentRecord[]> {
    try {
      const documents = await db.application_documents.findAll({
        where: { application_id },
        order: [['uploaded_at', 'DESC']]
      });

      return documents.map(doc => doc.get({ plain: true }));
    } catch (error) {
      logger.error('Error getting application documents:', error);
      throw error;
    }
  }

  /**
   * ดึงเอกสารตามประเภท
   */
  async getDocumentsByType(
    application_id: number,
    doc_type: DocumentType
  ): Promise<DocumentRecord[]> {
    try {
      const documents = await db.application_documents.findAll({
        where: {
          application_id,
          doc_type
        },
        order: [['uploaded_at', 'DESC']]
      });

      return documents.map(doc => doc.get({ plain: true }));
    } catch (error) {
      logger.error('Error getting documents by type:', error);
      throw error;
    }
  }

  /**
   * ลบเอกสาร
   */
  async deleteDocument(document_id: number): Promise<boolean> {
    try {
      const document = await db.application_documents.findByPk(document_id);
      
      if (!document) {
        throw new Error('Document not found');
      }

      const plainDoc = document.get({ plain: true });

      // ลบไฟล์จาก storage
      const filePath = plainDoc.file_url.replace(/^\//, ''); // ลบ / ด้านหน้า
      await fileUploadService.deleteFile(filePath);

      // ลบจาก database
      await document.destroy();

      logger.info(`Document ${document_id} deleted successfully`);
      return true;
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * แทนที่เอกสารเดิมด้วยเอกสารใหม่
   */
  async replaceDocument(
    document_id: number,
    new_file: UploadedFile
  ): Promise<DocumentRecord> {
    try {
      const document = await db.application_documents.findByPk(document_id);
      
      if (!document) {
        throw new Error('Document not found');
      }

      const plainDoc = document.get({ plain: true });

      // อัปโหลดไฟล์ใหม่
      const uploadResult = await fileUploadService.uploadSingleFile(
        new_file,
        FILE_UPLOAD_CONFIG.DOCUMENTS,
        `app_${plainDoc.application_id}_${plainDoc.doc_type}`
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload new file');
      }

      // ลบไฟล์เก่า
      const oldFilePath = plainDoc.file_url.replace(/^\//, '');
      await fileUploadService.deleteFile(oldFilePath);

      // อัปเดต database
      await document.update({
        file_url: uploadResult.fileUrl!
      });

      logger.info(`Document ${document_id} replaced successfully`);

      const updatedDoc = await db.application_documents.findByPk(document_id);
      return updatedDoc!.get({ plain: true });
    } catch (error) {
      logger.error('Error replacing document:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่ามีเอกสารครบถ้วนหรือไม่
   */
  async checkRequiredDocuments(
    application_id: number
  ): Promise<{ complete: boolean; missing: DocumentType[] }> {
    try {
      const requiredTypes: DocumentType[] = ['id_card', 'house_reg', 'salary_slip'];
      const documents = await this.getApplicationDocuments(application_id);
      
      const existingTypes = documents.map(doc => doc.doc_type);
      const missingTypes = requiredTypes.filter(
        type => !existingTypes.includes(type)
      );

      return {
        complete: missingTypes.length === 0,
        missing: missingTypes
      };
    } catch (error) {
      logger.error('Error checking required documents:', error);
      throw error;
    }
  }

  /**
   * ลบเอกสารทั้งหมดของ application (ใช้เมื่อยกเลิกคำขอ)
   */
  async deleteAllApplicationDocuments(
    application_id: number
  ): Promise<boolean> {
    try {
      const documents = await this.getApplicationDocuments(application_id);
      
      // ลบไฟล์ทั้งหมด
      const filePaths = documents.map(doc => doc.file_url.replace(/^\//, ''));
      await fileUploadService.deleteFiles(filePaths);

      // ลบจาก database
      await db.application_documents.destroy({
        where: { application_id }
      });

      logger.info(`All documents deleted for application ${application_id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting all application documents:', error);
      throw error;
    }
  }
}

export default new DocumentService();