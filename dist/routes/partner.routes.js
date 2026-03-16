"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const partner_controller_1 = __importDefault(require("../controllers/partner.controller"));
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /partners/current:
 *   get:
 *     summary: Get current partner's shop
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shop data
 *       404:
 *         description: Shop not found
 */
router.get('/current', auth_middleware_1.verifyToken, partner_controller_1.default.getShop);
/**
 * @swagger
 * /partners/all:
 *   get:
 *     summary: Get all shops
 *     tags: [Partner]
 *     responses:
 *       200:
 *         description: A list of shops
 */
router.get('/all', partner_controller_1.default.getAllShop);
/**
 * @swagger
 * /partners:
 *   post:
 *     summary: Create a new shop for a partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shop created
 */
router.post('/', auth_middleware_1.verifyToken, partner_controller_1.default.createShop);
/**
 * @swagger
 * /partners/{id}:
 *   put:
 *     summary: Update a shop
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shop updated
 */
router.put('/:id', auth_middleware_1.verifyToken, partner_controller_1.default.updateShop);
/**
 * @swagger
 * /partners/status/{id}:
 *   put:
 *     summary: Change shop status
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Shop status changed
 */
router.put('/status/:id', auth_middleware_1.verifyToken, partner_controller_1.default.changeStatusShop);
exports.default = router;
