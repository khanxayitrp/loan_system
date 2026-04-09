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
const express_1 = require("express");
const repaymentController = __importStar(require("../controllers/repayment.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
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
router.get('/early-payoff/:application_id', auth_middleware_1.verifyToken, repaymentController.getEarlyPayoffSummary);
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
router.post('/pay', auth_middleware_1.verifyToken, repaymentController.processPayment);
exports.default = router;
