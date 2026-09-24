import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as publicCtrl from '../controllers/public.controller'; // ชี้ path ให้ตรงกับ controller ของคุณ

const router = Router();

// 🟢 1. ตั้งค่า Rate Limiter ป้องกันการสุ่มเดารหัส (Brute-force)
const verifyRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 30, // จำกัด 30 requests ต่อ 1 IP ใน 1 นาที
  message: {
    success: false,
    message: 'ທ່ານເຮັດລາຍການຫຼາຍເກີນໄປ, ກະລຸນາລໍຖ້າ 1 ນາທີ ແລ້ວລອງໃໝ່ອີກຄັ້ງ'
  },
  standardHeaders: true, // ส่ง RateLimit headers กลับไป
  legacyHeaders: false, // ปิดการส่ง X-RateLimit headers แบบเก่า
});

// ==========================================
// 🌐 Public Verification Routes (ไม่ต้องมี verifyToken)
// ==========================================

/**
 * @swagger
 * /api/public/verify/{member_code}:
 *   get:
 *     summary: Verify Member Card (Tier 1 - Public Info)
 *     tags: [Public]
 */
router.get('/verify/:member_code', verifyRateLimiter, publicCtrl.verifyMemberPublic);

/**
 * @swagger
 * /api/public/verify/credit:
 *   post:
 *     summary: Unlock Financial Data (Tier 2) using phone last 4 digits
 *     tags: [Public]
 */
router.post('/verify/credit', verifyRateLimiter, publicCtrl.unlockMemberCredit);

export default router;