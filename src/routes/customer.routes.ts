// src/routes/customer.routes.ts (ตัวอย่าง)
import { Router } from 'express';
import * as customerCtrl from '../controllers/customer.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /customer/otp/request:
 *   post:
 *     summary: Request OTP for customer
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/otp/request', customerCtrl.requestOtpForCustomer);

/**
 * @swagger
 * /customer/create:
 *   post:
 *     summary: Create customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identity_number
 *               - first_name
 *               - last_name
 *               - phone
 *               - address
 *               - occupation
 *               - income_per_month
 *               - otp
 *             properties:
 *               identity_number:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               occupation:
 *                 type: string
 *               income_per_month:
 *                 type: number
 *               otp:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created
 */
router.post('/create', verifyToken, customerCtrl.createCustomer); // อาจให้ staff หรือ user เอง

// 🟢 Login ເພື່ອເອົາ Token ໄປໃຊ້ງານອັບໂຫຼດເອກະສານ
/**
 * @swagger
 * /customer/verify-login:
 *   post:
 *     summary: Verify OTP and get customer token for document upload
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully, returns customer token
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: Customer not found
 */
router.post('/verify-login', customerCtrl.verifyOtpAndGetToken);

/**
 * @swagger
 * /customer/search:
 *   get:
 *     summary: Search for customers
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Customer's phone number
 *       - in: query
 *         name: first_name
 *         schema:
 *           type: string
 *         description: Customer's first name
 *       - in: query
 *         name: last_name
 *         schema:
 *           type: string
 *         description: Customer's last name
 *     responses:
 *       200:
 *         description: A list of customers matching the search criteria
 *       400:
 *         description: Search parameters missing
 *       404:
 *         description: Customer not found
 */
router.get('/search', verifyToken, customerCtrl.getCustomerBySearch);

/**
 * @swagger
 * /customer/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer data
 *       404:
 *         description: Customer not found
 */
router.get('/:id', verifyToken, customerCtrl.getCustomerById);

// เพิ่ม route อื่นๆ...

export default router;