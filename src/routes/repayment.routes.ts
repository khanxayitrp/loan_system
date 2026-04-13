import { Router } from 'express';
import * as repaymentController from '../controllers/repayment.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();

/**
 * @swagger
 * /repayment/early-payoff/{application_id}:
 *   get:
 *     summary: Get early payoff summary for a loan application
 *     tags: [Repayment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the loan application
 *     responses:
 *       200:
 *         description: Early payoff summary calculated successfully
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
 *                   description: Payoff summary details
 *       400:
 *         description: Invalid application_id format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan application not found or already closed
 */
router.get('/early-payoff/:application_id', verifyToken, repaymentController.getEarlyPayoffSummary);

router.get('/schedule/:application_id', verifyToken, repaymentController.getRepaymentSchedule);

/**
 * @swagger
 * /repayment/pay:
 *   post:
 *     summary: Process a loan repayment payment
 *     tags: [Repayment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *                 description: The ID of the loan application
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               payment_method:
 *                 type: string
 *                 description: Payment method (e.g., cash, bank_transfer)
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 description: Payment date (optional, defaults to current date)
 *               notes:
 *                 type: string
 *                 description: Additional payment notes
 *     responses:
 *       200:
 *         description: Payment processed successfully
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
 *                   description: Payment processing result
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/pay', verifyToken, repaymentController.processPayment);

export default router;