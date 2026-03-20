// ============================================================================
// src/routes/customer-portal.routes.ts
// ============================================================================
import { Router } from 'express';
import { verifyCustomerToken } from '../middlewares/auth.middleware';
import { checkLoanOwnership } from '../middlewares/customer.middleware';
import { uploadDocument } from '../middlewares/upload.middleware';
import uploadController from '../controllers/upload.controller';
import { getAllLoanByCustomerId } from '../controllers/loan-application.controller';

const router = Router();

// ลูกค้าทุกคนต้องมี Token (Login แล้ว)
router.use(verifyCustomerToken);

/**
 * @swagger
 * /portal/application/{application_id}/document:
 *   post:
 *     summary: Upload application document (Customer Portal)
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               doc_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded
 */
router.post(
  '/application/:application_id/document',
  checkLoanOwnership,             // 1. เช็คว่าเป็นบิลของตัวเองไหม
  uploadDocument.single('file'),  // 2. รับไฟล์ภาพ/PDF
  uploadController.uploadApplicationDocument // 3. ใช้ Controller เดิมบันทึกไฟล์ได้เลย!
);

/**
 * @swagger
 * /portal/application/{application_id}/documents:
 *   post:
 *     summary: Upload multiple application documents (Customer Portal)
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Documents uploaded
 */
router.post(
  '/application/:application_id/documents',
  checkLoanOwnership,             // 1. เช็คว่าเป็นบิลของตัวเองไหม
  uploadDocument.array('files', 10),
  uploadController.uploadMultipleDocuments
);

router.get('/applications',  getAllLoanByCustomerId); // เพิ่ม Route นี้สำหรับให้ลูกค้าเห็นบิลของตัวเอง

export default router;