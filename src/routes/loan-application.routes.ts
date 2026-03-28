// src/routes/loan-application.routes.ts
import { Router } from 'express';
import * as loanCtrl from '../controllers/loan-application.controller';
import { verifyToken, optionalVerifyToken } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '../types/permissions'

const router = Router();


/**
 * @swagger
 * /loan-application:
 *   get:
 *     summary: Get all loan applications
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of loan applications
 */
router.get('/', verifyToken, loanCtrl.getAllLoan);

/**
 * @swagger
 * /loan-application/{id}:
 *   get:
 *     summary: Get loan application by ID
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Loan application data
 *       404:
 *         description: Loan application not found
 */
router.get('/:id', verifyToken, loanCtrl.getLoanById);

/**
 * @swagger
 * /loan-application/loanID/{LoanId}:
 *   get:
 *     summary: Get loan application by Loan ID string
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: LoanId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan application data
 *       404:
 *         description: Loan application not found
 */
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

router.post('/:id/print-summary', verifyToken, loanCtrl.markApprovalSummaryPrinted);

/**
 * @swagger
 * /loan-application/draft/{id}:
 *   put:
 *     summary: Update a draft loan application
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
 *         description: Draft application updated
 */
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

/**
 * @swagger
 * /loan-application/{id}/apply:
 *   patch:
 *     summary: Submit a draft application
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Draft application submitted
 */
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
router.post('/create-with-customer', optionalVerifyToken , loanCtrl.createWithCustomer)

/**
 * @swagger
 * /loan-application/repayment-schedule/{application_id}:
 *   post:
 *     summary: Create repayment schedule
 *     tags: [Loan Application]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Repayment schedule created
 */
router.post('/repayment-schedule/:application_id', verifyToken, loanCtrl.createRepaymentSchedule);

/**
 * @swagger
 * /loan-application/repayment-schedule/{application_id}/all:
 *   get:
 *     summary: Get repayment schedule
 *     tags: [Loan Application]
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
 *         description: Repayment schedule details
 */
router.get('/repayment-schedule/:application_id/all', verifyToken, loanCtrl.getRepaymentSchedule);

export default router;