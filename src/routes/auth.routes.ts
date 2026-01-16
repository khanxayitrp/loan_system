import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { verifyToken, isAuthorized, checkPermission } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '@/types/permissions';

const router = Router();

/**
 * @Route   POST /api/auth/login
 * @Desc    เข้าสู่ระบบและรับ Cookies
 * @Access  Public
 */
router.post('/login', authController.login);

/**
 * @Route   POST /api/auth/refresh
 * @Desc    ต่ออายุ Access Token ด้วย Refresh Token (Silent Refresh)
 * @Access  Public (ใช้ Refresh Token ใน Cookie)
 */
router.post('/refresh', authController.refresh);

/**
 * @Route   POST /api/auth/logout
 * @Desc    ออกจากระบบและล้าง Cookies
 * @Access  Private
 */
router.post('/logout', 
    verifyToken, 
    authController.logout);

    /**
 * @Route   POST /api/auth/signup
 * @Desc    ลูกค้าสมัครสมาชิกด้วยตัวเอง (Public)
 * @Access  Public
 */
router.post('/signup', authController.signUp); // สร้าง function signUp ใหม่สำหรับลูกค้า

/**
 * @Route   POST /api/auth/register
 * @Desc    Admin สร้าง User ใหม่ (Staff หรือ Partner)
 * @Access  Private (Admin Only)
 */
router.post(
    '/register', 
    verifyToken, 
    checkPermission(PERMISSIONS.USER.CREATE), // ใช้สิทธิ์จากตาราง features
    authController.register
);

/**
 * @Route   POST /api/auth/change-password
 * @Desc    User เปลี่ยนรหัสผ่านของตัวเอง
 * @Access  Private (All Roles)
 */
router.post(
    '/change-password', 
    verifyToken, 
    authController.changePassword
);

export default router;