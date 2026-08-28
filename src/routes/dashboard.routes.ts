import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
// 🌟 1. นำเข้า Middleware ที่ถูกต้องจาก auth.middleware ของคุณ
import { verifyToken, isAuthorized } from '../middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

// ============================================================================
// 🔒 Dashboard Routes
// ============================================================================

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Retrieve dashboard summary data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary data returned successfully
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/summary', verifyToken, isAuthorized(['admin', 'staff']), controller.getSummary.bind(controller))

/**
 * @swagger
 * /dashboard/refresh:
 *   post:
 *     summary: Clear dashboard cache
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
    '/refresh',
    verifyToken,
    isAuthorized(['admin', 'staff']),
    controller.clearCache.bind(controller)
);
/**
 * @swagger
 * /dashboard/partner/summary:
 *   get:
 *     summary: Retrieve partner dashboard summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner summary data returned
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       403:
 *         description: Forbidden - partner access required
 */
router.get('/partner/summary', verifyToken, isAuthorized(['partner']), controller.getPartnerSummary.bind(controller))

export default router;