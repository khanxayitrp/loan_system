import { delivery_receipts, delivery_receiptsAttributes, delivery_receiptsCreationAttributes } from "../models/delivery_receipts";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

// 🟢 ສົມມຸດວ່າທ່ານມີ Helper Function ສຳລັບ Audit Log (ຖ້າບໍ່ມີໃຫ້ໃຊ້ db.audit_logs.create ໂດຍກົງ)
import { logAudit } from '../utils/auditLogger';


export type action = "submitted" | "verified_basic" | "verified_call" | "verified_cib" | "verified_field" | "assessed_income" | "verified_delivery_receipt" | "approved" | "rejected" | "returned_for_edit" | "cancelled";
class DeliveryReceiptRepository {
    async createDeliveryReceipt(
        data: delivery_receiptsCreationAttributes,
        performedBy: number, // 🟢 ເພີ່ມ performedBy (User ID) ເພື່ອໃຊ້ບັນທຶກ Log
        options: { transaction?: any } = {}
    ): Promise<delivery_receipts> {
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

            const last_receipt = await db.delivery_receipts.findOne({
                order: [['created_at', 'DESC']],
                attributes: ['receipts_id'],
                transaction
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

            // 🟢 1. ບັນທຶກ Audit Log (Action: CREATE)
            if (performedBy) {
                await logAudit('delivery_receipts', newDeliveryReceipt.id, 'CREATE', null, mapData, performedBy, transaction);
            }

            if (!options.transaction) await transaction.commit();
            logger.info(`Delivery receipt created with ID: ${newDeliveryReceipt.id}`);
            return newDeliveryReceipt;

        } catch (error) {
            if (!options.transaction) await transaction.rollback();
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
            where: {
                delivery_date: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });
    }

    async findDeliveryReceiptsByReceiverName(receiverName: string): Promise<delivery_receipts[]> {
        return await db.delivery_receipts.findAll({
            where: {
                receiver_name: {
                    [Op.like]: `%${receiverName}%`
                }
            }
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
        data: Partial<delivery_receiptsAttributes>,
        performedBy: number,
        options: { transaction?: any } = {}
    ): Promise<delivery_receipts | null> {
        const transaction = options.transaction || await db.sequelize.transaction();
        try {
            const deliveryReceipt = await db.delivery_receipts.findByPk(deliveryReceiptId, { transaction });
            if (!deliveryReceipt) {
                logger.error(`Delivery receipt with ID: ${deliveryReceiptId} not found`);
                if (!options.transaction) await transaction.rollback();
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
            } else if (data.status === 'rejected') {
                receipts_status = 'rejected';
            }

            const approverId = data.approver_id || performedBy;

            const mapData: any = {
                receiver_name: data.receiver_name !== undefined ? data.receiver_name : deliveryReceipt.receiver_name,
                delivery_date: data.delivery_date !== undefined ? data.delivery_date : deliveryReceipt.delivery_date,
                receipt_image_url: data.receipt_image_url !== undefined ? data.receipt_image_url : deliveryReceipt.receipt_image_url,
                status: receipts_status,
                approver_id: receipts_status === 'approved' ? approverId : null,
                approved_at: receipts_status === 'approved' ? new Date() : null,
                remark: data.remark !== undefined ? data.remark : deliveryReceipt.remark,
            }

            // อัปเดตข้อมูล
            const updatedDeliveryReceipt = await deliveryReceipt.update(mapData, { transaction });

            // ==========================================
            // 🟢 1. บันทึก Audit Log (Action: UPDATE)
            // ==========================================
            if (performedBy) {
                await logAudit('delivery_receipts', updatedDeliveryReceipt.id, 'UPDATE', oldData, mapData, performedBy, transaction);
            }

            // ==========================================
            // 🟢 2. บันทึกประวัติลายเซ็น (Document Signatures) 
            // ทำเฉพาะตอน "อนุมัติ" ใบส่งมอบเท่านั้น
            // ==========================================
            if (receipts_status === 'approved') {
                // หาข้อมูลคนอนุมัติเพื่อดึง Role
                const approverUser = await db.users.findByPk(approverId, { transaction });

                // กำหนดสิทธิ์เริ่มต้นในการเซ็นใบมอบรับ (มักจะเป็น หัวหน้าแผนก หรือ พนักงานขาย)
                let roleType = 'credit_head';

                if (approverUser?.staff_level) {
                    if (approverUser.staff_level === 'deputy_director') roleType = 'approver_1';
                    else if (approverUser.staff_level === 'director') roleType = 'approver_3';
                    else if (approverUser.staff_level === 'sale') roleType = 'sales_staff';
                    else if (approverUser.staff_level === 'credit_manager') roleType = 'credit_head';
                }

                // เช็คป้องกันการเซ็นซ้ำในเอกสารใบเดิม
                const existingSignature = await db.document_signatures.findOne({
                    where: {
                        document_type: 'delivery_note', // 📍 ระบุว่าเป็นเอกสารใบมอบรับ
                        reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType
                    },
                    transaction
                });

                if (!existingSignature) {
                    await db.document_signatures.create({
                        application_id: updatedDeliveryReceipt.application_id,
                        document_type: 'delivery_note',
                        reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType as any,
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
                await db.loan_approval_logs.create({
                    application_id: updatedDeliveryReceipt.application_id,
                    action: "verified_delivery_receipt", // 📍 ใช้ Action ตามที่คุณมีในระบบได้เลยครับ 
                    status_from: oldData.status,
                    status_to: receipts_status,
                    remarks: mapData.remark || `Delivery receipt has been ${receipts_status}`,
                    performed_by: performedBy
                }, { transaction });
            }

            // จบ Transaction
            if (!options.transaction) await transaction.commit();
            logger.info(`Delivery receipt updated with ID: ${updatedDeliveryReceipt.id}`);

            return updatedDeliveryReceipt;

        } catch (error) {
            if (!options.transaction) await transaction.rollback();
            logger.error(`Error updating delivery receipt: ${(error as Error).message}`);
            throw error;
        }
    }
}
export default new DeliveryReceiptRepository();