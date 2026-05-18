// ============================================================================
// src/middlewares/customer.middleware.ts
// ============================================================================
import { Request, Response, NextFunction } from 'express';
import {db} from '../models/init-models';

export const checkLoanOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. เช็คชื่อ Parameter ให้ตรงกับ Route ของคุณ (ถ้า Route เป็น /:loanId ให้เปลี่ยนจาก application_id เป็น loanId)
    const paramId = req.params.application_id || req.params.loanId || req.body.application_id || req.body.loan_id; 
    
    if (!paramId) {
      return res.status(400).json({ message: 'Bad Request: ບໍ່ມີລະຫັດໃບຄຳຂໍ (Missing application ID)' });
    }

    const loanId = parseInt(paramId, 10);
    const customerId = req.customerPayload?.userId;

    if (!customerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // 2. ค้นหาใน DB
    const loan = await db.loan_applications.findOne({
      where: { id: loanId },
      attributes: ['id', 'customer_id', 'is_confirmed', 'status'] 
    });

    if (!loan) {
      return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນໃບຄຳຂໍສິນເຊື່ອ' });
    }

    // 🔥 ด่านอรหันต์: ตรวจสอบว่าบิลนี้เป็นของลูกค้าคนที่ Login มาหรือไม่
    // แปลงให้เป็น Number ทั้งคู่ก่อนเทียบ ป้องกันบัก 123 !== "123"
    if (Number(loan.customer_id) !== Number(customerId)) {
      return res.status(403).json({ message: 'Forbidden: ບໍ່ມີສິດເຂົ້າເຖິງເອກະສານຂອງໃບຄຳຂໍນີ້' });
    }

    // 🟢 ตรวจสอบสถานะ
    const allowedStatuses = ['pending', 'verifying', 'verified', 'approved'];
    if (!allowedStatuses.includes(loan.status!) && loan.is_confirmed !== 0) {
        return res.status(400).json({ message: 'ໃບຄຳຂໍນີ້ຢູ່ໃນສະຖານະທີ່ບໍ່ສາມາດອັບໂຫຼດເອກະສານເພີ່ມໄດ້ແລ້ວ' });
    }

    next(); // ผ่านเงื่อนไขหมด ไปที่ Controller ต่อ
    
  } catch (error) {
    // 💡 ทริค: ให้ดู Error ใน Terminal มันจะบอกชัดเจนเลยว่าพังบรรทัดไหนและพังเพราะอะไร
    console.error('🔥 Ownership Check Error:', error); 
    res.status(500).json({ message: 'Server error during ownership validation', error: String(error) });
  }
};