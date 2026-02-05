import { Router } from 'express';
import userController from '../controllers/user.controller';
import { verifyToken, isAuthorized, checkPermission } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '@/types/permissions';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', verifyToken, userController.getProfile);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/', verifyToken, checkPermission(PERMISSIONS.USER.VIEW), userController.getAllUsers);

router.put('/:id', verifyToken, checkPermission(PERMISSIONS.USER.MANAGE), userController.updateUser);

router.patch('/:id', verifyToken, checkPermission(PERMISSIONS.USER.MANAGE), userController.changeStatus);

export default router;