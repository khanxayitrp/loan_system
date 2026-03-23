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

/**
 * @swagger
 * tags:
 *   name: Customer Portal
 *   description: API endpoints for customer portal (requires customer authentication)
 */

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

/**
 * @swagger
 * /portal/applications:
 *   get:
 *     summary: Get all loan applications for the logged-in customer
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 *       401:
 *         description: Unauthorized
 */
router.get('/applications',  getAllLoanByCustomerId); // เพิ่ม Route นี้สำหรับให้ลูกค้าเห็นบิลของตัวเอง


/**
 * @swagger
 * /portal/application/{application_id}/documents:
 *   get:
 *     summary: Get application documents (Customer Portal)
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not loan owner)
 *       404:
 *         description: Application not found
 */
router.get(
  '/application/:application_id/documents',
  checkLoanOwnership, // เช็คว่าเป็นบิลของตัวเองไหม
  uploadController.getApplicationDocuments
);

/**
 * @swagger
 * /portal/document/{document_id}:
 *   delete:
 *     summary: Delete a document (Customer Portal)
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 */
router.delete(
  '/document/:document_id',
  uploadController.deleteDocument
);

/**
 * @swagger
 * /portal/document/{document_id}:
 *   put:
 *     summary: Replace a document (Customer Portal)
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document_id
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
 *     responses:
 *       200:
 *         description: Document replaced successfully
 *       400:
 *         description: Bad request (missing file)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 */
router.put(
  '/document/:document_id',
  uploadDocument.single('file'),
  uploadController.replaceDocument
);

export default router;