import { Router } from 'express';
import LoanRestructureController from '../controllers/loan-restructure.controller';
import { verifyToken, isAuthorized } from '../middlewares/auth.middleware'; // สมมติ Middleware ของคุณ

const router = Router();

// สร้าง Route สำหรับปรับโครงสร้างหนี้ (ต้อง Login และมีสิทธิ์ระดับหัวหน้าขึ้นไป)
router.post(
    '/:application_id/restructure',
    verifyToken,
    isAuthorized(['staff'], ['credit_manager', 'deputy_director', 'director']),
    LoanRestructureController.restructureLoan
);

export default router;