// // src/services/document.service.ts
// import { db } from '../models/init-models';
// import fileUploadService from './fileUpload.service';
// import { FILE_UPLOAD_CONFIG, DocumentType, UploadedFile } from '../types/file.types';
// import { logger } from '../utils/logger';
// import { NotFoundError, ForbiddenError } from '@/utils/errors';
// import fs from 'fs/promises';
// import path from 'path';

// interface CreateDocumentData {
//   application_id: number;
//   doc_type: DocumentType;
//   file: UploadedFile;
//   original_filename: string;
//   file_size: number;
//   mime_type: string;
// }

// interface DocumentRecord {
//   id: number;
//   application_id: number;
//   file_url: string;
//   doc_type: DocumentType;
//   uploaded_at?: Date;
// }

// class DocumentService {

//   // =========================================================================
//   // 🟢 HELPER METHODS สำหรับเคลียร์ไฟล์ขยะ (Orphaned Files)
//   // =========================================================================
  
//   private async findDocumentsUploadsDirectory(): Promise<string | null> {
//     const possiblePaths = [
//       path.resolve(process.cwd(), 'public', 'uploads', 'documents'),
//       path.resolve(process.cwd(), 'uploads', 'documents'),
//       path.resolve(process.cwd(), 'src', 'public', 'uploads', 'documents'),
//       path.resolve(process.cwd(), '..', 'public', 'uploads', 'documents'),
//     ];
//     for (const testPath of possiblePaths) {
//       try {
//         await fs.access(testPath);
//         return testPath;
//       } catch { }
//     }
//     return null;
//   }

//   /**
//    * ค้นหาและลบไฟล์เอกสารในโฟลเดอร์ที่ไม่มี URL ปรากฏอยู่ใน Database แล้ว
//    * (เรียกใช้หลังจากบันทึกไฟล์ใหม่เสร็จสิ้น เพื่อไม่ให้กระทบ Transaction หลัก)
//    */
//   private async cleanupOrphanedApplicationDocuments(application_id: number): Promise<number> {
//     try {
//       // 1. ดึง URL ของไฟล์ทั้งหมดที่ยังผูกอยู่กับ Application นี้ในฐานข้อมูล
//       const dbRecords = await db.application_documents.findAll({
//         where: { application_id },
//         attributes: ['file_url'],
//         raw: true
//       });

//       const dbFileUrls = new Set<string>();
//       dbRecords.forEach((r: any) => {
//         if (r.file_url) dbFileUrls.add(r.file_url.trim());
//       });

//       // 2. หาโฟลเดอร์เก็บไฟล์ (อิงจาก FILE_UPLOAD_CONFIG.DOCUMENTS.path)
//       const baseUploadDir = await this.findDocumentsUploadsDirectory();
//       if (!baseUploadDir) return 0;

//       // 3. ค้นหาไฟล์ทั้งหมดในโฟลเดอร์ที่ขึ้นต้นด้วย app_id นี้
//       // (อิงจากการตั้งชื่อใน uploadResult: `app_${application_id}_`)
//       const pattern = `app_${application_id}_`;
//       const allFilePaths: string[] = [];

//       const searchDirectory = async (dir: string) => {
//         try {
//           const entries = await fs.readdir(dir, { withFileTypes: true });
//           for (const entry of entries) {
//             const fullPath = path.join(dir, entry.name);
//             if (entry.isDirectory()) {
//               await searchDirectory(fullPath);
//             } else if (entry.isFile() && entry.name.includes(pattern)) {
//               allFilePaths.push(fullPath);
//             }
//           }
//         } catch (err) { }
//       };
//       await searchDirectory(baseUploadDir);

//       if (allFilePaths.length === 0) return 0;

//       // 4. เปรียบเทียบไฟล์จริง กับ URL ในฐานข้อมูล
//       const orphanedFiles: string[] = [];
//       for (const filePath of allFilePaths) {
//         const normalizedPath = filePath.replace(/\\/g, '/');
//         // ดึงเฉพาะส่วนของ URL เช่น /uploads/documents/app_1_id_card.pdf
//         const match = normalizedPath.match(/uploads\/documents\/(.+)$/);
//         if (match) {
//           const dbUrl = `/uploads/documents/${match[1]}`;
//           if (!dbFileUrls.has(dbUrl)) {
//             orphanedFiles.push(filePath); // ไฟล์นี้ไม่มีใน DB = เป็นขยะ
//           }
//         }
//       }

//       // 5. สั่งลบไฟล์ขยะ
//       if (orphanedFiles.length > 0) {
//         let deletedCount = 0;
//         for (const filePath of orphanedFiles) {
//           try {
//             await fs.unlink(filePath); // ลบไฟล์โดยตรงผ่าน fs
//             deletedCount++;
//           } catch (e) { 
//             logger.warn(`Could not delete orphaned document: ${filePath}`);
//           }
//         }
//         if (deletedCount > 0) {
//           logger.info(`🗑️ Cleaned up ${deletedCount} orphaned document files for app_id: ${application_id}`);
//         }
//         return deletedCount;
//       }

//       return 0;
//     } catch (error) {
//       logger.error(`Error during document cleanup for app_id ${application_id}:`, error);
//       return 0;
//     }
//   }


//   // =========================================================================
//   // 🟢 CORE METHODS (อัปโหลด, ลบ, แทนที่)
//   // =========================================================================

//   /**
//    * อัปโหลดเอกสารสำหรับ loan application
//    */
//   async uploadApplicationDocument(data: CreateDocumentData): Promise<DocumentRecord> {
//     const transaction = await db.sequelize.transaction();
//     let uploadedPath: string | null = null;
    
//     try {
//       const application = await db.loan_applications.findByPk(data.application_id, { transaction });
//       if (!application) throw new NotFoundError('Loan application not found');

//       if (application.is_confirmed === 1) {
//         throw new ForbiddenError('ไม่สามารถอัปโหลดเอกสารเพิ่มได้หลังยื่นคำขอแล้ว');
//       }

//       // 1. ค้นหาว่ามีไฟล์ประเภทนี้ (doc_type) อยู่แล้วหรือไม่ ถ้ามีให้ลบออกจาก DB ก่อน (ป้องกันขยะในตาราง)
//       const existingDoc = await db.application_documents.findOne({
//         where: { application_id: data.application_id, doc_type: data.doc_type },
//         transaction
//       });

//       if (existingDoc) {
//         await existingDoc.destroy({ transaction });
//       }

//       // 2. อัปโหลดไฟล์ไปที่ Storage
//       const uploadResult = await fileUploadService.uploadSingleFile(
//         data.file,
//         FILE_UPLOAD_CONFIG.DOCUMENTS,
//         `app_${data.application_id}_${data.doc_type}_${Date.now()}` // เติมเวลาป้องกันชื่อซ้ำ
//       );

//       if (!uploadResult.success) {
//         throw new Error(uploadResult.error || 'Failed to upload file');
//       }
//       uploadedPath = uploadResult.fileUrl!;

//       // 3. บันทึกข้อมูลลง Database
//       const document = await db.application_documents.create({
//         application_id: data.application_id,
//         file_url: uploadedPath,
//         original_filename: data.file.originalname,
//         file_size: data.file.size,
//         mime_type: data.file.mimetype,
//         doc_type: data.doc_type
//       }, { transaction });

//       await transaction.commit();
//       logger.info(`Document saved: ${uploadedPath}`);

//       // 🟢 4. สั่งเคลียร์ไฟล์ขยะเบื้องหลัง (Background Task)
//       this.cleanupOrphanedApplicationDocuments(data.application_id).catch(e => {
//           logger.error('Failed to cleanup documents in background', e);
//       });

//       return document.get({ plain: true }) as DocumentRecord;

//     } catch (error) {
//       await transaction.rollback();
//       if (uploadedPath) {
//         const filePathToRemove = uploadedPath.replace(/^\//, '');
//         await fileUploadService.deleteFile(filePathToRemove).catch(err => 
//           logger.error(`Failed to cleanup orphaned file: ${filePathToRemove}`, err)
//         );
//       }
//       logger.error('Error uploading application document:', error);
//       throw error;
//     }
//   }

//   /**
//    * อัปโหลดหลายเอกสารพร้อมกัน
//    */
//   async uploadMultipleDocuments(
//     application_id: number,
//     documents: Array<{ file: UploadedFile; doc_type: DocumentType }>
//   ): Promise<DocumentRecord[]> {
//     try {
//       const results: DocumentRecord[] = [];

//       for (const doc of documents) {
//         const result = await this.uploadApplicationDocument({
//           application_id,
//           file: doc.file,
//           original_filename: doc.file.originalname,
//           file_size: doc.file.size,
//           mime_type: doc.file.mimetype,
//           doc_type: doc.doc_type
//         });
//         results.push(result);
//       }

//       // Cleanup ถูกเรียกใช้ไปแล้วใน uploadApplicationDocument ของแต่ละลูป
//       return results;
//     } catch (error) {
//       logger.error('Error uploading multiple documents:', error);
//       throw error;
//     }
//   }

//   /**
//    * ลบเอกสาร
//    */
//   async deleteDocument(document_id: number): Promise<boolean> {
//     const transaction = await db.sequelize.transaction();
//     try {
//       const document = await db.application_documents.findByPk(document_id);

//       if (!document) throw new Error('Document not found');

//       const fileUrl = document.file_url;
//       const appId = document.application_id;

//       // ลบจาก database ก่อน
//       await document.destroy({ transaction });

//       // ลบไฟล์จาก storage
//       const filePath = fileUrl.replace(/^\//, '');
//       await fileUploadService.deleteFile(filePath);

//       await transaction.commit();

//       // สั่งเคลียร์เผื่อมีไฟล์อื่นตกค้าง
//       this.cleanupOrphanedApplicationDocuments(appId).catch(() => {});

//       return true;
//     } catch (error) {
//       await transaction.rollback();
//       logger.error('Error deleting document:', error);
//       throw error;
//     }
//   }

//   /**
//    * ลบเอกสารทั้งหมดของ application (ใช้เมื่อยกเลิกคำขอ)
//    */
//   async deleteAllApplicationDocuments(application_id: number): Promise<boolean> {
//     try {
//       const documents = await this.getApplicationDocuments(application_id);

//       // ลบไฟล์ทั้งหมด
//       const filePaths = documents.map(doc => doc.file_url.replace(/^\//, ''));
//       await fileUploadService.deleteFiles(filePaths);

//       // ลบจาก database
//       await db.application_documents.destroy({
//         where: { application_id }
//       });

//       logger.info(`All documents deleted for application ${application_id}`);

//       // 🟢 กวาดขยะรอบสุดท้าย
//       this.cleanupOrphanedApplicationDocuments(application_id).catch(() => {});

//       return true;
//     } catch (error) {
//       logger.error('Error deleting all application documents:', error);
//       throw error;
//     }
//   }

//   /**
//    * ดึงเอกสารทั้งหมดของ application
//    */
//   async getApplicationDocuments(
//     application_id: number
//   ): Promise<DocumentRecord[]> {
//     try {
//       const documents = await db.application_documents.findAll({
//         where: { application_id },
//         order: [['uploaded_at', 'DESC']]
//       });

//       // บอก TypeScript ว่า doc_type จะไม่เป็น undefined จริง ๆ
//     return documents.map(doc => ({
//       ...doc.get({ plain: true }),
//       doc_type: doc.doc_type!  as DocumentType
//     }));
//     } catch (error) {
//       logger.error('Error getting application documents:', error);
//       throw error;
//     }
//   }

//   /**
//    * ดึงเอกสารตามประเภท
//    */
//   async getDocumentsByType(
//     application_id: number,
//     doc_type: DocumentType
//   ): Promise<DocumentRecord[]> {
//     try {
//       const documents = await db.application_documents.findAll({
//         where: {
//           application_id,
//           doc_type
//         },
//         order: [['uploaded_at', 'DESC']]
//       });

//         // บอก TypeScript ว่า doc_type จะไม่เป็น undefined จริง ๆ
//     return documents.map(doc => ({
//       ...doc.get({ plain: true }),
//       doc_type: doc.doc_type!  as DocumentType
//     }));
//     } catch (error) {
//       logger.error('Error getting documents by type:', error);
//       throw error;
//     }
//   }

//   /**
//    * แทนที่เอกสารเดิมด้วยเอกสารใหม่
//    */
//   async replaceDocument(
//     document_id: number,
//     new_file: UploadedFile
//   ): Promise<DocumentRecord> {
//     try {
//       const document = await db.application_documents.findByPk(document_id);

//       if (!document) {
//         throw new Error('Document not found');
//       }

//       const plainDoc = document.get({ plain: true });

//       // อัปโหลดไฟล์ใหม่
//       const uploadResult = await fileUploadService.uploadSingleFile(
//         new_file,
//         FILE_UPLOAD_CONFIG.DOCUMENTS,
//         `app_${plainDoc.application_id}_${plainDoc.doc_type}`
//       );

//       if (!uploadResult.success) {
//         throw new Error(uploadResult.error || 'Failed to upload new file');
//       }

//       // ลบไฟล์เก่า
//       const oldFilePath = plainDoc.file_url.replace(/^\//, '');
//       await fileUploadService.deleteFile(oldFilePath);

//       // อัปเดต database
//       await document.update({
//         file_url: uploadResult.fileUrl!
//       });

//       logger.info(`Document ${document_id} replaced successfully`);

//     // แก้ตรงนี้: cast type + ! สำหรับ doc_type
//     const updatedDoc = await db.application_documents.findByPk(document_id);
//     if (!updatedDoc) {
//       throw new Error('Updated document not found'); // safety
//     }

//     const plainUpdated = updatedDoc.get({ plain: true }) as DocumentRecord;

//     // ถ้าอยากชัวร์ 100% สามารถเพิ่ม runtime check
//     if (!plainUpdated.doc_type) {
//       logger.warn('doc_type is undefined after update', { document_id });
//       plainUpdated.doc_type = 'other'; // fallback
//     }

//     return plainUpdated;
//     } catch (error) {
//       logger.error('Error replacing document:', error);
//       throw error;
//     }
//   }

//   /**
//    * ตรวจสอบว่ามีเอกสารครบถ้วนหรือไม่
//    */
//   async checkRequiredDocuments(
//     application_id: number
//   ): Promise<{ complete: boolean; missing: DocumentType[] }> {
//     try {
//       const requiredTypes: DocumentType[] = ['id_card', 'house_reg', 'salary_slip'];
//       const documents = await this.getApplicationDocuments(application_id);

//       const existingTypes = documents.map(doc => doc.doc_type);
//       const missingTypes = requiredTypes.filter(
//         type => !existingTypes.includes(type)
//       );

//       return {
//         complete: missingTypes.length === 0,
//         missing: missingTypes
//       };
//     } catch (error) {
//       logger.error('Error checking required documents:', error);
//       throw error;
//     }
//   }

// }

// export default new DocumentService();

// src/services/document.service.ts
import { db } from '../models/init-models';
import fileUploadService from './fileUpload.service';
import { FILE_UPLOAD_CONFIG, DocumentType, UploadedFile } from '../types/file.types';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { Op } from 'sequelize';

// 🟢 Import Helper Function ที่เราแยกออกไป
import { calculateExpiryDate } from '../utils/calculateExpiryDate';

interface CreateDocumentData {
  customer_id: number;
  doc_type: DocumentType;
  file: UploadedFile;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: number;
}

interface DocumentRecord {
  id: number;
  customer_id: number;
  file_url: string;
  doc_type: DocumentType;
  uploaded_at?: Date;
  expires_at?: Date | null;
}

class DocumentService {

  /**
   * 🟢 ເພີ່ມ Function ນີ້ເພື່ອແກ້ໄຂ Error 500
   * ດຶງເອກະສານທັງໝົດໂດຍອີງຕາມ Application ID
   */
  async getApplicationDocuments(application_id: number): Promise<DocumentRecord[]> {
    try {
      // 1. ຊອກຫາຂໍ້ມູນ Application ກ່ອນເພື່ອເອົາ customer_id
      // ໝາຍເຫດ: ໃຫ້ໝັ້ນໃຈວ່າໃນ db.loan_applications ມີຄວາມສຳພັນກັບ customer
      const application = await db.loan_applications.findByPk(application_id);
      
      if (!application) {
        throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນຄຳຂໍສິນເຊື່ອ (Application not found)');
      }

      const customer_id = application.customer_id;

      // 2. ເອີ້ນໃຊ້ Function ທີ່ມີຢູ່ແລ້ວເພື່ອດຶງເອກະສານຂອງ Customer ນັ້ນ
      return await this.getCustomerDocuments(customer_id);
      
    } catch (error) {
      logger.error('Error in getApplicationDocuments service:', error);
      throw error;
    }
  }
  // =========================================================================
  // 🟢 CORE METHODS (อัปโหลด, ลบ, แทนที่)
  // =========================================================================

  /**
   * อัปโหลดเอกสารสำหรับลูกค้า
   */
  async uploadApplicationDocument(data: CreateDocumentData): Promise<DocumentRecord> {
    const transaction = await db.sequelize.transaction();
    let uploadedPath: string | null = null;
    console.log('uploadApplicationDocument called with data:', data);
    try {
      const customer = await db.customers.findByPk(data.customer_id, { transaction });
      if (!customer) throw new NotFoundError('Customer not found');

      // 1. ค้นหาว่ามีไฟล์ประเภทนี้อยู่แล้วหรือไม่
      const existingDoc = await db.customer_documents.findOne({
        where: { customer_id: data.customer_id, doc_type: data.doc_type },
        transaction
      });

      if (existingDoc) {
        const oldFileUrl = existingDoc.file_url;
        await existingDoc.destroy({ transaction });
        
        // ลบไฟล์เก่าจาก Cloud แบบ Background (ไม่รอให้เสร็จ เพื่อไม่ให้ API ช้า)
        if (oldFileUrl) {
          fileUploadService.deleteFile(oldFileUrl).catch(err => 
            logger.warn(`Failed to delete old file from MinIO: ${oldFileUrl}`, err)
          );
        }
      }

      // 2. อัปโหลดไฟล์ไปที่ MinIO Storage
      const uploadResult = await fileUploadService.uploadSingleFile(
        data.file,
        FILE_UPLOAD_CONFIG.DOCUMENTS,
        `app_cus_${data.customer_id}_${data.doc_type}_${Date.now()}` 
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file to MinIO');
      }
      uploadedPath = uploadResult.fileUrl!;

      // 🟢 3. เรียกใช้ฟังก์ชันคำนวณวันหมดอายุที่แยกไฟล์ไว้
      const expiresAt = calculateExpiryDate(data.doc_type);

      // 4. บันทึกข้อมูลลง Database
      const document = await db.customer_documents.create({
        customer_id: data.customer_id,
        file_url: uploadedPath, 
        original_filename: data.original_filename,
        file_size: data.file_size,
        mime_type: data.mime_type,
        doc_type: data.doc_type,
        expires_at: expiresAt, 
        uploaded_by: data.uploaded_by || null 
      }, { transaction });

      await transaction.commit();
      logger.info(`Document saved successfully to MinIO: ${uploadedPath}`);

      return document.get({ plain: true }) as DocumentRecord;

    } catch (error) {
      await transaction.rollback();
      
      // Rollback File บน MinIO หาก DB Error
      if (uploadedPath) {
        await fileUploadService.deleteFile(uploadedPath).catch(err => 
          logger.error(`Failed to cleanup file from MinIO after DB error: ${uploadedPath}`, err)
        );
      }
      
      logger.error('Error uploading application document:', error);
      throw error;
    }
  }

  /**
   * อัปโหลดหลายเอกสารพร้อมกัน
   */
  async uploadMultipleDocuments(
    customer_id: number,
    uploaded_by: number,
    documents: Array<{ file: UploadedFile; doc_type: DocumentType }>
  ): Promise<DocumentRecord[]> {
    try {
      const uploadPromises = documents.map(doc => 
        this.uploadApplicationDocument({
          customer_id,
          file: doc.file,
          original_filename: doc.file.originalname,
          file_size: doc.file.size,
          mime_type: doc.file.mimetype,
          doc_type: doc.doc_type,
          uploaded_by
        })
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      logger.error('Error uploading multiple documents:', error);
      throw error;
    }
  }

  /**
   * ลบเอกสาร
   */
  async deleteDocument(document_id: number): Promise<boolean> {
    const transaction = await db.sequelize.transaction();
    try {
      const document = await db.customer_documents.findByPk(document_id);
      if (!document) throw new Error('Document not found');

      const fileUrl = document.file_url;

      await document.destroy({ transaction });
      await fileUploadService.deleteFile(fileUrl);

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * ลบเอกสารทั้งหมดของลูกค้า (ใช้เมื่อต้องการลบข้อมูลลูกค้าทิ้ง)
   */
  async deleteAllCustomerDocuments(customer_id: number): Promise<boolean> {
    try {
      const documents = await this.getCustomerDocuments(customer_id);

      const fileUrls = documents.map(doc => doc.file_url);
      if (fileUrls.length > 0) {
        await fileUploadService.deleteFiles(fileUrls);
      }

      await db.customer_documents.destroy({
        where: { customer_id }
      });

      logger.info(`All documents deleted for customer ${customer_id} from MinIO and DB`);
      return true;
    } catch (error) {
      logger.error('Error deleting all customer documents:', error);
      throw error;
    }
  }

  /**
   * ดึงเอกสารทั้งหมดของลูกค้า
   */
  async getCustomerDocuments(
    customer_id: number
  ): Promise<DocumentRecord[]> {
    try {
      const documents = await db.customer_documents.findAll({
        where: { customer_id },
        order: [['uploaded_at', 'DESC']]
      });

      return documents.map(doc => ({
        ...doc.get({ plain: true }),
        doc_type: doc.doc_type! as DocumentType
      }));
    } catch (error) {
      logger.error('Error getting customer documents:', error);
      throw error;
    }
  }

  /**
   * ดึงเอกสารตามประเภท
   */
  async getDocumentsByType(
    customer_id: number,
    doc_type: DocumentType
  ): Promise<DocumentRecord[]> {
    try {
      const documents = await db.customer_documents.findAll({
        where: {
          customer_id,
          doc_type
        },
        order: [['uploaded_at', 'DESC']]
      });

      return documents.map(doc => ({
        ...doc.get({ plain: true }),
        doc_type: doc.doc_type! as DocumentType
      }));
    } catch (error) {
      logger.error('Error getting documents by type:', error);
      throw error;
    }
  }

  /**
   * แทนที่เอกสารเดิมด้วยเอกสารใหม่
   */
  async replaceDocument(
    document_id: number,
    new_file: UploadedFile,
    uploaded_by?: number
  ): Promise<DocumentRecord> {
    try {
      const document = await db.customer_documents.findByPk(document_id);
      if (!document) throw new Error('Document not found');

      const plainDoc = document.get({ plain: true });

      const uploadResult = await fileUploadService.uploadSingleFile(
        new_file,
        FILE_UPLOAD_CONFIG.DOCUMENTS,
        `app_cus_${plainDoc.customer_id}_${plainDoc.doc_type}_${Date.now()}`
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload new file to MinIO');
      }

      await fileUploadService.deleteFile(plainDoc.file_url).catch(err => 
        logger.warn(`Failed to delete old file during replace: ${plainDoc.file_url}`, err)
      );

      // 🟢 คำนวณวันหมดอายุใหม่
      const expiresAt = calculateExpiryDate(plainDoc.doc_type as DocumentType);

      await document.update({
        file_url: uploadResult.fileUrl!,
        original_filename: new_file.originalname,
        file_size: new_file.size,
        mime_type: new_file.mimetype,
        expires_at: expiresAt,
        uploaded_by: uploaded_by || document.uploaded_by
      });

      logger.info(`Document ${document_id} replaced successfully on MinIO`);

      const updatedDoc = await db.customer_documents.findByPk(document_id);
      const plainUpdated = updatedDoc!.get({ plain: true }) as DocumentRecord;

      if (!plainUpdated.doc_type) {
        plainUpdated.doc_type = 'other'; 
      }

      return plainUpdated;
    } catch (error) {
      logger.error('Error replacing document:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่ามีเอกสารครบถ้วน และ "ยังไม่หมดอายุ" หรือไม่
   */
  async checkRequiredDocuments(
    customer_id: number
  ): Promise<{ complete: boolean; missing: DocumentType[] }> {
    try {
      const requiredTypes: DocumentType[] = ['id_card', 'house_reg', 'salary_slip'];
      
      const validDocuments = await db.customer_documents.findAll({
        where: {
          customer_id,
          [Op.or]: [
            { expires_at: { [Op.is]: null } }, 
            { expires_at: { [Op.gt]: new Date() } } 
          ]
        } as any
      });

      const existingTypes = validDocuments.map(doc => doc.doc_type);
      
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
}

export default new DocumentService();