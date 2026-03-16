import { Router } from "express";
import * as deliveryReceiptController from "../controllers/delivery_receipt.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post('/:application_id', verifyToken, deliveryReceiptController.saveDeliveryReceipt);

router.get('/receipt/latest', verifyToken, deliveryReceiptController.getLastReceiptId);

router.get('/receipts/:receipts_id', verifyToken, deliveryReceiptController.getDeliveryReceiptByReceiptId);

router.get('/application/:application_id', verifyToken, deliveryReceiptController.getDeliveryReceiptsByApplicationId);

router.put('/application/:id', verifyToken, deliveryReceiptController.updateDeliveryReceipt);

export default router;