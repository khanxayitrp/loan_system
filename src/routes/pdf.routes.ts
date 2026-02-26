import express from 'express';
import { generateLoanPDF } from '../controllers/pdf.controller';

const router = express.Router();

// ✅ PDF Generation Route
router.post('/generate-loan-pdf', generateLoanPDF);

export default router;