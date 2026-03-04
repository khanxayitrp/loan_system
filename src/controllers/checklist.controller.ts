import { Request, Response } from "express";
import checklistService from "../services/checklist.service";

class ChecklistController {
    public async saveIncomeAssessment(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const assessed_by = (req as any).userPayload?.userId || 1;

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

            const checklistData: any = {
                ...data,
                loan_id,
                assessed_by
            };
            const result = await checklistService.CreateIncomeAssessment(checklistData);
            res.status(200).json(data);
        } catch (error: any) {
            console.error('❌ Error saving income assessment:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving income assessment'
            });
        }
    }
    public async saveBasicChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const verified_by = (req as any).userPayload?.userId || 1;
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

            const checklistData: any = {
                ...data,
                loan_id,
                verified_by
            };
            const result = await checklistService.CreateBasicVerification(checklistData);
            res.status(200).json(data);
        } catch (error: any) {
            console.error('❌ Error saving basic checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving basic checklist'
            });
        }
    }
    public async saveCallChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;

            // ดึง ID พนักงาน
            const calledBy = (req as any).user?.id || 1;

            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }

            console.log('Received data for saveCallChecklist:', data);

            let checklistData: any = {};

            // ✅ เช็คว่าเป็น Array หรือ Object
            if (Array.isArray(data)) {
                // ถ้า Frontend ส่ง Array มาเพียวๆ [{}, {}]
                // ให้จัดโครงสร้างใหม่เป็น { calls: [...], loan_id: X, called_by: Y }
                checklistData = {
                    calls: data,
                    loan_id: loan_id,
                    called_by: calledBy
                };
            } else {
                // ถ้า Frontend ส่ง Object มา เช่น { calls: [...] } หรือ { contact_name: "..." }
                checklistData = {
                    ...data,
                    loan_id: loan_id,
                    called_by: calledBy
                };
            }

            const result = await checklistService.CreateCallVerification(checklistData);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json(result);

        } catch (error: any) {
            console.error('❌ Error saving call checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving call checklist',
                error: error.message
            });
        }
    }
    async saveCIBChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;
            const checked_by = (req as any).userPayload?.userId || 1;
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

            const checklistData: any = {
                ...data,
                loan_id,
                checked_by
            };
            const result = await checklistService.CreateCIBVerification(checklistData);
            res.status(200).json(data);
        } catch (error: any) {
            console.error('❌ Error saving CIB checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving CIB checklist',
                error: error.message
            });
        }
    }
    public async saveFieldChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const data = req.body;

            const visited_by = (req as any).user?.id || 1;

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

            let checklistData: any = {};

            if (Array.isArray(data)) {
                checklistData = {
                    calls: data,
                    loan_id: loan_id,
                    visited_by
                };
            } else {
                checklistData = {
                    ...data,
                    loan_id: loan_id,
                    visited_by
                };
            }
            const result = await checklistService.CreateFieldVisits(checklistData);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Error saving field checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving field checklist',
                error: error.message
            });
        }
    }
    public async getChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklistService.GetAllChecklistByLoanId(loan_id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Error getting checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting checklist',
                error: error.message
            });
        }
    }
    public async getIncomeAssessment(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklistService.GetIncomeAssessmentByLoanId(loan_id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Error getting income assessment:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting income assessment',
                error: error.message
            });
        }
    }
    public async getBasicChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklistService.GetBasicVerificationByLoanId(loan_id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Error getting basic checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting basic checklist',
                error: error.message
            });
        }
    }
    public async getCallChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklistService.GetCallVerificationsByLoanId(loan_id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Error getting call checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting call checklist',
                error: error.message
            });
        }
    }
    public async getCIBChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklistService.GetCIBCheckByLoanId(loan_id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Error getting CIB checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting CIB checklist',
                error: error.message
            });
        }
    }
    public async getFieldChecklist(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ'
                });
            }
            const result = await checklistService.GetFieldVisitsByLoanId(loan_id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Error getting field checklist:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting field checklist',
                error: error.message
            });
        }
    }
    
}

export default new ChecklistController();