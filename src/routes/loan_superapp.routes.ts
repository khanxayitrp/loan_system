import { Router } from 'express';
import * as loanSuperContrl from '../controllers/loanSummaryDetails.controller'; 
import { verifyCustomerToken, verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /loan-superapp/customer/{customerId}/summary:
 *   get:
 *     summary: Get loan summary for a customer
 *     tags: [Loan Superapp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Loan summary details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "ດຶງຂໍ້ມູນລາຍການຜ່ອນຊຳລະສຳເລັດ"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         active_count:
 *                           type: integer
 *                           example: 1
 *                         total_monthly_pay:
 *                           type: number
 *                           example: 826667
 *                     active_loans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           loan_id:
 *                             type: integer
 *                             example: 1
 *                           loan_number:
 *                             type: string
 *                             example: "LN-10-2026-000024"
 *                           product_name:
 *                             type: string
 *                             example: "ແວ່ນຕາ ກັນແສງ"
 *                           shop_name:
 *                             type: string
 *                             example: "serd_shop"
 *                           total_amount:
 *                             type: number
 *                             example: 10000000
 *                           monthly_pay:
 *                             type: number
 *                             example: 826667
 *                           total_installments:
 *                             type: integer
 *                             example: 12
 *                           paid_installments:
 *                             type: integer
 *                             example: 0
 *                           months_left:
 *                             type: integer
 *                             example: 12
 *                           remaining_balance:
 *                             type: number
 *                             example: 9920000
 *                           next_due_date:
 *                             type: string
 *                             format: date
 *                             example: "2026-05-05"
 *                           status:
 *                             type: string
 *                             example: "disbursed"
 *                     completed_loans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Same structure as active_loans
 *       400:
 *         description: Invalid customer ID format
 *       500:
 *         description: Server error
 */
router.get('/customer/:customerId/summary', loanSuperContrl.getLoanSummaryForCustomer);

/**
 * @swagger
 * /loan-superapp/{loanId}/installments:
 *   get:
 *     summary: Get loan installments by loan ID
 *     tags: [Loan Superapp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Installment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "ດຶງຂໍ້ມູນລາຍລະອຽດການຜ່ອນຊຳລະສຳເລັດ"
 *                 data:
 *                   type: object
 *                   properties:
 *                     header:
 *                       type: object
 *                       properties:
 *                         loan_id:
 *                           type: string
 *                           example: "LN-10-2026-000024"
 *                         product_name:
 *                           type: string
 *                           example: "ແວ່ນຕາ ກັນແສງ"
 *                     progress:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: integer
 *                           example: 1
 *                         total:
 *                           type: integer
 *                           example: 12
 *                     summary_amounts:
 *                       type: object
 *                       properties:
 *                         total_amount:
 *                           type: number
 *                           example: 12490000
 *                         total_paid:
 *                           type: number
 *                           example: 2490000
 *                         total_remaining:
 *                           type: number
 *                           example: 10000000
 *                     installments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 101
 *                           installment_no:
 *                             type: integer
 *                             example: 1
 *                           due_date:
 *                             type: string
 *                             format: date
 *                             example: "2025-01-15"
 *                           amount_due:
 *                             type: number
 *                             example: 822000
 *                           balance_after_payment:
 *                             type: number
 *                             example: 11668000
 *                           status:
 *                             type: string
 *                             enum: [paid, current, pending]
 *                             example: "paid"
 *                           db_status:
 *                             type: string
 *                             example: "paid"
 *       400:
 *         description: Invalid loan ID format
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Server error
 */
router.get('/:loanId/installments', loanSuperContrl.getLoanInstallments);

export default router;