import express from 'express';
import { generateLoanPDF, generateLoanContractPDF, generateRepaymentSchedulePDF, generateDeliveryReceiptPDF } from '../controllers/pdf.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();
router.use(verifyToken); // ใช้ verifyToken กับทุก Route ในไฟล์นี้
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
router.post('/generate-loan-pdf', generateLoanPDF);

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
router.post('/generate-loan-contract', generateLoanContractPDF);

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
router.post('/generate-repayment-schedule', generateRepaymentSchedulePDF);

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
router.post('/delivery-receipt',  generateDeliveryReceiptPDF);

export default router;