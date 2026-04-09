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
const loan_contract_controller_1 = __importDefault(require("../controllers/loan_contract.controller"));
const pdf_controller_1 = require("../controllers/pdf.controller");
const loan_application_controller_1 = require("../controllers/loan-application.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Customer Portal
 *   description: API endpoints for customer portal (requires customer authentication)
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   responses:
 *     UnauthorizedError:
 *       description: Unauthorized - Missing or invalid token
 *     ForbiddenError:
 *       description: Forbidden - User does not own this loan application
 *     NotFoundError:
 *       description: Not Found - Resource not found
 *     BadRequestError:
 *       description: Bad Request - Invalid input data
 */
// ลูกค้าทุกคนต้องมี Token (Login แล้ว)
router.use(auth_middleware_1.verifyCustomerToken);
/**
 * @swagger
 * /portal/application/{application_id}/document:
 *   post:
 *     summary: Upload application document (Customer Portal)
 *     description: Upload a single document (image or PDF) for a loan application. Customer must own the application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan application ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (image or PDF)
 *               doc_type:
 *                 type: string
 *                 description: Document type
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 document_id:
 *                   type: integer
 *       400:
 *         description: Bad request - Missing file or invalid input
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
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
 *     description: Upload multiple documents (max 10 files) for a loan application. Customer must own the application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan application ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of document files (max 10 files)
 *     responses:
 *       201:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 document_ids:
 *                   type: array
 *                   items:
 *                     type: integer
 *       400:
 *         description: Bad request - Missing files or invalid input
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.post('/application/:application_id/documents', customer_middleware_1.checkLoanOwnership, // 1. เช็คว่าเป็นบิลของตัวเองไหม
upload_middleware_1.uploadDocument.array('files', 10), upload_controller_1.default.uploadMultipleDocuments);
/**
 * @swagger
 * /portal/applications:
 *   get:
 *     summary: Get all loan applications for the logged-in customer
 *     description: Retrieve a list of all loan applications owned by the authenticated customer
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   application_id:
 *                    type: integer
 *                   customer_id:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Server error
 */
router.get('/applications', loan_application_controller_1.getAllLoanByCustomerId); // เพิ่ม Route นี้สำหรับให้ลูกค้าเห็นบิลของตัวเอง
/**
 * @swagger
 * /portal/application/{application_id}:
 *   get:
 *     summary: Get a specific loan application (Customer Portal)
 *     description: Retrieve details of a specific loan application including customer info, product details, guarantors, and work information. Customer must own the application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan application ID
 *     responses:
 *       200:
 *         description: Application details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 customer_id:
 *                   type: integer
 *                 product_id:
 *                   type: integer
 *                 requester_id:
 *                   type: integer
 *                 loan_amount:
 *                   type: number
 *                   format: decimal
 *                 status:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     identity_number:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                     census_number:
 *                       type: string
 *                     address:
 *                       type: string
 *                     age:
 *                       type: integer
 *                     occupation:
 *                       type: string
 *                     income_per_month:
 *                       type: number
 *                       format: decimal
 *                     unit:
 *                       type: string
 *                     issue_place:
 *                       type: string
 *                     issue_date:
 *                       type: string
 *                       format: date
 *                     customer_work_infos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           company_name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           business_type:
 *                             type: string
 *                           business_detail:
 *                             type: string
 *                           duration_years:
 *                             type: integer
 *                           duration_months:
 *                             type: integer
 *                           department:
 *                             type: string
 *                           position:
 *                             type: string
 *                           salary:
 *                             type: number
 *                             format: decimal
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     customer_locations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           customer_id:
 *                             type: integer
 *                           address_detail:
 *                             type: string
 *                           latitude:
 *                             type: number
 *                             format: double
 *                           longitude:
 *                             type: number
 *                             format: double
 *                           is_primary:
 *                             type: boolean
 *                           location_type:
 *                             type: string
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     partner_id:
 *                       type: integer
 *                     productType_id:
 *                       type: integer
 *                     product_name:
 *                       type: string
 *                     brand:
 *                       type: string
 *                     model:
 *                       type: string
 *                     price:
 *                       type: number
 *                       format: decimal
 *                     interest_rate:
 *                       type: number
 *                       format: decimal
 *                     partner:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         shop_id:
 *                           type: integer
 *                         shop_name:
 *                           type: string
 *                         shop_owner:
 *                           type: string
 *                         contact_number:
 *                           type: string
 *                         shop_logo_url:
 *                           type: string
 *                         address:
 *                           type: string
 *                         business_type:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *                     productType:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         type_name:
 *                           type: string
 *                 requester:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                 loan_guarantors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       identity_number:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       address:
 *                         type: string
 *                       occupation:
 *                         type: string
 *                       relationship:
 *                         type: string
 *                       work_company_name:
 *                         type: string
 *                       work_position:
 *                         type: string
 *                       work_salary:
 *                         type: number
 *                         format: decimal
 *                       date_of_birth:
 *                         type: string
 *                         format: date
 *                       age:
 *                         type: integer
 *                       work_location:
 *                         type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.get('/application/:application_id', customer_middleware_1.checkLoanOwnership, loan_application_controller_1.getLoanbyCusIDandLoanID);
/**
 * @swagger
 * /portal/contract/{application_id}:
 *   get:
 *     summary: Get loan contract details (Customer Portal)
 *     description: Retrieve the loan contract associated with a specific loan application. Customer must own the application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan application ID (used as loan_id)
 *     responses:
 *       200:
 *         description: Loan contract details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     loan_id:
 *                       type: integer
 *                     contract_number:
 *                       type: string
 *                     status:
 *                       type: string
 *                     contract_date:
 *                       type: string
 *                       format: date-time
 *                     sign_date:
 *                       type: string
 *                       format: date-time
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *                     interest_rate:
 *                       type: number
 *                       format: decimal
 *                     down_payment:
 *                       type: number
 *                       format: decimal
 *                     total_amount:
 *                       type: number
 *                       format: decimal
 *                     installment_amount:
 *                       type: number
 *                       format: decimal
 *                     number_of_installments:
 *                       type: integer
 *                     partner_id:
 *                       type: integer
 *                     productType_id:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     "partner.id":
 *                       type: integer
 *                     "partner.shop_name":
 *                       type: string
 *                     "producttype.id":
 *                       type: integer
 *                     "producttype.type_name":
 *                       type: string
 *       400:
 *         description: Bad request - Invalid application_id
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this application
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.get('/contract/:application_id', customer_middleware_1.checkLoanOwnership, loan_contract_controller_1.default.getLoanContractFromCustomer); // เพิ่ม Route นี้สำหรับให้ลูกค้าเห็นสัญญาของตัวเอง
/**
 * @swagger
 * /portal/contract/{application_id}/pdf/{contractId}:
 *   get:
 *     summary: Get loan contract PDF (Customer Portal)
 *     description: Retrieve the PDF document of a loan contract. Customer must own the application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan application ID
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: PDF file retrieved successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request - Invalid application_id or contractId
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this application
 *       404:
 *         description: Contract or PDF not found
 *       500:
 *         description: Server error
 */
router.get('/contract/:application_id/pdf/:contractId', customer_middleware_1.checkLoanOwnership, pdf_controller_1.getCustomerLoanContractPDF); // เพิ่ม Route นี้สำหรับให้ลูกค้าเห็นสัญญาของตัวเอง
/**
 * @swagger
 * /portal/application/{application_id}/documents:
 *   get:
 *     summary: Get application documents (Customer Portal)
 *     description: Retrieve all documents uploaded for a specific loan application. Customer must own the application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan application ID
 *     responses:
 *       200:
 *         description: List of documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   document_id:
 *                     type: integer
 *                   application_id:
 *                     type: integer
 *                   doc_type:
 *                     type: string
 *                   file_path:
 *                     type: string
 *                   uploaded_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.get('/application/:application_id/documents', customer_middleware_1.checkLoanOwnership, // เช็คว่าเป็นบิลของตัวเองไหม
upload_controller_1.default.getApplicationDocuments);
/**
 * @swagger
 * /portal/document/{document_id}:
 *   delete:
 *     summary: Delete a document (Customer Portal)
 *     description: Delete a specific document uploaded by the customer. Customer must own the associated application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this document
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.delete('/document/:document_id', upload_controller_1.default.deleteDocument);
/**
 * @swagger
 * /portal/document/{document_id}:
 *   put:
 *     summary: Replace a document (Customer Portal)
 *     description: Replace an existing document with a new one. Customer must own the associated application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New document file to replace
 *     responses:
 *       200:
 *         description: Document replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 document_id:
 *                   type: integer
 *       400:
 *         description: Bad request - Missing file
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this document
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.put('/document/:document_id', upload_middleware_1.uploadDocument.single('file'), upload_controller_1.default.replaceDocument);
/**
 * @swagger
 * /portal/application/{application_id}/cancelled:
 *   put:
 *     summary: Cancel loan application (Customer Portal)
 *     description: Allow customer to cancel their own loan application. Customer must own the application.
 *     tags: [Customer Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan application ID to cancel
 *     responses:
 *       200:
 *         description: Application cancelled successfully
 *       400:
 *         description: Bad request - Cannot cancel application in this status
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not own this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.put('/application/:application_id/cancelled', customer_middleware_1.checkLoanOwnership, loan_application_controller_1.cancelLoanApplicationbyCustomer); // เพิ่ม Route นี้สำหรับให้ลูกค้า ยกเลิกบิลของตัวเอง
exports.default = router;
