"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeliveryReceipt = exports.getLastReceiptId = exports.getDeliveryReceiptsByApplicationId = exports.getDeliveryReceiptByReceiptId = exports.saveDeliveryReceipt = void 0;
const delivery_receipt_repo_1 = __importDefault(require("../repositories/delivery_receipt.repo"));
const init_models_1 = require("../models/init-models");
// 👉 1. Import Custom Errors
const errors_1 = require("../utils/errors");
const saveDeliveryReceipt = async (req, res, next) => {
    const transaction = await init_models_1.db.sequelize.transaction();
    try {
        const application_id = parseInt(req.params.application_id);
        // Validate application_id
        if (!application_id || isNaN(application_id)) {
            throw new errors_1.BadRequestError('application_id ບໍ່ຖືກຕ້ອງ (Invalid ID)');
        }
        const { delivery_receipt } = req.body;
        if (!delivery_receipt) {
            throw new errors_1.BadRequestError('ກະລຸນາສົ່ງຂໍ້ມູນ delivery_receipt (Data is required)');
        }
        const userId = req.userPayload?.userId;
        console.log('Saving delivery receipt for application_id:', application_id);
        console.log('Delivery receipt data:', delivery_receipt);
        const result = await delivery_receipt_repo_1.default.createDeliveryReceipt(delivery_receipt, Number(userId), { transaction });
        await transaction.commit();
        return res.status(201).json({
            success: true,
            message: 'Delivery receipt saved',
            data: result
        });
    }
    catch (error) {
        await transaction.rollback(); // 👈 Rollback ก่อนโยน Error
        next(error); // โยนให้ Global Error Handler
    }
};
exports.saveDeliveryReceipt = saveDeliveryReceipt;
const getDeliveryReceiptByReceiptId = async (req, res, next) => {
    try {
        const receipts_id = req.params.receipts_id;
        if (!receipts_id) {
            throw new errors_1.BadRequestError('receipts_id ເປັນຂໍ້ມູນບັງຄັບ');
        }
        const result = await delivery_receipt_repo_1.default.findDeliveryReceiptsByReceiptId(receipts_id);
        if (!result) {
            throw new errors_1.NotFoundError('Delivery receipt not found');
        }
        return res.status(200).json({
            success: true,
            message: 'Delivery receipt retrieved',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeliveryReceiptByReceiptId = getDeliveryReceiptByReceiptId;
const getDeliveryReceiptsByApplicationId = async (req, res, next) => {
    try {
        const application_id = parseInt(req.params.application_id);
        if (!application_id || isNaN(application_id)) {
            throw new errors_1.BadRequestError('application_id ບໍ່ຖືກຕ້ອງ');
        }
        const result = await delivery_receipt_repo_1.default.findDeliveryReceiptsByApplicationId(application_id);
        if (!result) {
            throw new errors_1.NotFoundError('Delivery receipt not found for this application');
        }
        return res.status(200).json({
            success: true,
            message: 'Delivery receipt retrieved',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeliveryReceiptsByApplicationId = getDeliveryReceiptsByApplicationId;
const getLastReceiptId = async (req, res, next) => {
    try {
        const result = await delivery_receipt_repo_1.default.findLastReceiptId();
        return res.status(200).json({
            success: true,
            message: 'Last receipt ID retrieved',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLastReceiptId = getLastReceiptId;
const updateDeliveryReceipt = async (req, res, next) => {
    const transaction = await init_models_1.db.sequelize.transaction();
    try {
        const deliveryReceiptId = parseInt(req.params.id);
        if (!deliveryReceiptId || isNaN(deliveryReceiptId)) {
            throw new errors_1.BadRequestError('Receipt ID ບໍ່ຖືກຕ້ອງ');
        }
        const data = req.body;
        console.log('Updating delivery receipt with ID:', deliveryReceiptId);
        const userId = req.userPayload?.userId;
        const result = await delivery_receipt_repo_1.default.updateDeliveryReceipt(deliveryReceiptId, data, Number(userId), { transaction });
        if (!result) {
            // โยน Error ไปให้ Catch block ทำการ Rollback ทันที
            throw new errors_1.NotFoundError('Delivery receipt not found');
        }
        await transaction.commit();
        return res.status(200).json({
            success: true,
            message: 'Delivery receipt updated',
            data: result
        });
    }
    catch (error) {
        await transaction.rollback(); // 👈 รับจบ Error ทุกอย่าง และ Rollback ให้
        next(error);
    }
};
exports.updateDeliveryReceipt = updateDeliveryReceipt;
