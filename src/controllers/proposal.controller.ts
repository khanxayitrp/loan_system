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

        console.log('data all ', data)
        // // ✅ Validate และแปลง is_primary ใน Controller
        // const { location_type, address, latitude, longitude, is_primary } = req.body;
        
        // // ✅ ตรวจสอบ location_type
        // if (!location_type || !['home', 'work', 'other'].includes(location_type)) {
        //     return res.status(400).json({ 
        //         success: false, 
        //         message: 'location_type ต้องเป็น home, work, หรือ other' 
        //     });
        // }

        // // ✅ ตรวจสอบ address
        // if (!address || address.trim() === '') {
        //     return res.status(400).json({ 
        //         success: false, 
        //         message: 'address เป็นข้อมูลบังคับ' 
        //     });
        // }

        // // ✅ แปลง is_primary เป็น number (0 หรือ 1)
        // let primaryValue: number = 0;
        // if (is_primary !== undefined && is_primary !== null) {
        //     primaryValue = is_primary === 1 || is_primary === true || is_primary === '1' ? 1 : 0;
        // }

        const ProposalData: any = {
              ...data,
            customer_id: customerId,
            loan_id
          
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