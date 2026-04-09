"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pdf_controller_1 = require("../controllers/pdf.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.verifyToken); // ใช้ verifyToken กับทุก Route ในไฟล์นี้
// ✅ PDF Generation Route
/**
 * @swagger
 * tags:
 *   name: PDF
 *   description: PDF Generation API
 */
/**
 * @swagger
 * /pdf/generate-loan-pdf:
 *   post:
 *     summary: Generate loan application document as PDF
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loan_id:
 *                 type: integer
 *                 description: The ID of the loan application
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request, missing parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan application not found
 *       500:
 *         description: Internal server error
 */
router.post('/generate-loan-pdf', pdf_controller_1.generateLoanPDF);
/**
 * @swagger
 * /pdf/generate-loan-contract:
 *   post:
 *     summary: Generate loan contract agreement document as PDF
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loan_id:
 *                 type: integer
 *                 description: The ID of the loan application
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request, missing parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan contract not found
 *       500:
 *         description: Internal server error
 */
router.post('/generate-loan-contract', pdf_controller_1.generateLoanContractPDF);
/**
 * @swagger
 * /pdf/generate-repayment-schedule:
 *   post:
 *     summary: Generate repayment schedule document as PDF
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loan_id:
 *                 type: integer
 *                 description: The ID of the loan application
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request, missing parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Repayment schedule not found
 *       500:
 *         description: Internal server error
 */
router.post('/generate-repayment-schedule', pdf_controller_1.generateRepaymentSchedulePDF);
/**
 * @swagger
 * /pdf/delivery-receipt:
 *   post:
 *     summary: Generate delivery receipt document as PDF
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receipt_id:
 *                 type: integer
 *                 description: The ID of the delivery receipt
 *               loan_id:
 *                 type: integer
 *                 description: (Optional) The ID of the loan application related to the receipt
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request, missing parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Delivery receipt not found
 *       500:
 *         description: Internal server error
 */
router.post('/delivery-receipt', pdf_controller_1.generateDeliveryReceiptPDF);
exports.default = router;
