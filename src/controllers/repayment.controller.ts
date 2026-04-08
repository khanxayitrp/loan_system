// ໃນ RepaymentController.ts
import { Request, Response, NextFunction } from 'express';
import repaymentService from '../services/repayment.service';
import repaymentRepo from '../repositories/repayment.repo'; // ໃຫ້ແນ່ໃຈວ່າ import ຖືກໄຟລ໌
import { BadRequestError, NotFoundError } from '../utils/errors';

export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        // ດຶງ ID ພະນັກງານທີ່ກຳລັງກົດຮັບເງິນ
        const receivedBy = (req as any).userPayload?.userId || 1; 

        // ສົ່ງໃຫ້ Service ຈັດການ
        const result = await repaymentService.processPayment(payload, receivedBy);

        return res.status(200).json({
            success: true,
            message: 'ບັນທຶກການຊຳລະເງິນສຳເລັດແລ້ວ',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// ສ້າງຟັງຊັນໃໝ່ແຍກອອກມາເລີຍ
export const getEarlyPayoffSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const application_id = parseInt(req.params.application_id);
        
        if (isNaN(application_id)) throw new BadRequestError('Invalid application_id format');

        // 🔴 ສຳຄັນ: ການປິດບັນຊີກ່ອນກຳນົດ "ບໍ່ຄວນດຶງຈາກ Cache" ເພາະຕ້ອງຄຳນວນໃໝ່ແບບ Real-time ມື້ຕໍ່ມື້!
        
        // ເອີ້ນໃຊ້ Repository/Service ເພື່ອຄຳນວນຍອດປິດບັນຊີ
        const payoffSummary = await repaymentRepo.calculateEarlyPayoff(application_id);
        
        if (!payoffSummary) throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນການຜ່ອນຊຳລະ ຫຼື ບັນຊີນີ້ປິດໄປແລ້ວ');

        return res.status(200).json({ 
            success: true, 
            message: 'ຄຳນວນຍອດປິດບັນຊີສຳເລັດ', 
            data: payoffSummary 
        });
    } catch (error) {
        next(error);
    } 
}