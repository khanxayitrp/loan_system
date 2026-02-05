import { Router } from 'express';
import * as permissionController from '../controllers/permission.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '../types/permissions';

const router = Router();

/**
 * @swagger
 * /permissions/features:
 *   get:
 *     summary: Get all features
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of features
 */
router.get(
  '/features',
  verifyToken,
  checkPermission(PERMISSIONS.USER.PERMISSION),
  permissionController.getFeaturesList
);

/**
 * @swagger
 * /permissions/combined:
 *   get:
 *     summary: Get combined permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userIds
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Combined permissions
 */
router.get(
  '/combined',
  verifyToken,
  checkPermission(PERMISSIONS.USER.PERMISSION),
  permissionController.getCombinedPermissions
);

/**
 * @swagger
 * /permissions/bulk-update:
 *   post:
 *     summary: Bulk update permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     featureIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *     responses:
 *       200:
 *         description: Permissions updated
 */
router.post(
  '/bulk-update',
  verifyToken,
  checkPermission(PERMISSIONS.USER.PERMISSION), // ต้องเป็น Admin เท่านั้น
  permissionController.saveBulkPermissions
);

router.get('/user/:userId',verifyToken, permissionController.getUserPermissions); // ดึงสิทธิ์ของผู้ใช้เฉพาะคน
router.post('/user/:userId',verifyToken, permissionController.assignUserPermissions);
router.delete('/user/:userId',verifyToken, permissionController.deleteAllUserPermissions);



export default router;