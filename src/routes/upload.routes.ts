
// ==========================================
// src/routes/upload.routes.ts
// ==========================================

import { Router } from 'express';
import uploadController from '../controllers/upload.controller';
import {
  uploadDocument,
  uploadProductImage,
  uploadVariantImage,
  uploadShopLogo,
  uploadPaymentProof,
  uploadLocationImage,
  uploadSignature
} from '../middlewares/upload.middleware';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '../types/permissions';

const router = Router();

// ทุก route ต้อง authenticate ก่อน
router.use(verifyToken);

/**
 * @swagger
 * /upload/application/{customerId}/document:
 *   post:
 *     summary: Upload application document
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
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
  '/application/:customerId/document',
  uploadDocument.single('file'),
  uploadController.uploadApplicationDocument
);

/**
 * @swagger
 * /upload/application/{customerId}/documents:
 *   post:
 *     summary: Upload multiple application documents
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
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
  '/application/:customerId/documents',
  uploadDocument.array('files', 10),
  uploadController.uploadMultipleDocuments
);

/**
 * @swagger
 * /upload/application/{application_id}/documents:
 *   get:
 *     summary: Get application documents
 *     tags: [Upload]
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
 */
router.get(
  '/application/:application_id/documents',
  uploadController.getApplicationDocuments
);

/**
 * @swagger
 * /upload/document/{document_id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Upload]
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
 *         description: Document deleted
 */
router.delete(
  '/document/:document_id',
  uploadController.deleteDocument
);

/**
 * @swagger
 * /upload/document/{document_id}:
 *   put:
 *     summary: Replace document
 *     tags: [Upload]
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
 *         description: Document replaced
 */
router.put(
  '/document/:document_id',
  uploadDocument.single('file'),
  uploadController.replaceDocument
);

/**
 * @swagger
 * /upload/product/{product_id}/image:
 *   post:
 *     summary: Upload product image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
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
 *       201:
 *         description: Image uploaded
 */
router.post(
  '/product/:product_id/image',
  uploadProductImage.single('file'),
  uploadController.uploadProductImage
);

router.post('/variant-image', uploadVariantImage.single('file'), uploadController.uploadVariantImage);

/**
 * @swagger
 * /upload/product/{product_id}/gallery:
 *   post:
 *     summary: Upload product gallery
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
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
 *         description: Gallery uploaded
 */
router.post(
  '/product/:product_id/gallery',
  uploadProductImage.array('files', 5),
  uploadController.uploadProductGallery
);

/**
 * @swagger
 * /upload/location/{customer_id}/image:
 *   post:
 *     summary: Upload customer location image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customer_id
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
 *         description: Location image uploaded
 */
router.post(
  '/location/:customer_id/image/:application_id',
  uploadLocationImage.array('files', 2),
  uploadController.uploadLocationImage
);

/**
 * @swagger
 * /upload/shop/{partner_id}/logo:
 *   post:
 *     summary: Upload shop logo
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
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
 *       201:
 *         description: Logo uploaded
 */
router.post(
  '/shop/:partner_id/logo',
  uploadShopLogo.single('file'),
  uploadController.uploadShopLogo
);

/**
 * @swagger
 * /upload/payment/{transaction_id}/proof:
 *   post:
 *     summary: Upload payment proof
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transaction_id
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
 *       201:
 *         description: Proof uploaded
 */
router.post(
  '/payment/:transaction_id/proof',
  uploadPaymentProof.single('file'),
  uploadController.uploadPaymentProof
);

router.post(
  '/signature/:application_id',
  uploadSignature.single('file'),
  uploadController.uploadSignature
);

export default router;

