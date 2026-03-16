"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pdf_controller_1 = require("../controllers/pdf.controller");
const router = express_1.default.Router();
// ✅ PDF Generation Route
router.post('/generate-loan-pdf', pdf_controller_1.generateLoanPDF);
router.post('/generate-loan-contract', pdf_controller_1.generateLoanContractPDF);
router.post('/generate-repayment-schedule', pdf_controller_1.generateRepaymentSchedulePDF);
router.post('/delivery-receipt', pdf_controller_1.generateDeliveryReceiptPDF);
exports.default = router;
