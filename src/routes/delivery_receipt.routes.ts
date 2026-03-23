import { Router } from "express";
import * as deliveryReceiptController from "../controllers/delivery_receipt.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /delivery-receipt/{application_id}:
 *   post:
 *     summary: Save delivery receipt
 *     tags: [Delivery Receipt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Delivery receipt saved
 */
router.post('/:application_id', verifyToken, deliveryReceiptController.saveDeliveryReceipt);

/**
 * @swagger
 * /delivery-receipt/receipt/latest:
 *   get:
 *     summary: Get latest receipt ID
 *     tags: [Delivery Receipt]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest receipt ID
 */
router.get('/receipt/latest', verifyToken, deliveryReceiptController.getLastReceiptId);

/**
 * @swagger
 * /delivery-receipt/receipts/{receipts_id}:
 *   get:
 *     summary: Get delivery receipt by receipt ID
 *     tags: [Delivery Receipt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receipts_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery receipt details
 */
router.get('/receipts/:receipts_id', verifyToken, deliveryReceiptController.getDeliveryReceiptByReceiptId);

/**
 * @swagger
 * /delivery-receipt/application/{application_id}:
 *   get:
 *     summary: Get delivery receipts by application ID
 *     tags: [Delivery Receipt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: application_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Delivery receipts details
 */
router.get('/application/:application_id', verifyToken, deliveryReceiptController.getDeliveryReceiptsByApplicationId);

/**
 * @swagger
 * /delivery-receipt/application/{id}:
 *   put:
 *     summary: Update delivery receipt
 *     tags: [Delivery Receipt]
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
 *     responses:
 *       200:
 *         description: Delivery receipt updated
 */
router.put('/application/:id', verifyToken, deliveryReceiptController.updateDeliveryReceipt);

export default router;