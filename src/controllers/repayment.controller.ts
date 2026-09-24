// ใน RepaymentController.ts
import { Request, Response, NextFunction } from 'express';
import repaymentService from '../services/repayment.service';
import repaymentRepo from '../repositories/repayment.repo';
import redisService from '../services/redis.service'; // 🟢 ต้อง import redisService
import { BadRequestError, NotFoundError } from '../utils/errors';

export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        const receivedBy = (req as any).userPayload?.userId || 1;

        console.log("-------------payload---------------:", payload);    

        // ส่งให้ Service จัดการ (รองรับ is_overpayment อัตโนมัติ)
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

export const getEarlyPayoffSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const application_id = parseInt(req.params.application_id);

        if (isNaN(application_id)) throw new BadRequestError('Invalid application_id format');

        // 🔴 ข้ามการใช้ Cache เพราะยอดปิดบัญชีต้อง Real-time เสมอ
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

export const getRepaymentSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const application_id = parseInt(req.params.application_id);
        if (isNaN(application_id)) throw new BadRequestError('Invalid application_id format');

        const cacheKey = `cache:repayment_schedule:${application_id}`;
        
        const cachedData = await redisService.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: 'ດຶງຂໍ້ມູນຕາຕະລາງຜ່ອນຊຳລະສຳເລັັດ (From Cache)',
                data: JSON.parse(cachedData)
            });
        }

        // 🟢 ແກ້ໄຂ: ໃຊ້ findRepaymentsByApplicationId ເພື່ອດຶງ Array ຂອງລາຍການງວດທັງໝົດ
        const schedule = await repaymentRepo.findRepaymentsByApplicationId(application_id);
        
        if (!schedule || schedule.length === 0) throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນຕາຕະລາງຜ່ອນຊຳລະ');

        await redisService.set(cacheKey, JSON.stringify(schedule), 900);

        return res.status(200).json({
            success: true,
            message: 'ດຶງຂໍ້ມູນຕາຕະລາງຜ່ອນຊຳລະສຳເລັັດ',
            data: schedule
        });
    } catch (error) {
        next(error);
    }
}

export const getTransactionsBySchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const application_id = parseInt(req.params.application_id);
        if (isNaN(application_id)) throw new BadRequestError('Invalid application_id format');

        const cacheKey = `cache:payment_transactions:${application_id}`;

        // 🟢 1. ตรวจสอบ Redis Cache
        const cachedData = await redisService.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: 'ດຶງຂໍ້ມູນປະຫວັດການຊຳລະສຳເລັດ (From Cache)',
                data: JSON.parse(cachedData)
            });
        }

        // 2. ถ้าไม่มีใน Cache ให้คิวรีจาก Repo
        const transactions = await repaymentRepo.getTransactionsByApplicationId(application_id);

        // 🟢 3. เซ็ตข้อมูลลง Redis (ประวัติชำระเงินไม่ค่อยเปลี่ยนบ่อย)
        await redisService.set(cacheKey, JSON.stringify(transactions), 900);

        return res.status(200).json({
            success: true,
            message: 'ດຶງຂໍ້ມູນປະຫວັດການຊຳລະສຳເລັດ',
            data: transactions
        });

    } catch (error) {
        console.error('Error fetching transactions by schedule:', error);
        next(error);
    }
};