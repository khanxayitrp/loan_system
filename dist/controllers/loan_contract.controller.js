"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loan_contract_service_1 = __importDefault(require("../services/loan_contract.service"));
class LoanContractController {
    async createLoanContract(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const userId = req.userPayload?.userId;
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const data = req.body;
            if (!data) {
                return res.status(400).json({
                    success: false,
                    message: 'data is required'
                });
            }
            const loan_applicationsData = {
                ...data,
                loan_id,
                performed_by: Number(userId)
            };
            console.log('loan_applicationsData all ', loan_applicationsData);
            const result = await loan_contract_service_1.default.createLoanContract(loan_applicationsData);
            res.status(201).json({
                success: true,
                message: 'ສ້າງ Loan Contract ສຳເລັດແລ້ວ',
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
    async getLoanContract(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await loan_contract_service_1.default.getLoanContract(loan_id);
            res.status(200).json({
                success: true,
                message: 'ດຶງ Loan Contract ສຳເລັດແລ້ວ',
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
}
exports.default = new LoanContractController();
