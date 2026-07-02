"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const checklist_service_1 = __importDefault(require("../services/checklist.service"));
const errors_1 = require("../utils/errors");
const redis_service_1 = __importDefault(require("../services/redis.service"));
const init_models_1 = require("../models/init-models");
class ChecklistController {
    async saveIncomeAssessment(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const assessed_by = req.userPayload?.userId || 1;
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            const data = req.body;
            if (!data || Object.keys(data).length === 0)
                throw new errors_1.BadRequestError('data is required');
            // คำนวณรายได้
            const avgIncome = Number(data.average_monthly_income) || 0;
            const otherIncome = Number(data.other_verified_income) || 0;
            const total_verified_income = avgIncome + otherIncome;
            data.total_verified_income = total_verified_income;
            // คำนวณ DSR
            const debtBurden = (Number(data.existing_debt_payments) || 0) + (Number(data.proposed_installment) || 0);
            data.dsr_percentage = total_verified_income > 0 ? (debtBurden / total_verified_income) * 100 : 0;
            const checklistData = { ...data, loan_id, assessed_by };
            const result = await checklist_service_1.default.CreateIncomeAssessment(checklistData);
            // ✅ เช็คผลลัพธ์จาก Service ถ้า false โยนเข้า Error Handler
            if (!result.success)
                throw new errors_1.BadRequestError(result.message);
            // ✅ ส่ง result ของ Service คืน Client ตรงๆ เลย เพราะจัดฟอร์แมตมาสวยแล้ว
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    // public async saveBasicChecklist(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const loan_id = parseInt(req.params.loanId, 10);
    //         const verified_by = (req as any).userPayload?.userId || 1;
    //         const data = req.body;
    //         if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
    //         if (!data || Object.keys(data).length === 0) throw new BadRequestError('data is required');
    //         const checklistData: any = { ...data, loan_id, verified_by };
    //         const result = await checklistService.CreateBasicVerification(checklistData);
    //         if (!result.success) throw new BadRequestError(result.message);
    //         return res.status(200).json(result);
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    async saveBasicChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const verified_by = req.userPayload?.userId || 1;
            const data = req.body;
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            if (!data || Object.keys(data).length === 0)
                throw new errors_1.BadRequestError('data is required');
            const checklistData = { ...data, loan_id, verified_by };
            const result = await checklist_service_1.default.CreateBasicVerification(checklistData);
            if (!result.success)
                throw new errors_1.BadRequestError(result.message);
            // =========================================================
            // 🟢 จัดการลบ Cache เมื่อมีการอัปเดตข้อมูลสำเร็จ
            // =========================================================
            if (redis_service_1.default) {
                // 1. ลบ Cache หน้าสรุป Checklist ปกติ
                await redis_service_1.default.del(`cache:checklist:summary:${loan_id}`);
                await redis_service_1.default.del(`cache:loan_application:${loan_id}`);
                await redis_service_1.default.delByPattern('cache:loan_applications:list:*');
                // 2. 🟢 Query หา Delivery Receipt ที่ผูกกับ loan_id นี้
                const receipt = await init_models_1.db.delivery_receipts.findOne({
                    where: { application_id: loan_id } // หรือเช็คตาม column ที่เก็บ loan id ของคุณ
                });
                // 3. 🟢 ถ้าเจอใบรับเครื่อง ให้เอา receipts_id ไปลบ Cache PDF ทิ้ง
                if (receipt && receipt.receipts_id) {
                    await redis_service_1.default.del(`cache:pdf:receipt:${receipt.receipts_id}`);
                    console.log(`🗑️ ลบ Cache PDF ใบรับเครื่องสำเร็จ: ${receipt.receipts_id}`);
                }
            }
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async saveCallChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const calledBy = req.user?.id || 1;
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            let checklistData = Array.isArray(data)
                ? { calls: data, loan_id: loan_id, called_by: calledBy }
                : { ...data, loan_id: loan_id, called_by: calledBy };
            const result = await checklist_service_1.default.CreateCallVerification(checklistData);
            if (!result.success)
                throw new errors_1.BadRequestError(result.message);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async saveCIBChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const checked_by = req.userPayload?.userId || 1;
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            if (!data)
                throw new errors_1.BadRequestError('data is required');
            const checklistData = { ...data, loan_id, checked_by };
            const result = await checklist_service_1.default.CreateCIBVerification(checklistData);
            if (!result.success)
                throw new errors_1.BadRequestError(result.message);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async saveFieldChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const visited_by = req.user?.id || 1;
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            if (!data)
                throw new errors_1.BadRequestError('data is required');
            let checklistData = Array.isArray(data)
                ? { calls: data, loan_id: loan_id, visited_by }
                : { ...data, loan_id: loan_id, visited_by };
            const result = await checklist_service_1.default.CreateFieldVisits(checklistData);
            if (!result.success)
                throw new errors_1.BadRequestError(result.message);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    // ==========================================
    // GET METHODS 
    // ==========================================
    // ==========================================
    // 🟢 GET METHODS (Updated - ไม่โยน Error 400 ถ้าแค่หาข้อมูลไม่เจอ)
    // ==========================================
    async getChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            const result = await checklist_service_1.default.GetAllChecklistByLoanId(loan_id);
            // ✅ ไม่ต้อง throw error ส่ง result กลับไปเลย (ถ้าไม่มีข้อมูล Service มักจะส่ง data: null กลับไป)
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getIncomeAssessment(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            const result = await checklist_service_1.default.GetIncomeAssessmentByLoanId(loan_id);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getBasicChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            const result = await checklist_service_1.default.GetBasicVerificationByLoanId(loan_id);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getCallChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            const result = await checklist_service_1.default.GetCallVerificationsByLoanId(loan_id);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getCIBChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            const result = await checklist_service_1.default.GetCIBCheckByLoanId(loan_id);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getFieldChecklist(req, res, next) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id))
                throw new errors_1.BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            const result = await checklist_service_1.default.GetFieldVisitsByLoanId(loan_id);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new ChecklistController();
