"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================================================
// src/routes/customer-portal.routes.ts
// ============================================================================
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const customer_middleware_1 = require("../middlewares/customer.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const upload_controller_1 = __importDefault(require("../controllers/upload.controller"));
const router = (0, express_1.Router)();
// ลูกค้าทุกคนต้องมี Token (Login แล้ว)
router.use(auth_middleware_1.verifyCustomerToken);
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
router.post('/application/:application_id/document', customer_middleware_1.checkLoanOwnership, // 1. เช็คว่าเป็นบิลของตัวเองไหม
upload_middleware_1.uploadDocument.single('file'), // 2. รับไฟล์ภาพ/PDF
upload_controller_1.default.uploadApplicationDocument // 3. ใช้ Controller เดิมบันทึกไฟล์ได้เลย!
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
router.post('/application/:application_id/documents', customer_middleware_1.checkLoanOwnership, // 1. เช็คว่าเป็นบิลของตัวเองไหม
upload_middleware_1.uploadDocument.array('files', 10), upload_controller_1.default.uploadMultipleDocuments);
exports.default = router;
