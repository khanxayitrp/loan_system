import { Request, Response, NextFunction } from 'express';
import LoanRestructureService from '../services/loan_restructure.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

class LoanRestructureController {
    
    /**
     * ดำเนินการปรับโครงสร้างหนี้ (Process Loan Restructuring)
     */
    public restructureLoan = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. รับค่าจาก Params และ Body
            const applicationId = parseInt(req.params.application_id, 10);
            const { scheduleData } = req.body;
            
            // 2. ดึง User ID จาก Token ที่ Login อยู่
            const userId = (req as any).userPayload?.userId;

            // 3. Validation พื้นฐาน (ก่อนส่งให้ Service)
            if (isNaN(applicationId)) {
                throw new BadRequestError('ຮູບແບບລະຫັດສິນເຊື່ອບໍ່ຖືກຕ້ອງ (Invalid Application ID)');
            }
            if (!userId) {
                throw new UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ (Unauthorized)');
            }
            if (!scheduleData || !Array.isArray(scheduleData) || scheduleData.length === 0) {
                throw new BadRequestError('ກະລຸນາສົ່ງຂໍ້ມູນຕາຕະລາງຜ່ອນໃໝ່ (Schedule data is required)');
            }

            // 4. เรียกใช้งาน Service ที่เราสร้างไว้
            const newSchedule = await LoanRestructureService.processRestructure(
                applicationId, 
                scheduleData, 
                userId
            );

            // 5. ส่ง Response กลับไปให้ Frontend
            return res.status(200).json({
                success: true,
                message: 'ສ້າງຕາຕະລາງປັບໂຄງສ້າງໜີ້ສຳເລັດແລ້ວ (Loan restructured successfully)',
                data: newSchedule
            });

        } catch (error) {
            // ส่ง Error ไปให้ Global Error Handler จัดการ
            next(error);
        }
    };
}

export default new LoanRestructureController();