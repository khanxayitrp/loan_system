import { loan_applications } from './../models/loan_applications';
import { Request, Response } from "express";
import loan_contractService from "../services/loan_contract.service";

class LoanContractController {
    public async createLoanContract(req: Request, res: Response) {
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

        const loan_applicationsData: any = {
            ...data,
            loan_id,
            performed_by: Number(userId)
        };
        console.log('loan_applicationsData all ', loan_applicationsData)
        
            const result = await loan_contractService.createLoanContract(loan_applicationsData);
            res.status(201).json({ 
                success: true, 
                message: 'ສ້າງ Loan Contract ສຳເລັດແລ້ວ',
                data: result 
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Internal Server Error' 
            });
        }
    }
    public async getLoanContract(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);

            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ' 
                });
            }
            const result = await loan_contractService.getLoanContract(loan_id);
            res.status(200).json({ 
                success: true, 
                message: 'ດຶງ Loan Contract ສຳເລັດແລ້ວ',
                data: result 
            });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Internal Server Error' 
            });
        }
    }
}

export default new LoanContractController();