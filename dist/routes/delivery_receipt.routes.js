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
const deliveryReceiptController = __importStar(require("../controllers/delivery_receipt.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
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
router.post('/:application_id', auth_middleware_1.verifyToken, deliveryReceiptController.saveDeliveryReceipt);
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
router.get('/receipt/latest', auth_middleware_1.verifyToken, deliveryReceiptController.getLastReceiptId);
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
router.get('/receipts/:receipts_id', auth_middleware_1.verifyToken, deliveryReceiptController.getDeliveryReceiptByReceiptId);
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
router.get('/application/:application_id', auth_middleware_1.verifyToken, deliveryReceiptController.getDeliveryReceiptsByApplicationId);
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
router.put('/application/:id', auth_middleware_1.verifyToken, deliveryReceiptController.updateDeliveryReceipt);
exports.default = router;
