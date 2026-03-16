import express from 'express';
import { generateLoanPDF, generateLoanContractPDF, generateRepaymentSchedulePDF, generateDeliveryReceiptPDF } from '../controllers/pdf.controller';

const router = express.Router();

// ✅ PDF Generation Route
router.post('/generate-loan-pdf', generateLoanPDF);

router.post('/generate-loan-contract', generateLoanContractPDF);

router.post('/generate-repayment-schedule', generateRepaymentSchedulePDF);

router.post('/delivery-receipt',  generateDeliveryReceiptPDF);

export default router;