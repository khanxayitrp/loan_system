"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permissionController = __importStar(require("../controllers/permission.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permissions_1 = require("../types/permissions");
const router = (0, express_1.Router)();
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
router.get('/features', auth_middleware_1.verifyToken, (0, auth_middleware_1.checkPermission)(permissions_1.PERMISSIONS.USER.PERMISSION), permissionController.getFeaturesList);
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
router.get('/combined', auth_middleware_1.verifyToken, (0, auth_middleware_1.checkPermission)(permissions_1.PERMISSIONS.USER.PERMISSION), permissionController.getCombinedPermissions);
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
router.post('/bulk-update', auth_middleware_1.verifyToken, (0, auth_middleware_1.checkPermission)(permissions_1.PERMISSIONS.USER.PERMISSION), // ต้องเป็น Admin เท่านั้น
permissionController.saveBulkPermissions);
/**
 * @swagger
 * /permissions/user/{userId}:
 *   get:
 *     summary: Get a user's permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of the user's permissions
 */
router.get('/user/:userId', auth_middleware_1.verifyToken, permissionController.getUserPermissions); // ดึงสิทธิ์ของผู้ใช้เฉพาะคน
/**
 * @swagger
 * /permissions/user/{userId}:
 *   post:
 *     summary: Assign permissions to a user
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               featureIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Permissions assigned
 */
router.post('/user/:userId', auth_middleware_1.verifyToken, permissionController.assignUserPermissions);
/**
 * @swagger
 * /permissions/user/{userId}:
 *   delete:
 *     summary: Delete all permissions for a user
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All permissions for the user have been deleted
 */
router.delete('/user/:userId', auth_middleware_1.verifyToken, permissionController.deleteAllUserPermissions);
exports.default = router;
