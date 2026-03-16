import { Request, Response } from "express";
import delivery_receiptRepo from "../repositories/delivery_receipt.repo";
import { NotFoundError, ValidationError } from "../utils/errors";
import { db } from "../models/init-models";
import { logAudit } from '../utils/auditLogger';
import { Transaction } from "sequelize";

export const saveDeliveryReceipt = async (req: Request, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
        const application_id = parseInt(req.params.application_id);
        const { delivery_receipt } = req.body;
        const userId = req.userPayload?.userId;
        console.log('Saving delivery receipt for application_id:', application_id);
        console.log('Delivery receipt data:', delivery_receipt);
        const result = await delivery_receiptRepo.createDeliveryReceipt(delivery_receipt, Number(userId), { transaction });
        await transaction.commit();
        res.status(200).json({ success: true, message: 'Delivery receipt saved', data: result });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};

export const getDeliveryReceiptByReceiptId = async (req: Request, res: Response) => {
    try {
        const receipts_id = req.params.receipts_id;
        const result = await delivery_receiptRepo.findDeliveryReceiptsByReceiptId(receipts_id);
        if (!result) {
          return  res.status(404).json({ success: false, message: 'Delivery receipt not found' });
        }
        res.status(200).json({ success: true, message: 'Delivery receipt retrieved', data: result });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
}

export const getDeliveryReceiptsByApplicationId = async (req: Request, res: Response) => {
    try {
        const application_id = parseInt(req.params.application_id);
        const result = await delivery_receiptRepo.findDeliveryReceiptsByApplicationId(application_id);
        if (!result) {
           return res.status(404).json({ success: false, message: 'Delivery receipt not found for this application' });
        }
        res.status(200).json({ success: true, message: 'Delivery receipt retrieved', data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });

    }
}

export const getLastReceiptId = async (req: Request, res: Response) => {
    try {
        const result = await delivery_receiptRepo.findLastReceiptId();
        res.status(200).json({ success: true, message: 'Last receipt ID retrieved', data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
}

export const updateDeliveryReceipt = async (req: Request, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
        const deliveryReceiptId = parseInt(req.params.id);
        const data = req.body;
        console.log('Updating delivery receipt with ID:', data);
        const userId = req.userPayload?.userId;
        const result = await delivery_receiptRepo.updateDeliveryReceipt(deliveryReceiptId, data, Number(userId), { transaction });
        if (!result) {
            await transaction.rollback();
           return res.status(404).json({ success: false, message: 'Delivery receipt not found' });    
        }
        await transaction.commit();
        res.status(200).json({ success: true, message: 'Delivery receipt updated', data: result });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
}