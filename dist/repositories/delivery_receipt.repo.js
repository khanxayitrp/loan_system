"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const sequelize_1 = require("sequelize");
// 🟢 ສົມມຸດວ່າທ່ານມີ Helper Function ສຳລັບ Audit Log (ຖ້າບໍ່ມີໃຫ້ໃຊ້ db.audit_logs.create ໂດຍກົງ)
const auditLogger_1 = require("../utils/auditLogger");
class DeliveryReceiptRepository {
    async createDeliveryReceipt(data, performedBy, // 🟢 ເພີ່ມ performedBy (User ID) ເພື່ອໃຊ້ບັນທຶກ Log
    options = {}) {
        const transaction = options.transaction || await init_models_1.db.sequelize.transaction();
        try {
            const cleanDeliveryReceipt = { ...data };
            if (!cleanDeliveryReceipt.application_id || cleanDeliveryReceipt.application_id === 0) {
                throw new Error('Loan Application ID is required');
            }
            if (!cleanDeliveryReceipt.delivery_date) {
                throw new Error('Delivery date is required');
            }
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const last_receipt = await init_models_1.db.delivery_receipts.findOne({
                order: [['created_at', 'DESC']],
                attributes: ['receipts_id'],
                transaction
            });
            let receiptId;
            if (last_receipt && last_receipt.receipts_id) {
                const lastIdNum = parseInt(last_receipt.receipts_id.split('-')[2], 10);
                const newIdNum = lastIdNum + 1;
                receiptId = `DR-${currentYear}-${newIdNum.toString().padStart(6, '0')}`;
            }
            else {
                receiptId = `DR-${currentYear}-000001`;
            }
            const mapData = {
                application_id: cleanDeliveryReceipt.application_id,
                receipts_id: receiptId,
                delivery_date: cleanDeliveryReceipt.delivery_date,
                receiver_name: cleanDeliveryReceipt.receiver_name,
                receipt_image_url: cleanDeliveryReceipt.receipt_image_url || null,
                status: cleanDeliveryReceipt.status || 'pending',
                remark: cleanDeliveryReceipt.remark || null,
            };
            const newDeliveryReceipt = await init_models_1.db.delivery_receipts.create(mapData, { transaction });
            // 🟢 1. ບັນທຶກ Audit Log (Action: CREATE)
            if (performedBy) {
                await (0, auditLogger_1.logAudit)('delivery_receipts', newDeliveryReceipt.id, 'CREATE', null, mapData, performedBy, transaction);
            }
            if (!options.transaction)
                await transaction.commit();
            logger_1.logger.info(`Delivery receipt created with ID: ${newDeliveryReceipt.id}`);
            return newDeliveryReceipt;
        }
        catch (error) {
            if (!options.transaction)
                await transaction.rollback();
            logger_1.logger.error(`Error creating delivery receipt: ${error.message}`);
            throw error;
        }
    }
    async findDeliveryReceiptById(deliveryReceiptId) {
        return await init_models_1.db.delivery_receipts.findByPk(deliveryReceiptId);
    }
    async findDeliveryReceiptsByApplicationId(applicationId) {
        return await init_models_1.db.delivery_receipts.findOne({ where: { application_id: applicationId } });
    }
    async findDeliveryReceiptsByStatus(status) {
        return await init_models_1.db.delivery_receipts.findAll({ where: { status: status } });
    }
    async findDeliveryReceiptsBetweenDates(startDate, endDate) {
        return await init_models_1.db.delivery_receipts.findAll({
            where: {
                delivery_date: {
                    [sequelize_1.Op.between]: [startDate, endDate]
                }
            }
        });
    }
    async findDeliveryReceiptsByReceiverName(receiverName) {
        return await init_models_1.db.delivery_receipts.findAll({
            where: {
                receiver_name: {
                    [sequelize_1.Op.like]: `%${receiverName}%`
                }
            }
        });
    }
    async findDeliveryReceiptsByReceiptId(receiptsId) {
        return await init_models_1.db.delivery_receipts.findOne({ where: { receipts_id: receiptsId } });
    }
    async findLastReceiptId() {
        const last_receipt = await init_models_1.db.delivery_receipts.findOne({
            order: [['created_at', 'DESC']],
        });
        return last_receipt ? last_receipt.receipts_id : null;
    }
    async updateDeliveryReceipt(deliveryReceiptId, data, performedBy, options = {}) {
        const transaction = options.transaction || await init_models_1.db.sequelize.transaction();
        try {
            const deliveryReceipt = await init_models_1.db.delivery_receipts.findByPk(deliveryReceiptId, { transaction });
            if (!deliveryReceipt) {
                logger_1.logger.error(`Delivery receipt with ID: ${deliveryReceiptId} not found`);
                if (!options.transaction)
                    await transaction.rollback();
                return null;
            }
            // เก็บค่าเก่าไว้เทียบใน Audit Log
            const oldData = deliveryReceipt.toJSON();
            let receipts_status = "pending";
            if (data.status && !['pending', 'approved', 'rejected'].includes(data.status)) {
                throw new Error('Invalid status value');
            }
            // ลอจิกเปลี่ยนสถานะ: ถ้ามีรูป หรือ สถานะส่งมาเป็น approved
            if (data.receipt_image_url || data.status === 'approved') {
                receipts_status = 'approved';
            }
            else if (data.status === 'rejected') {
                receipts_status = 'rejected';
            }
            const approverId = data.approver_id || performedBy;
            const mapData = {
                receiver_name: data.receiver_name !== undefined ? data.receiver_name : deliveryReceipt.receiver_name,
                delivery_date: data.delivery_date !== undefined ? data.delivery_date : deliveryReceipt.delivery_date,
                receipt_image_url: data.receipt_image_url !== undefined ? data.receipt_image_url : deliveryReceipt.receipt_image_url,
                status: receipts_status,
                approver_id: receipts_status === 'approved' ? approverId : null,
                approved_at: receipts_status === 'approved' ? new Date() : null,
                remark: data.remark !== undefined ? data.remark : deliveryReceipt.remark,
            };
            // อัปเดตข้อมูล
            const updatedDeliveryReceipt = await deliveryReceipt.update(mapData, { transaction });
            // ==========================================
            // 🟢 1. บันทึก Audit Log (Action: UPDATE)
            // ==========================================
            if (performedBy) {
                await (0, auditLogger_1.logAudit)('delivery_receipts', updatedDeliveryReceipt.id, 'UPDATE', oldData, mapData, performedBy, transaction);
            }
            // ==========================================
            // 🟢 2. บันทึกประวัติลายเซ็น (Document Signatures) 
            // ทำเฉพาะตอน "อนุมัติ" ใบส่งมอบเท่านั้น
            // ==========================================
            if (receipts_status === 'approved') {
                // หาข้อมูลคนอนุมัติเพื่อดึง Role
                const approverUser = await init_models_1.db.users.findByPk(approverId, { transaction });
                // กำหนดสิทธิ์เริ่มต้นในการเซ็นใบมอบรับ (มักจะเป็น หัวหน้าแผนก หรือ พนักงานขาย)
                let roleType = 'credit_head';
                if (approverUser?.staff_level) {
                    if (approverUser.staff_level === 'deputy_director')
                        roleType = 'approver_1';
                    else if (approverUser.staff_level === 'director')
                        roleType = 'approver_3';
                    else if (approverUser.staff_level === 'sale')
                        roleType = 'sales_staff';
                    else if (approverUser.staff_level === 'credit_manager')
                        roleType = 'credit_head';
                }
                // เช็คป้องกันการเซ็นซ้ำในเอกสารใบเดิม
                const existingSignature = await init_models_1.db.document_signatures.findOne({
                    where: {
                        document_type: 'delivery_note', // 📍 ระบุว่าเป็นเอกสารใบมอบรับ
                        reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType
                    },
                    transaction
                });
                if (!existingSignature) {
                    await init_models_1.db.document_signatures.create({
                        application_id: updatedDeliveryReceipt.application_id,
                        document_type: 'delivery_note',
                        reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType,
                        user_id: approverId,
                        status: 'signed',
                        signed_at: new Date()
                    }, { transaction });
                }
            }
            // ==========================================
            // 🟢 3. บันทึก Loan Approval Log 
            // ==========================================
            if (oldData.status !== receipts_status && ['approved', 'rejected'].includes(receipts_status)) {
                await init_models_1.db.loan_approval_logs.create({
                    application_id: updatedDeliveryReceipt.application_id,
                    action: "verified_delivery_receipt", // 📍 ใช้ Action ตามที่คุณมีในระบบได้เลยครับ 
                    status_from: oldData.status,
                    status_to: receipts_status,
                    remarks: mapData.remark || `Delivery receipt has been ${receipts_status}`,
                    performed_by: performedBy
                }, { transaction });
            }
            // จบ Transaction
            if (!options.transaction)
                await transaction.commit();
            logger_1.logger.info(`Delivery receipt updated with ID: ${updatedDeliveryReceipt.id}`);
            return updatedDeliveryReceipt;
        }
        catch (error) {
            if (!options.transaction)
                await transaction.rollback();
            logger_1.logger.error(`Error updating delivery receipt: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new DeliveryReceiptRepository();
