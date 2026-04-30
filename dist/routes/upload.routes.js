"use strict";
// ==========================================
// src/routes/upload.routes.ts
// ==========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = __importDefault(require("../controllers/upload.controller"));
const upload_middleware_1 = require("../middlewares/upload.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ทุก route ต้อง authenticate ก่อน
router.use(auth_middleware_1.verifyToken);
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
router.post('/application/:customerId/document', upload_middleware_1.uploadDocument.single('file'), upload_controller_1.default.uploadApplicationDocument);
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
router.post('/application/:customerId/documents', upload_middleware_1.uploadDocument.array('files', 10), upload_controller_1.default.uploadMultipleDocuments);
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
router.get('/application/:application_id/documents', upload_controller_1.default.getApplicationDocuments);
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
router.delete('/document/:document_id', upload_controller_1.default.deleteDocument);
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
router.put('/document/:document_id', upload_middleware_1.uploadDocument.single('file'), upload_controller_1.default.replaceDocument);
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
router.post('/product/:product_id/image', upload_middleware_1.uploadProductImage.single('file'), upload_controller_1.default.uploadProductImage);
router.post('/variant-image', upload_middleware_1.uploadVariantImage.single('file'), upload_controller_1.default.uploadVariantImage);
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
router.post('/product/:product_id/gallery', upload_middleware_1.uploadProductImage.array('files', 5), upload_controller_1.default.uploadProductGallery);
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
router.post('/location/:customer_id/image/:application_id', upload_middleware_1.uploadLocationImage.array('files', 2), upload_controller_1.default.uploadLocationImage);
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
router.post('/shop/:partner_id/logo', upload_middleware_1.uploadShopLogo.single('file'), upload_controller_1.default.uploadShopLogo);
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
router.post('/payment/:transaction_id/proof', upload_middleware_1.uploadPaymentProof.single('file'), upload_controller_1.default.uploadPaymentProof);
router.post('/signature/:application_id', upload_middleware_1.uploadSignature.single('file'), upload_controller_1.default.uploadSignature);
exports.default = router;
