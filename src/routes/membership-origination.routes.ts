import { Router } from 'express';
import * as originationCtrl from '../controllers/membership-origination.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { uploadProfileImage } from '../middlewares/upload.middleware';

const router = Router();

// 🛡️ สำหรับพนักงาน (ต้องมี Staff Token)
router.post('/staff-apply', verifyToken, uploadProfileImage.single('profile_image'), originationCtrl.applyFromStaff);

// 🌐 สำหรับลูกค้า Web Portal ทั่วไป (ไม่มี Token, จะไปตรวจ OTP ใน Controller)
router.post('/public-apply', uploadProfileImage.single('profile_image'), originationCtrl.applyFromPublicWeb);

// ==========================================
// 🟢 NEW: Routes ສຳລັບການດຶງຂໍ້ມູນ (GET)
// ==========================================
/**
 * @swagger
 * /membership-origination/applications:
 *   get:
 *     summary: Get all membership applications with pagination and filters
 *     tags: [Membership Origination]
 */
router.get('/applications', verifyToken, originationCtrl.getAllApplications);

/**
 * @swagger
 * /membership-origination/applications/{id}:
 *   get:
 *     summary: Get specific membership application details by ID
 *     tags: [Membership Origination]
 */
router.get('/applications/:id', verifyToken, originationCtrl.getApplicationById);

/**
 * @swagger
 * /membership-origination/applications/customer/{customerId}:
 *   get:
 *     summary: Get latest application by Customer ID
 *     tags: [Membership Origination]
 */
router.get('/applications/customer/:customerId', verifyToken, originationCtrl.getLatestApplicationByCustomerId);

// ==========================================
// 🟢 Routes ສຳລັບການອັບເດດ (UPDATE)
// ==========================================
/**
 * @swagger
 * /membership-origination/applications/staff-update/{id}:
 *   put:
 *     summary: Update membership application by Staff
 *     tags: [Membership Origination]
 */
router.put(
  '/applications/staff-update/:id', 
  verifyToken, 
  uploadProfileImage.single('profile_image'), 
  originationCtrl.updateApplicationFromStaff
);

/**
 * @swagger
 * /membership-origination/applications/public-update/{id}:
 *   put:
 *     summary: Update membership application by Public Web (Requires OTP)
 *     tags: [Membership Origination]
 */
router.put(
  '/applications/public-update/:id', 
  uploadProfileImage.single('profile_image'), 
  originationCtrl.updateApplicationFromPublicWeb
);

export default router;