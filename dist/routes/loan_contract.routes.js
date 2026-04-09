"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_contract_controller_1 = __importDefault(require("../controllers/loan_contract.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
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
router.post('/:loanId/created', auth_middleware_1.verifyToken, loan_contract_controller_1.default.createLoanContract);
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
router.get('/:loanId', auth_middleware_1.verifyToken, loan_contract_controller_1.default.getLoanContract);
exports.default = router;
