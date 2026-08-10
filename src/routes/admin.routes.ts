import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { verifyToken, isAuthorized } from '../middlewares/auth.middleware';
import { uploadOverrideEvidence } from '../middlewares/upload.middleware';

const router = Router();
const controller = new AdminController();

// เส้นทางดึงข้อมูลสำหรับการแสดงในหน้า Override
router.get('/loan-override/:loanIdStr', verifyToken, isAuthorized(['admin']), controller.getLoanDetails.bind(controller));

// เส้นทางดำเนินการ Override (God Mode)
router.post('/loan-override/:loanId', verifyToken, isAuthorized(['admin']),
    uploadOverrideEvidence.single('document'),
    controller.executeOverride.bind(controller));

export default router;