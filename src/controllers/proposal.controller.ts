import {Request, Response} from 'express';
import ProposalService from '../services/Proposal.service';

/**
 * ✅ สร้าง Proposal ใหม่
 * POST /api/proposal/:customerId/new
 */
export const createProposal = async (req: Request, res: Response) => {
    try {
        const customerId = parseInt(req.params.customerId);
        
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'customer_id ບໍ່ຖືກຕ້ອງ' 
            });
        }
        const { loan_id, data } = req.body;
        if (!data) {
            return res.status(400).json({ 
                success: false, 
                message: 'data is required' 
            });
        }
        const userId = req.userPayload?.userId;
        console.log('data all ', data)

        const ProposalData: any = {
              ...data,
            customer_id: customerId,
            loan_id,
            performed_by: Number(userId)
          
        };
        console.log('ProposalData all ', ProposalData)
        const result = await ProposalService.CreateProposal(ProposalData);
        
        res.status(201).json({ 
            success: true, 
            message: 'ສ້າງ proposal ສຳເລັດແລ້ວ',
            data: result 
        });
    } catch (error) {
        console.error('Create Location Error:', error);
        res.status(500).json({ 
            success: false, 
            message: (error as Error).message 
        });
    }
};

/**
 * ✅ ดึงรายการ Proposal ของลูกค้า
 * GET /api/proposal/:customerId/get/:loan_id
 */
export const getCustomerProposal = async (req: Request, res: Response) => {
    try {
        const customerId = parseInt(req.params.customerId);
        const loan_id = parseInt(req.params.loan_id);
        
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'customer_id ບໍ່ຖືກຕ້ອງ' 
            });
        }

        const result = await ProposalService.getProposal(loan_id, customerId);
        
        res.status(200).json({ 
            success: true, 
            data: result 
        });
    } catch (error) {
        console.error('Get Locations Error:', error);
        res.status(500).json({ 
            success: false, 
            message: (error as Error).message 
        });
    }
};