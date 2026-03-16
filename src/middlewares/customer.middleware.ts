// ============================================================================
// src/middlewares/customer.middleware.ts
// ============================================================================
import { Request, Response, NextFunction } from 'express';
import {db} from '../models/init-models';

export const checkLoanOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loanId = req.params.application_id; // ชื่อพารามิเตอร์จาก URL
    const customerId = req.customerPayload?.userId; // ได้มาจาก verifyCustomerToken

    if (!customerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const loan = await db.loan_applications.findOne({
      where: { id: loanId },
      attributes: ['id', 'customer_id','is_confirmed', 'status'] // ดึงเฉพาะฟิลด์ที่จำเป็น
    });

    if (!loan) {
      return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນໃບຄຳຂໍສິນເຊື່ອ' });
    }

    // 🔥 ด่านอรหันต์: ตรวจสอบว่าบิลนี้เป็นของลูกค้าคนที่ Login มาหรือไม่
    if (loan.customer_id !== customerId) {
      return res.status(403).json({ message: 'Forbidden: ບໍ່ມີສິດເຂົ້າເຖິງເອກະສານຂອງໃບຄຳຂໍນີ້' });
    }

    // 🟢 ตรวจสอบสถานะ (ทางเลือก): ถ้าสินเชื่ออนุมัติหรือปฏิเสธไปแล้ว อาจจะไม่ให้แก้เอกสาร
    if (loan.status !== 'pending' && loan.is_confirmed !== 0 && loan.status !== 'verifying') {
        return res.status(400).json({ message: 'ໃບຄຳຂໍນີ້ຢູ່ໃນສະຖານະທີ່ບໍ່ສາມາດອັບໂຫຼດເອກະສານເພີ່ມໄດ້ແລ້ວ' });
    }

    next(); // ผ่านเงื่อนไขหมด ไปที่ Controller ต่อ
  } catch (error) {
    console.error('Ownership Check Error:', error);
    res.status(500).json({ message: 'Server error during ownership validation' });
  }
};