import { Request, Response, NextFunction } from "express";
import checklistService from "../services/checklist.service";
import { BadRequestError } from "../utils/errors";

class ChecklistController {
    
    public async saveIncomeAssessment(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const assessed_by = (req as any).userPayload?.userId || 1;

            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            
            const data = req.body;
            if (!data || Object.keys(data).length === 0) throw new BadRequestError('data is required');

            // คำนวณรายได้
            const avgIncome = Number(data.average_monthly_income) || 0;
            const otherIncome = Number(data.other_verified_income) || 0;
            const total_verified_income = avgIncome + otherIncome;
            data.total_verified_income = total_verified_income;

            // คำนวณ DSR
            const debtBurden = (Number(data.existing_debt_payments) || 0) + (Number(data.proposed_installment) || 0);
            data.dsr_percentage = total_verified_income > 0 ? (debtBurden / total_verified_income) * 100 : 0;

            const checklistData: any = { ...data, loan_id, assessed_by };

            const result = await checklistService.CreateIncomeAssessment(checklistData);
            
            // ✅ เช็คผลลัพธ์จาก Service ถ้า false โยนเข้า Error Handler
            if (!result.success) throw new BadRequestError(result.message);

            // ✅ ส่ง result ของ Service คืน Client ตรงๆ เลย เพราะจัดฟอร์แมตมาสวยแล้ว
            return res.status(200).json(result); 
        } catch (error) {
            next(error);
        }
    }

    public async saveBasicChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const verified_by = (req as any).userPayload?.userId || 1;
            const data = req.body;

            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            if (!data || Object.keys(data).length === 0) throw new BadRequestError('data is required');

            const checklistData: any = { ...data, loan_id, verified_by };
            
            const result = await checklistService.CreateBasicVerification(checklistData);
            
            if (!result.success) throw new BadRequestError(result.message);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async saveCallChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const calledBy = (req as any).user?.id || 1;

            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');

            let checklistData: any = Array.isArray(data) 
                ? { calls: data, loan_id: loan_id, called_by: calledBy }
                : { ...data, loan_id: loan_id, called_by: calledBy };

            const result = await checklistService.CreateCallVerification(checklistData);

            if (!result.success) throw new BadRequestError(result.message);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async saveCIBChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const checked_by = (req as any).userPayload?.userId || 1;

            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            if (!data) throw new BadRequestError('data is required');

            const checklistData: any = { ...data, loan_id, checked_by };

            const result = await checklistService.CreateCIBVerification(checklistData);
            
            if (!result.success) throw new BadRequestError(result.message);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async saveFieldChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const visited_by = (req as any).user?.id || 1;

            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');
            if (!data) throw new BadRequestError('data is required');

            let checklistData: any = Array.isArray(data)
                ? { calls: data, loan_id: loan_id, visited_by }
                : { ...data, loan_id: loan_id, visited_by };

            const result = await checklistService.CreateFieldVisits(checklistData);
            
            if (!result.success) throw new BadRequestError(result.message);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // GET METHODS 
    // ==========================================

    // ==========================================
    // 🟢 GET METHODS (Updated - ไม่โยน Error 400 ถ้าแค่หาข้อมูลไม่เจอ)
    // ==========================================

    public async getChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');

            const result = await checklistService.GetAllChecklistByLoanId(loan_id);
            // ✅ ไม่ต้อง throw error ส่ง result กลับไปเลย (ถ้าไม่มีข้อมูล Service มักจะส่ง data: null กลับไป)
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async getIncomeAssessment(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');

            const result = await checklistService.GetIncomeAssessmentByLoanId(loan_id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async getBasicChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');

            const result = await checklistService.GetBasicVerificationByLoanId(loan_id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async getCallChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');

            const result = await checklistService.GetCallVerificationsByLoanId(loan_id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async getCIBChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');

            const result = await checklistService.GetCIBCheckByLoanId(loan_id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async getFieldChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) throw new BadRequestError('loan_id ບໍ່ຖືກຕ້ອງ');

            const result = await checklistService.GetFieldVisitsByLoanId(loan_id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new ChecklistController();