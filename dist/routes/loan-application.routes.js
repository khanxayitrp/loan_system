"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/loan-application.routes.ts
const express_1 = require("express");
const loanCtrl = __importStar(require("../controllers/loan-application.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
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
router.get('/', auth_middleware_1.verifyToken, loanCtrl.getAllLoan);
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
router.get('/:id', auth_middleware_1.verifyToken, loanCtrl.getLoanById);
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
router.get('/loanID/:LoanId', auth_middleware_1.verifyToken, loanCtrl.getLoanByLoanID);
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
router.post('/', auth_middleware_1.verifyToken, loanCtrl.createLoanApplication);
router.post('/:id/print-summary', auth_middleware_1.verifyToken, loanCtrl.markApprovalSummaryPrinted);
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
router.put('/draft/:id', auth_middleware_1.verifyToken, loanCtrl.updateDraftLoanApplication);
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
router.put('/:id', auth_middleware_1.verifyToken, loanCtrl.updateLoanApplication);
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
router.patch('/:id/status', auth_middleware_1.verifyToken, loanCtrl.changeStatus);
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
router.patch('/:id/apply', auth_middleware_1.verifyToken, loanCtrl.sentApplyDraft);
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
router.post('/create-with-customer', auth_middleware_1.optionalVerifyToken, loanCtrl.createWithCustomer);
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
router.post('/repayment-schedule/:application_id', auth_middleware_1.verifyToken, loanCtrl.createRepaymentSchedule);
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
router.get('/repayment-schedule/:application_id/all', auth_middleware_1.verifyToken, loanCtrl.getRepaymentSchedule);
exports.default = router;
