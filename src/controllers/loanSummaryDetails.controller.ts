import { Request, Response, NextFunction } from 'express';
import { getCustomerLoanSummary, getLoanInstallmentDetails } from '../services/loanSummaryDetails.service';

export const getLoanSummaryForCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customerId = parseInt(req.params.customerId, 10);
        
        if (isNaN(customerId)) {
            return res.status(400).json({ success: false, message: 'Invalid customer ID' });
        }

        // เรียกใช้ Service
        const data = await getCustomerLoanSummary(customerId);

        return res.status(200).json({
            success: true,
            message: 'ດຶງຂໍ້ມູນລາຍການຜ່ອນຊຳລະສຳເລັດ',
            data: data
        });
    } catch (error) {
        next(error); 
    }
};

export const getLoanInstallments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loanId = parseInt(req.params.loanId, 10);
        
        if (isNaN(loanId)) {
            return res.status(400).json({ success: false, message: 'Invalid loan ID' });
        }

        const data = await getLoanInstallmentDetails(loanId);

        return res.status(200).json({
            success: true,
            message: 'ດຶງຂໍ້ມູນລາຍລະອຽດການຜ່ອນຊຳລະສຳເລັດ',
            data: data
        });
    } catch (error: any) {
        if (error.message.includes('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error); 
    }
};