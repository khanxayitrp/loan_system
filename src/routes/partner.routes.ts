import { Router } from "express";
import partnerController from "../controllers/partner.controller";
import { verifyToken } from "@/middlewares/auth.middleware";

const router = Router();

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
router.get('/current', verifyToken, partnerController.getShop);

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
router.get('/all', partnerController.getAllShop);

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
router.post('/', verifyToken, partnerController.createShop);

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
router.put('/:id', verifyToken, partnerController.updateShop);

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
router.put('/status/:id', verifyToken, partnerController.changeStatusShop);

export default router;