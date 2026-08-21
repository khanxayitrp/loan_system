import { delivery_receipts, delivery_receiptsAttributes, delivery_receiptsCreationAttributes } from "../models/delivery_receipts";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import redisService from '../services/redis.service'; // 🌟 Import Redis ຕາມມາດຕະຖານ Hybrid System

import { logAudit } from '../utils/auditLogger';
import { generateSignatureSlots } from '../utils/signatureGenerator'; 

export type action = "submitted" | "verified_basic" | "verified_call" | "verified_cib" | "verified_field" | "assessed_income" | "verified_delivery_receipt" | "approved" | "rejected" | "returned_for_edit" | "cancelled";

class DeliveryReceiptRepository {
    
    async createDeliveryReceipt(
        data: any, 
        performedBy: number, 
        options: { transaction?: any } = {}
    ): Promise<any> { 
        const transaction = options.transaction || await db.sequelize.transaction();
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

            // 🌟 1. ປ້ອງກັນ Race Condition ດ້ວຍການ Lock Table ກ່ອນ Gen ID
            const last_receipt = await db.delivery_receipts.findOne({
                order: [['created_at', 'DESC']],
                attributes: ['receipts_id'],
                transaction,
                lock: transaction.LOCK.UPDATE 
            });

            let receiptId: string;
            if (last_receipt && last_receipt.receipts_id) {
                const lastIdNum = parseInt(last_receipt.receipts_id.split('-')[2], 10);
                const newIdNum = lastIdNum + 1;
                receiptId = `DR-${currentYear}-${newIdNum.toString().padStart(6, '0')}`;
            } else {
                receiptId = `DR-${currentYear}-000001`;
            }

            const mapData: any = {
                application_id: cleanDeliveryReceipt.application_id,
                receipts_id: receiptId,
                delivery_date: cleanDeliveryReceipt.delivery_date,
                receiver_name: cleanDeliveryReceipt.receiver_name,
                receipt_image_url: cleanDeliveryReceipt.receipt_image_url || null,
                status: cleanDeliveryReceipt.status || 'pending',
                remark: cleanDeliveryReceipt.remark || null,
            }

            const newDeliveryReceipt = await db.delivery_receipts.create(mapData, { transaction });

            if (performedBy) {
                await logAudit('delivery_receipts', newDeliveryReceipt.id, 'CREATE', null, mapData, performedBy, transaction);
            }

            // 🌟 2. ສ້າງຊ່ອງລາຍເຊັນລໍຖ້າໄວ້
            await generateSignatureSlots(
                cleanDeliveryReceipt.application_id, 
                'delivery_note', 
                newDeliveryReceipt.id, 
                transaction
            );

            // ອັບເດດລາຍເຊັນພະນັກງານຜູ້ກະກຽມ (sales_staff) ອັດຕະໂນມັດ
            if (performedBy) {
                const staffUser = await db.users.findByPk(performedBy, { transaction });
                const staffName = staffUser ? (staffUser.full_name || staffUser.username) : 'ພະນັກງານ';

                await db.document_signatures.update(
                    {
                        user_id: performedBy,
                        signer_name: staffName,
                        status: 'signed',
                        signed_at: new Date()
                    },
                    {
                        where: {
                            application_id: cleanDeliveryReceipt.application_id,
                            document_type: 'delivery_note',
                            reference_id: newDeliveryReceipt.id,
                            role_type: 'sales_staff' 
                        },
                        transaction
                    }
                );
            }

            if (!options.transaction) {
                await transaction.commit();
            }

            // 🌟 3. ລ້າງ Cache ຕາມກົດຂອງ Hybrid System (POST)
            if (redisService.isClientConnected()) {
                await redisService.delByPattern(`cache:delivery_receipts:*`);
                await redisService.del(`cache:loan_application:${cleanDeliveryReceipt.application_id}`);
            }
            
            logger.info(`Delivery receipt created with ID: ${newDeliveryReceipt.id}`);
            return newDeliveryReceipt;

        } catch (error) {
            if (!options.transaction) {
                await transaction.rollback();
            }
            logger.error(`Error creating delivery receipt: ${(error as Error).message}`);
            throw error;
        }
    }

    async findDeliveryReceiptById(deliveryReceiptId: number): Promise<delivery_receipts | null> {
        return await db.delivery_receipts.findByPk(deliveryReceiptId);
    }
    async findDeliveryReceiptsByApplicationId(applicationId: number): Promise<delivery_receipts | null> {
        return await db.delivery_receipts.findOne({ where: { application_id: applicationId } });
    }
    async findDeliveryReceiptsByStatus(status: string): Promise<delivery_receipts[]> {
        return await db.delivery_receipts.findAll({ where: { status: status } });
    }
    async findDeliveryReceiptsBetweenDates(startDate: Date, endDate: Date): Promise<delivery_receipts[]> {
        return await db.delivery_receipts.findAll({
            where: { delivery_date: { [Op.between]: [startDate, endDate] } }
        });
    }
    async findDeliveryReceiptsByReceiverName(receiverName: string): Promise<delivery_receipts[]> {
        return await db.delivery_receipts.findAll({
            where: { receiver_name: { [Op.like]: `%${receiverName}%` } }
        });
    }
    async findDeliveryReceiptsByReceiptId(receiptsId: string): Promise<delivery_receipts | null> {
        return await db.delivery_receipts.findOne({ where: { receipts_id: receiptsId } });
    }
    async findLastReceiptId(): Promise<string | null> {
        const last_receipt = await db.delivery_receipts.findOne({
            order: [['created_at', 'DESC']],
        });
        return last_receipt ? last_receipt.receipts_id : null;
    }

    async updateDeliveryReceipt(
        deliveryReceiptId: number,
        data: Partial<any>, 
        performedBy: number,
        options: { transaction?: any } = {}
    ): Promise<any | null> { 
        const transaction = options.transaction || await db.sequelize.transaction();
        
        try {
            // 🌟 4. ເພີ່ມ LOCK.UPDATE ເພື່ອປ້ອງກັນ Race Condition ຕອນອັບເດດ
            const deliveryReceipt = await db.delivery_receipts.findByPk(deliveryReceiptId, { 
                transaction,
                lock: transaction.LOCK.UPDATE 
            });

            if (!deliveryReceipt) {
                logger.error(`Delivery receipt with ID: ${deliveryReceiptId} not found`);
                if (!options.transaction) await transaction.rollback();
                return null;
            }

            const oldData = deliveryReceipt.toJSON();

            if (data.status && !['pending', 'approved', 'rejected'].includes(data.status)) {
                throw new Error('Invalid status value');
            }

            // 🌟 5. ແຍກໂລຈິກຊັດເຈນ: ໃຊ້ສະຖານະທີ່ສົ່ງມາ, ຖ້າບໍ່ສົ່ງມາ ໃຫ້ໃຊ້ສະຖານະເດີມ (ບໍ່ອະນຸມັດອັດຕະໂນມັດຈາກຮູບພາບແລ້ວ)
            let receipts_status = data.status || deliveryReceipt.status; 
            const approverId = data.approver_id || performedBy;

            const mapData: any = {
                receiver_name: data.receiver_name !== undefined ? data.receiver_name : deliveryReceipt.receiver_name,
                delivery_date: data.delivery_date !== undefined ? data.delivery_date : deliveryReceipt.delivery_date,
                receipt_image_url: data.receipt_image_url !== undefined ? data.receipt_image_url : deliveryReceipt.receipt_image_url,
                status: receipts_status,
                approver_id: receipts_status === 'approved' ? approverId : deliveryReceipt.approver_id,
                approved_at: receipts_status === 'approved' ? new Date() : deliveryReceipt.approved_at,
                remark: data.remark !== undefined ? data.remark : deliveryReceipt.remark,
            }

            const updatedDeliveryReceipt = await deliveryReceipt.update(mapData, { transaction });

            if (performedBy) {
                await logAudit('delivery_receipts', updatedDeliveryReceipt.id, 'UPDATE', oldData, mapData, performedBy, transaction);
            }

            // ==========================================
            // 🌟 6. ຈັດການລາຍເຊັນສະເພາະຕອນທີ່ອະນຸມັດ ຫຼື ປະຕິເສດ ເທົ່ານັ້ນ
            // ==========================================
            if (['approved', 'rejected'].includes(receipts_status) && oldData.status !== receipts_status) {
                const approverUser = await db.users.findByPk(approverId, { transaction });

                let roleType = 'sales_staff'; 
                if (approverUser) {
                    if (approverUser.role === 'partner') roleType = 'partner_shop';
                    else if (approverUser.staff_level === 'sales') roleType = 'sales_staff';
                    else if (approverUser.staff_level === 'credit_manager') roleType = 'credit_head';
                    else if (['deputy_director', 'assistant_director'].includes(approverUser.staff_level || '')) roleType = 'approver_2';
                    else if (approverUser.staff_level === 'director') roleType = 'approver_1';
                }

                const signatureStatus = receipts_status === 'approved' ? 'signed' : 'rejected';

                const staffSignature = await db.document_signatures.findOne({
                    where: { document_type: 'delivery_note', reference_id: updatedDeliveryReceipt.id, role_type: roleType },
                    transaction
                });

                if (staffSignature) {
                    const oldSig = staffSignature.toJSON();
                    await staffSignature.update({
                        user_id: approverId, status: signatureStatus, signed_at: new Date()
                    }, { transaction });
                    await logAudit('document_signatures', staffSignature.id, 'UPDATE', oldSig, staffSignature.toJSON(), performedBy, transaction);
                } else {
                    const newSig = await db.document_signatures.create({
                        application_id: updatedDeliveryReceipt.application_id, document_type: 'delivery_note', reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType as any, user_id: approverId, status: signatureStatus, signed_at: new Date()
                    }, { transaction });
                    await logAudit('document_signatures', newSig.id, 'CREATE', null, newSig.toJSON(), performedBy, transaction);
                }

                if (receipts_status === 'approved') {
                    const borrowerSignature = await db.document_signatures.findOne({
                        where: { document_type: 'delivery_note', reference_id: updatedDeliveryReceipt.id, role_type: 'borrower' },
                        transaction
                    });

                    const finalReceiverName = mapData.receiver_name || oldData.receiver_name || 'ລູກຄ້າ';
                    const finalReceiptImage = mapData.receipt_image_url || oldData.receipt_image_url || null;

                    if (borrowerSignature) {
                        const oldBorSig = borrowerSignature.toJSON();
                        await borrowerSignature.update({
                            signer_name: finalReceiverName, signature_image_url: finalReceiptImage, status: 'signed', signed_at: new Date()
                        }, { transaction });
                        await logAudit('document_signatures', borrowerSignature.id, 'UPDATE', oldBorSig, borrowerSignature.toJSON(), performedBy, transaction);
                    } else {
                        const newBorSig = await db.document_signatures.create({
                            application_id: updatedDeliveryReceipt.application_id, document_type: 'delivery_note', reference_id: updatedDeliveryReceipt.id,
                            role_type: 'borrower', signer_name: finalReceiverName, signature_image_url: finalReceiptImage, status: 'signed', signed_at: new Date()
                        }, { transaction });
                        await logAudit('document_signatures', newBorSig.id, 'CREATE', null, newBorSig.toJSON(), performedBy, transaction);
                    }
                }
            }

            if (oldData.status !== receipts_status && ['approved', 'rejected'].includes(receipts_status)) {
                await db.loan_approval_logs.create({
                    application_id: updatedDeliveryReceipt.application_id,
                    action: "verified_delivery_receipt", 
                    status_from: oldData.status,
                    status_to: receipts_status,
                    remarks: mapData.remark || `Delivery receipt has been ${receipts_status}`,
                    performed_by: performedBy
                }, { transaction });
            }

            if (!options.transaction) {
                await transaction.commit();
            }

            // 🌟 7. ລ້າງ Cache ຕາມກົດຂອງ Hybrid System (PUT)
            if (redisService.isClientConnected()) {
                await redisService.delByPattern(`cache:delivery_receipts:*`);
                await redisService.del(`cache:loan_application:${updatedDeliveryReceipt.application_id}`);
                await redisService.del(`cache:pdf:delivery_note:${updatedDeliveryReceipt.id}`);
            }

            logger.info(`Delivery receipt updated with ID: ${updatedDeliveryReceipt.id}`);
            return updatedDeliveryReceipt;

        } catch (error) {
            if (!options.transaction) {
                await transaction.rollback();
            }
            logger.error(`Error updating delivery receipt: ${(error as Error).message}`);
            throw error;
        }
    }
}
export default new DeliveryReceiptRepository();