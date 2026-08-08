import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
// 🌟 1. นำเข้า Middleware ที่ถูกต้องจาก auth.middleware ของคุณ
import { verifyToken, isAuthorized } from '../middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

// ============================================================================
// 🔒 Dashboard Routes
// ============================================================================

// 🌟 2. ใช้ verifyToken และ isAuthorized(['admin', 'staff'])
router.get(
    '/summary',
    verifyToken,
    isAuthorized(['admin', 'staff']),
    // ถ้าต้องการจำกัด Level พนักงานด้วย สามารถแก้เป็น: isAuthorized(['admin', 'staff'], ['director', 'deputy_director'])
    controller.getSummary.bind(controller) // แนะนำให้ใช้ .bind(controller) เพื่อป้องกันปัญหา context ของ 'this' หลุด
);

// Endpoint สำหรับล้าง Cache โดยตรงจากหน้าเว็บ
router.post(
    '/refresh',
    verifyToken,
    isAuthorized(['admin', 'staff']),
    controller.clearCache.bind(controller)
);
// =======================================================
// 🔒 Partner (ร้านค้า) Dashboard 
// =======================================================
router.get(
    '/partner/summary',
    verifyToken,
    isAuthorized(['partner']), // จำกัดให้เฉพาะ Partner เข้าถึงได้
    controller.getPartnerSummary.bind(controller)
);

export default router;