import { Router } from 'express';
import * as customerCtrl from '../controllers/customer.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';
import { uploadProfileImage } from '../middlewares/upload.middleware';

const router = Router();

// ==========================================
// 🟢 Routes ໃໝ່ສຳລັບໜ້າ MemberShip
// ==========================================

/**
 * @swagger
 * /customer:
 *   get:
 *     summary: Get all customers (with pagination and filters)
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/', verifyToken, customerCtrl.getAllCustomers);

// 🌟 วางตรงนี้ (ก่อน /:id) เพื่อรับแบบ Bulk และระบุ Route ชัดเจน
/**
 * @swagger
 * /customer/kyc/status:
 *   patch:
 *     summary: Bulk/Single update KYC status for customers
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/kyc/status', verifyToken, customerCtrl.updateKycStatus);

/**
 * @swagger
 * /customer/{id}:
 *   patch:
 *     summary: Update customer data (supports profile image upload)
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Customer updated
 */
router.patch('/:id', verifyToken, uploadProfileImage.single('profile_image'), customerCtrl.updateCustomerById);


// ==========================================
// 🟡 Routes ເກົ່າຂອງທ່ານ (ຮັກສາໄວ້ຄືເກົ່າທັງໝົດ)
// ==========================================
router.post('/otp/request', customerCtrl.requestOtpForCustomer);
router.post('/create', verifyToken, uploadProfileImage.single('profile_image'), customerCtrl.createCustomer);
router.post('/verify-login', customerCtrl.verifyOtpAndGetToken);
router.get('/search', verifyToken, customerCtrl.getCustomerBySearch);
router.get('/:id', verifyToken, customerCtrl.getCustomerById);

export default router;