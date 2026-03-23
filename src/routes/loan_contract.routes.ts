import { Router } from "express";
import loan_contractController from "../controllers/loan_contract.controller";
import { verifyToken } from "../middlewares/auth.middleware";
const router = Router();

/***************** LOAN CONTRACT ROUTES *****************/

/**
 * @swagger
 * /loan-contract/{loanId}/created:
 *   post:
 *     summary: Create a loan contract
 *     tags: [Loan Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
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
 *       201:
 *         description: Loan contract created
 */
router.post('/:loanId/created', verifyToken, loan_contractController.createLoanContract);

/**
 * @swagger
 * /loan-contract/{loanId}:
 *   get:
 *     summary: Get a loan contract
 *     tags: [Loan Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Loan contract details
 */
router.get('/:loanId', verifyToken, loan_contractController.getLoanContract);



export default router;