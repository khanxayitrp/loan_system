"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const sequelize_1 = require("sequelize");
// 🟢 ສົມມຸດວ່າທ່ານມີ Helper Function ສຳລັບ Audit Log (ຖ້າບໍ່ມີໃຫ້ໃຊ້ db.audit_logs.create ໂດຍກົງ)
const auditLogger_1 = require("../utils/auditLogger");
const signatureGenerator_1 = require("../utils/signatureGenerator"); // 🟢 Import Utility ເຂົ້າມາ
class DeliveryReceiptRepository {
    async createDeliveryReceipt(data, // delivery_receiptsCreationAttributes
    performedBy, // 🟢 ເພີ່ມ performedBy (User ID) ເພື່ອໃຊ້ບັນທຶກ Log
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
            // ==========================================
            // 🌟 🟢 ເພີ່ມໃໝ່: ສ້າງຊ່ອງລາຍເຊັນລໍຖ້າໄວ້ ສຳລັບໃບມອບຮັບສິນຄ້າ
            // ==========================================
            await (0, signatureGenerator_1.generateSignatureSlots)(cleanDeliveryReceipt.application_id, 'delivery_note', newDeliveryReceipt.id, // ໃຊ້ ID ຂອງໃບມອບຮັບທີ່ຫາກໍ່ສ້າງເປັນ Reference
            transaction);
            // ຖ້າບໍ່ມີການສົ່ງ transaction ມາຈາກຂ້າງນອກ ກໍ່ໃຫ້ commit ຢູ່ບ່ອນນີ້ເລີຍ
            if (!options.transaction) {
                await transaction.commit();
            }
            logger_1.logger.info(`Delivery receipt created with ID: ${newDeliveryReceipt.id}`);
            return newDeliveryReceipt;
        }
        catch (error) {
            // ຖ້າບໍ່ມີການສົ່ງ transaction ມາຈາກຂ້າງນອກ ກໍ່ໃຫ້ rollback ຢູ່ບ່ອນນີ້ເລີຍ
            if (!options.transaction) {
                await transaction.rollback();
            }
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
    async updateDeliveryReceipt(deliveryReceiptId, data, // ປ່ຽນເປັນ Partial<delivery_receiptsAttributes> ຕາມ Type ທີ່ມີໃນໂປຣເຈັກຈິງຂອງທ່ານ
    performedBy, options = {}) {
        const transaction = options.transaction || await init_models_1.db.sequelize.transaction();
        try {
            // 1. ຄົ້ນຫາໃບມອບຮັບສິນຄ້າ
            const deliveryReceipt = await init_models_1.db.delivery_receipts.findByPk(deliveryReceiptId, { transaction });
            if (!deliveryReceipt) {
                logger_1.logger.error(`Delivery receipt with ID: ${deliveryReceiptId} not found`);
                if (!options.transaction)
                    await transaction.rollback();
                return null;
            }
            // 2. ເກັບຄ່າເກົ່າໄວ້ທຽບໃນ Audit Log
            const oldData = deliveryReceipt.toJSON();
            // 3. ກວດສອບ ແລະ ຈັດການສະຖານະ (Status)
            let receipts_status = "pending";
            if (data.status && !['pending', 'approved', 'rejected'].includes(data.status)) {
                throw new Error('Invalid status value');
            }
            // ໂລຈິກປ່ຽນສະຖານະ: ຖ້າມີຮູບພາບມອບຮັບ ຫຼື ສະຖານະສົ່ງມາເປັນ approved
            if (data.receipt_image_url || data.status === 'approved') {
                receipts_status = 'approved';
            }
            else if (data.status === 'rejected') {
                receipts_status = 'rejected';
            }
            const approverId = data.approver_id || performedBy;
            // 4. ກຽມຂໍ້ມູນສຳລັບອັບເດດ
            const mapData = {
                receiver_name: data.receiver_name !== undefined ? data.receiver_name : deliveryReceipt.receiver_name,
                delivery_date: data.delivery_date !== undefined ? data.delivery_date : deliveryReceipt.delivery_date,
                receipt_image_url: data.receipt_image_url !== undefined ? data.receipt_image_url : deliveryReceipt.receipt_image_url,
                status: receipts_status,
                approver_id: receipts_status === 'approved' ? approverId : null,
                approved_at: receipts_status === 'approved' ? new Date() : null,
                remark: data.remark !== undefined ? data.remark : deliveryReceipt.remark,
            };
            // 5. ອັບເດດຂໍ້ມູນ Delivery Receipt ລົງຖານຂໍ້ມູນ
            const updatedDeliveryReceipt = await deliveryReceipt.update(mapData, { transaction });
            // ==========================================
            // 🟢 6. ບັນທຶກ Audit Log (Action: UPDATE ສຳລັບໃບມອບຮັບ)
            // ==========================================
            if (performedBy) {
                await (0, auditLogger_1.logAudit)('delivery_receipts', updatedDeliveryReceipt.id, 'UPDATE', oldData, mapData, performedBy, transaction);
            }
            // ==========================================
            // 🌟 🟢 7. ຈັດການລາຍເຊັນ (Document Signatures)
            // ຈະເຮັດວຽກສະເພາະຕອນທີ່ "ອະນຸມັດ" ຫຼື "ປະຕິເສດ" ເທົ່ານັ້ນ
            // ==========================================
            if (['approved', 'rejected'].includes(receipts_status)) {
                const approverUser = await init_models_1.db.users.findByPk(approverId, { transaction });
                // 7.1 ຈັດການລາຍເຊັນ "ຄົນໃນລະບົບ" (Staff / Partner)
                let roleType = 'sales_staff'; // Default Fallback
                if (approverUser) {
                    // ✅ ແຍກ Role ແລະ Staff Level ໃຫ້ຕົງກັບ Database
                    if (approverUser.role === 'partner') {
                        roleType = 'partner_shop';
                    }
                    else if (approverUser.staff_level === 'sales') {
                        roleType = 'sales_staff';
                    }
                    else if (approverUser.staff_level === 'credit_manager') {
                        roleType = 'credit_head';
                    }
                    else if (approverUser.staff_level === 'deputy_director') {
                        roleType = 'approver_2';
                    }
                    else if (['director', 'approver'].includes(approverUser.staff_level || '')) {
                        roleType = 'approver_1';
                    }
                }
                const signatureStatus = receipts_status === 'approved' ? 'signed' : 'rejected';
                // ຄົ້ນຫາຊ່ອງລາຍເຊັນທີ່ຖືກສ້າງລໍຖ້າໄວ້ແລ້ວ (Pending) ຂອງພະນັກງານ/ຮ້ານຄ້າ
                const staffSignature = await init_models_1.db.document_signatures.findOne({
                    where: {
                        document_type: 'delivery_note', // 📍 ລະບຸວ່າເປັນເອກະສານໃບມອບຮັບ
                        reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType
                    },
                    transaction
                });
                if (staffSignature) {
                    // ✅ ຖ້າພົບຊ່ອງທີ່ລໍຖ້າຢູ່ -> ໃຫ້ອັບເດດປະທັບຕາລາຍເຊັນ
                    const oldSig = staffSignature.toJSON();
                    await staffSignature.update({
                        user_id: approverId,
                        status: signatureStatus,
                        signed_at: new Date()
                    }, { transaction });
                    await (0, auditLogger_1.logAudit)('document_signatures', staffSignature.id, 'UPDATE', oldSig, staffSignature.toJSON(), performedBy, transaction);
                }
                else {
                    // ⚠️ ຖ້າບໍ່ພົບຊ່ອງລໍຖ້າ -> ໃຫ້ສ້າງໃໝ່ເລີຍ
                    const newSig = await init_models_1.db.document_signatures.create({
                        application_id: updatedDeliveryReceipt.application_id,
                        document_type: 'delivery_note',
                        reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType,
                        user_id: approverId,
                        status: signatureStatus,
                        signed_at: new Date()
                    }, { transaction });
                    await (0, auditLogger_1.logAudit)('document_signatures', newSig.id, 'CREATE', null, newSig.toJSON(), performedBy, transaction);
                }
                // 🌟 7.2 ຈັດການລາຍເຊັນ "ຄົນນອກລະບົບ" (ລູກຄ້າ / Borrower)
                // ຖ້າ Delivery ຖືກ Approved ແປວ່າລູກຄ້າເຊັນຮັບເຄື່ອງແລ້ວ ພະນັກງານຈຶ່ງມາກົດບັນທຶກອະນຸມັດ
                if (receipts_status === 'approved') {
                    const borrowerSignature = await init_models_1.db.document_signatures.findOne({
                        where: {
                            document_type: 'delivery_note',
                            reference_id: updatedDeliveryReceipt.id,
                            role_type: 'borrower'
                        },
                        transaction
                    });
                    const finalReceiverName = mapData.receiver_name || oldData.receiver_name || 'ລູກຄ້າ';
                    const finalReceiptImage = mapData.receipt_image_url || oldData.receipt_image_url || null;
                    if (borrowerSignature) {
                        const oldBorSig = borrowerSignature.toJSON();
                        await borrowerSignature.update({
                            signer_name: finalReceiverName,
                            signature_image_url: finalReceiptImage,
                            status: 'signed',
                            signed_at: new Date()
                        }, { transaction });
                        await (0, auditLogger_1.logAudit)('document_signatures', borrowerSignature.id, 'UPDATE', oldBorSig, borrowerSignature.toJSON(), performedBy, transaction);
                    }
                    else {
                        const newBorSig = await init_models_1.db.document_signatures.create({
                            application_id: updatedDeliveryReceipt.application_id,
                            document_type: 'delivery_note',
                            reference_id: updatedDeliveryReceipt.id,
                            role_type: 'borrower',
                            signer_name: finalReceiverName,
                            signature_image_url: finalReceiptImage,
                            status: 'signed',
                            signed_at: new Date()
                        }, { transaction });
                        await (0, auditLogger_1.logAudit)('document_signatures', newBorSig.id, 'CREATE', null, newBorSig.toJSON(), performedBy, transaction);
                    }
                }
            }
            // ==========================================
            // 🟢 8. ບັນທຶກ Loan Approval Log (Timeline ຂອງສິນເຊື່ອ)
            // ==========================================
            if (oldData.status !== receipts_status && ['approved', 'rejected'].includes(receipts_status)) {
                await init_models_1.db.loan_approval_logs.create({
                    application_id: updatedDeliveryReceipt.application_id,
                    action: "verified_delivery_receipt", // 📍 ຊື່ Action ທີ່ສະແດງໃນ Timeline 
                    status_from: oldData.status,
                    status_to: receipts_status,
                    remarks: mapData.remark || `Delivery receipt has been ${receipts_status}`,
                    performed_by: performedBy
                }, { transaction });
            }
            // 9. ຈົບ Transaction (ຖ້າບໍ່ມີການສົ່ງມາຈາກຂ້າງນອກ)
            if (!options.transaction) {
                await transaction.commit();
            }
            logger_1.logger.info(`Delivery receipt updated with ID: ${updatedDeliveryReceipt.id}`);
            return updatedDeliveryReceipt;
        }
        catch (error) {
            // ຖ້າເກີດ Error ໃຫ້ Rollback ຂໍ້ມູນທັງໝົດ
            if (!options.transaction) {
                await transaction.rollback();
            }
            logger_1.logger.error(`Error updating delivery receipt: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new DeliveryReceiptRepository();
