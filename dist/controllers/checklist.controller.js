"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const checklist_service_1 = __importDefault(require("../services/checklist.service"));
class ChecklistController {
    async saveIncomeAssessment(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const assessed_by = req.userPayload?.userId || 1;
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
            console.log('Received data for saveIncomeAssessment:', data);
            // ✅ โค้ดใหม่ที่ถูกต้อง (ดึงค่ามาบวกกันตรงๆ)
            const avgIncome = Number(data.average_monthly_income) || 0;
            const otherIncome = Number(data.other_verified_income) || 0;
            const total_verified_income = avgIncome + otherIncome;
            data.total_verified_income = total_verified_income;
            // 💡 แนะนำเพิ่มเติม: คุณสามารถคำนวณ DSR ฝั่ง Backend เผื่อไว้เลยก็ได้ครับเพื่อความชัวร์
            const debtBurden = (Number(data.existing_debt_payments) || 0) + (Number(data.proposed_installment) || 0);
            data.dsr_percentage = total_verified_income > 0
                ? (debtBurden / total_verified_income) * 100
                : 0;
            const checklistData = {
                ...data,
                loan_id,
                assessed_by
            };
            console.log('Prepared checklistData for saveIncomeAssessment:', checklistData);
            const result = await checklist_service_1.default.CreateIncomeAssessment(checklistData);
            res.status(200).json(data);
        }
        catch (error) {
            console.error('❌ Error saving income assessment:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving income assessment'
            });
        }
    }
    async saveBasicChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const verified_by = req.userPayload?.userId || 1;
            const data = req.body;
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            if (!data) {
                return res.status(400).json({
                    success: false,
                    message: 'data is required'
                });
            }
            console.log('Received data for saveBasicChecklist:', data);
            const checklistData = {
                ...data,
                loan_id,
                verified_by
            };
            const result = await checklist_service_1.default.CreateBasicVerification(checklistData);
            res.status(200).json(data);
        }
        catch (error) {
            console.error('❌ Error saving basic checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving basic checklist'
            });
        }
    }
    async saveCallChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            // ดึง ID พนักงาน
            const calledBy = req.user?.id || 1;
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            console.log('Received data for saveCallChecklist:', data);
            let checklistData = {};
            // ✅ เช็คว่าเป็น Array หรือ Object
            if (Array.isArray(data)) {
                // ถ้า Frontend ส่ง Array มาเพียวๆ [{}, {}]
                // ให้จัดโครงสร้างใหม่เป็น { calls: [...], loan_id: X, called_by: Y }
                checklistData = {
                    calls: data,
                    loan_id: loan_id,
                    called_by: calledBy
                };
            }
            else {
                // ถ้า Frontend ส่ง Object มา เช่น { calls: [...] } หรือ { contact_name: "..." }
                checklistData = {
                    ...data,
                    loan_id: loan_id,
                    called_by: calledBy
                };
            }
            const result = await checklist_service_1.default.CreateCallVerification(checklistData);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error saving call checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving call checklist',
                error: error.message
            });
        }
    }
    async saveCIBChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const checked_by = req.userPayload?.userId || 1;
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            if (!data) {
                return res.status(400).json({
                    success: false,
                    message: 'data is required'
                });
            }
            console.log('Received data for saveCIBChecklist:', data);
            const checklistData = {
                ...data,
                loan_id,
                checked_by
            };
            const result = await checklist_service_1.default.CreateCIBVerification(checklistData);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error saving CIB checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving CIB checklist',
                error: error.message
            });
        }
    }
    async saveFieldChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const visited_by = req.user?.id || 1;
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            if (!data) {
                return res.status(400).json({
                    success: false,
                    message: 'data is required'
                });
            }
            console.log('Received data for saveFieldChecklist:', data);
            let checklistData = {};
            if (Array.isArray(data)) {
                checklistData = {
                    calls: data,
                    loan_id: loan_id,
                    visited_by
                };
            }
            else {
                checklistData = {
                    ...data,
                    loan_id: loan_id,
                    visited_by
                };
            }
            const result = await checklist_service_1.default.CreateFieldVisits(checklistData);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error saving field checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving field checklist',
                error: error.message
            });
        }
    }
    async getChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklist_service_1.default.GetAllChecklistByLoanId(loan_id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error getting checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting checklist',
                error: error.message
            });
        }
    }
    async getIncomeAssessment(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklist_service_1.default.GetIncomeAssessmentByLoanId(loan_id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error getting income assessment:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting income assessment',
                error: error.message
            });
        }
    }
    async getBasicChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklist_service_1.default.GetBasicVerificationByLoanId(loan_id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error getting basic checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting basic checklist',
                error: error.message
            });
        }
    }
    async getCallChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklist_service_1.default.GetCallVerificationsByLoanId(loan_id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error getting call checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting call checklist',
                error: error.message
            });
        }
    }
    async getCIBChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklist_service_1.default.GetCIBCheckByLoanId(loan_id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error getting CIB checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting CIB checklist',
                error: error.message
            });
        }
    }
    async getFieldChecklist(req, res) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklist_service_1.default.GetFieldVisitsByLoanId(loan_id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('❌ Error getting field checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting field checklist',
                error: error.message
            });
        }
    }
}
exports.default = new ChecklistController();
