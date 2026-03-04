import express from 'express';
import { generateLoanPDF, generateLoanContractPDF } from '../controllers/pdf.controller';

const router = express.Router();

// ✅ PDF Generation Route
router.post('/generate-loan-pdf', generateLoanPDF);

router.post('/generate-loan-contract', generateLoanContractPDF);

export default router;