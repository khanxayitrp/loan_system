"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeliveryReceipt = exports.getLastReceiptId = exports.getDeliveryReceiptsByApplicationId = exports.getDeliveryReceiptByReceiptId = exports.saveDeliveryReceipt = void 0;
const delivery_receipt_repo_1 = __importDefault(require("../repositories/delivery_receipt.repo"));
const init_models_1 = require("../models/init-models");
const saveDeliveryReceipt = async (req, res) => {
    const transaction = await init_models_1.db.sequelize.transaction();
    try {
        const application_id = parseInt(req.params.application_id);
        const { delivery_receipt } = req.body;
        const userId = req.userPayload?.userId;
        console.log('Saving delivery receipt for application_id:', application_id);
        console.log('Delivery receipt data:', delivery_receipt);
        const result = await delivery_receipt_repo_1.default.createDeliveryReceipt(delivery_receipt, Number(userId), { transaction });
        await transaction.commit();
        res.status(200).json({ success: true, message: 'Delivery receipt saved', data: result });
    }
    catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
exports.saveDeliveryReceipt = saveDeliveryReceipt;
const getDeliveryReceiptByReceiptId = async (req, res) => {
    try {
        const receipts_id = req.params.receipts_id;
        const result = await delivery_receipt_repo_1.default.findDeliveryReceiptsByReceiptId(receipts_id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Delivery receipt not found' });
        }
        res.status(200).json({ success: true, message: 'Delivery receipt retrieved', data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
exports.getDeliveryReceiptByReceiptId = getDeliveryReceiptByReceiptId;
const getDeliveryReceiptsByApplicationId = async (req, res) => {
    try {
        const application_id = parseInt(req.params.application_id);
        const result = await delivery_receipt_repo_1.default.findDeliveryReceiptsByApplicationId(application_id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Delivery receipt not found for this application' });
        }
        res.status(200).json({ success: true, message: 'Delivery receipt retrieved', data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
exports.getDeliveryReceiptsByApplicationId = getDeliveryReceiptsByApplicationId;
const getLastReceiptId = async (req, res) => {
    try {
        const result = await delivery_receipt_repo_1.default.findLastReceiptId();
        res.status(200).json({ success: true, message: 'Last receipt ID retrieved', data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
exports.getLastReceiptId = getLastReceiptId;
const updateDeliveryReceipt = async (req, res) => {
    const transaction = await init_models_1.db.sequelize.transaction();
    try {
        const deliveryReceiptId = parseInt(req.params.id);
        const data = req.body;
        console.log('Updating delivery receipt with ID:', data);
        const userId = req.userPayload?.userId;
        const result = await delivery_receipt_repo_1.default.updateDeliveryReceipt(deliveryReceiptId, data, Number(userId), { transaction });
        if (!result) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Delivery receipt not found' });
        }
        await transaction.commit();
        res.status(200).json({ success: true, message: 'Delivery receipt updated', data: result });
    }
    catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
exports.updateDeliveryReceipt = updateDeliveryReceipt;
