// src/routes/loan-application.routes.ts
import { Router } from 'express';
import * as loanCtrl from '../controllers/loan-application.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '../types/permissions'

const router = Router();


router.get('/', verifyToken, loanCtrl.getAllLoan);

router.get('/:id', verifyToken, loanCtrl.getLoanById);

router.get('/loanID/:LoanId', verifyToken, loanCtrl.getLoanByLoanID);

/**
 * @swagger
 * /loan-application:
 *   post:
 *     summary: Create loan application
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - product_id
 *               - total_amount
 *               - interest_rate_at_apply
 *               - loan_period
 *               - monthly_installment
 *             properties:
 *               customer_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *               total_amount:
 *                 type: number
 *               interest_rate_at_apply:
 *                 type: number
 *               loan_period:
 *                 type: integer
 *               monthly_installment:
 *                 type: number
 *     responses:
 *       201:
 *         description: Application created
 */
router.post('/', verifyToken, loanCtrl.createLoanApplication);

router.put('/draft/:id', verifyToken, loanCtrl.updateDraftLoanApplication);

/**
 * @swagger
 * /loan-application/{id}:
 *   put:
 *     summary: Update loan application
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Application updated
 */
router.put('/:id', verifyToken, loanCtrl.updateLoanApplication);

/**
 * @swagger
 * /loan-application/{id}/status:
 *   patch:
 *     summary: Change application status
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, verifying, approved, rejected, cancelled, completed, closed_early]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch('/:id/status', verifyToken, loanCtrl.changeStatus);

router.patch('/:id/apply', verifyToken, loanCtrl.sentApplyDraft);

/**
 * @swagger
 * /loan-application/create-with-customer:
 *   post:
 *     summary: Create loan application with customer
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Application and customer created
 */
router.post('/create-with-customer', verifyToken , loanCtrl.createWithCustomer)

export default router;