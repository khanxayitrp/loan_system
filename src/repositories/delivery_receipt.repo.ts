import { delivery_receipts, delivery_receiptsAttributes, delivery_receiptsCreationAttributes } from "../models/delivery_receipts";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';


// 🟢 ສົມມຸດວ່າທ່ານມີ Helper Function ສຳລັບ Audit Log (ຖ້າບໍ່ມີໃຫ້ໃຊ້ db.audit_logs.create ໂດຍກົງ)
import { logAudit } from '../utils/auditLogger';
import { generateSignatureSlots } from '../utils/signatureGenerator'; // 🟢 Import Utility ເຂົ້າມາ


export type action = "submitted" | "verified_basic" | "verified_call" | "verified_cib" | "verified_field" | "assessed_income" | "verified_delivery_receipt" | "approved" | "rejected" | "returned_for_edit" | "cancelled";
class DeliveryReceiptRepository {
    async createDeliveryReceipt(
        data: any, // delivery_receiptsCreationAttributes
        performedBy: number, // 🟢 ເພີ່ມ performedBy (User ID) ເພື່ອໃຊ້ບັນທຶກ Log
        options: { transaction?: any } = {}
    ): Promise<any> { // Promise<delivery_receipts>
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

            // ==========================================
            // 🌟 🟢 ເພີ່ມໃໝ່: ສ້າງຊ່ອງລາຍເຊັນລໍຖ້າໄວ້ ສຳລັບໃບມອບຮັບສິນຄ້າ
            // ==========================================
            await generateSignatureSlots(
                cleanDeliveryReceipt.application_id, 
                'delivery_note', 
                newDeliveryReceipt.id, // ໃຊ້ ID ຂອງໃບມອບຮັບທີ່ຫາກໍ່ສ້າງເປັນ Reference
                transaction
            );

            // ຖ້າບໍ່ມີການສົ່ງ transaction ມາຈາກຂ້າງນອກ ກໍ່ໃຫ້ commit ຢູ່ບ່ອນນີ້ເລີຍ
            if (!options.transaction) {
                await transaction.commit();
            }
            
            logger.info(`Delivery receipt created with ID: ${newDeliveryReceipt.id}`);
            return newDeliveryReceipt;

        } catch (error) {
            // ຖ້າບໍ່ມີການສົ່ງ transaction ມາຈາກຂ້າງນອກ ກໍ່ໃຫ້ rollback ຢູ່ບ່ອນນີ້ເລີຍ
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
        data: Partial<any>, // ປ່ຽນເປັນ Partial<delivery_receiptsAttributes> ຕາມ Type ທີ່ມີໃນໂປຣເຈັກຈິງຂອງທ່ານ
        performedBy: number,
        options: { transaction?: any } = {}
    ): Promise<any | null> { // ປ່ຽນເປັນ Promise<delivery_receipts | null> ຕາມ Type ຈິງ
        const transaction = options.transaction || await db.sequelize.transaction();
        
        try {
            // 1. ຄົ້ນຫາໃບມອບຮັບສິນຄ້າ
            const deliveryReceipt = await db.delivery_receipts.findByPk(deliveryReceiptId, { transaction });
            if (!deliveryReceipt) {
                logger.error(`Delivery receipt with ID: ${deliveryReceiptId} not found`);
                if (!options.transaction) await transaction.rollback();
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
            } else if (data.status === 'rejected') {
                receipts_status = 'rejected';
            }

            const approverId = data.approver_id || performedBy;

            // 4. ກຽມຂໍ້ມູນສຳລັບອັບເດດ
            const mapData: any = {
                receiver_name: data.receiver_name !== undefined ? data.receiver_name : deliveryReceipt.receiver_name,
                delivery_date: data.delivery_date !== undefined ? data.delivery_date : deliveryReceipt.delivery_date,
                receipt_image_url: data.receipt_image_url !== undefined ? data.receipt_image_url : deliveryReceipt.receipt_image_url,
                status: receipts_status,
                approver_id: receipts_status === 'approved' ? approverId : null,
                approved_at: receipts_status === 'approved' ? new Date() : null,
                remark: data.remark !== undefined ? data.remark : deliveryReceipt.remark,
            }

            // 5. ອັບເດດຂໍ້ມູນ Delivery Receipt ລົງຖານຂໍ້ມູນ
            const updatedDeliveryReceipt = await deliveryReceipt.update(mapData, { transaction });

            // ==========================================
            // 🟢 6. ບັນທຶກ Audit Log (Action: UPDATE ສຳລັບໃບມອບຮັບ)
            // ==========================================
            if (performedBy) {
                await logAudit(
                    'delivery_receipts', 
                    updatedDeliveryReceipt.id, 
                    'UPDATE', 
                    oldData, 
                    mapData, 
                    performedBy, 
                    transaction
                );
            }

            // ==========================================
            // 🌟 🟢 7. ຈັດການລາຍເຊັນ (Document Signatures)
            // ຈະເຮັດວຽກສະເພາະຕອນທີ່ "ອະນຸມັດ" ຫຼື "ປະຕິເສດ" ເທົ່ານັ້ນ
            // ==========================================
            if (['approved', 'rejected'].includes(receipts_status)) {
                const approverUser = await db.users.findByPk(approverId, { transaction });

                // 7.1 ຈັດການລາຍເຊັນ "ຄົນໃນລະບົບ" (Staff / Partner)
                let roleType = 'sales_staff'; // Default Fallback

                if (approverUser) {
                    // ✅ ແຍກ Role ແລະ Staff Level ໃຫ້ຕົງກັບ Database
                    if (approverUser.role === 'partner') {
                        roleType = 'partner_shop';
                    } else if (approverUser.staff_level === 'sales') {
                        roleType = 'sales_staff';
                    } else if (approverUser.staff_level === 'credit_manager') {
                        roleType = 'credit_head';
                    } else if (approverUser.staff_level === 'deputy_director') {
                        roleType = 'approver_2';
                    } else if (['director', 'approver'].includes(approverUser.staff_level || '')) {
                        roleType = 'approver_1';
                    }
                }

                const signatureStatus = receipts_status === 'approved' ? 'signed' : 'rejected';

                // ຄົ້ນຫາຊ່ອງລາຍເຊັນທີ່ຖືກສ້າງລໍຖ້າໄວ້ແລ້ວ (Pending) ຂອງພະນັກງານ/ຮ້ານຄ້າ
                const staffSignature = await db.document_signatures.findOne({
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

                    await logAudit('document_signatures', staffSignature.id, 'UPDATE', oldSig, staffSignature.toJSON(), performedBy, transaction);
                } else {
                    // ⚠️ ຖ້າບໍ່ພົບຊ່ອງລໍຖ້າ -> ໃຫ້ສ້າງໃໝ່ເລີຍ
                    const newSig = await db.document_signatures.create({
                        application_id: updatedDeliveryReceipt.application_id,
                        document_type: 'delivery_note',
                        reference_id: updatedDeliveryReceipt.id,
                        role_type: roleType as any,
                        user_id: approverId,
                        status: signatureStatus,
                        signed_at: new Date()
                    }, { transaction });

                    await logAudit('document_signatures', newSig.id, 'CREATE', null, newSig.toJSON(), performedBy, transaction);
                }

                // 🌟 7.2 ຈັດການລາຍເຊັນ "ຄົນນອກລະບົບ" (ລູກຄ້າ / Borrower)
                // ຖ້າ Delivery ຖືກ Approved ແປວ່າລູກຄ້າເຊັນຮັບເຄື່ອງແລ້ວ ພະນັກງານຈຶ່ງມາກົດບັນທຶກອະນຸມັດ
                if (receipts_status === 'approved') {
                    const borrowerSignature = await db.document_signatures.findOne({
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

                        await logAudit('document_signatures', borrowerSignature.id, 'UPDATE', oldBorSig, borrowerSignature.toJSON(), performedBy, transaction);
                    } else {
                        const newBorSig = await db.document_signatures.create({
                            application_id: updatedDeliveryReceipt.application_id,
                            document_type: 'delivery_note',
                            reference_id: updatedDeliveryReceipt.id,
                            role_type: 'borrower',
                            signer_name: finalReceiverName,
                            signature_image_url: finalReceiptImage,
                            status: 'signed',
                            signed_at: new Date()
                        }, { transaction });

                        await logAudit('document_signatures', newBorSig.id, 'CREATE', null, newBorSig.toJSON(), performedBy, transaction);
                    }
                }
            }

            // ==========================================
            // 🟢 8. ບັນທຶກ Loan Approval Log (Timeline ຂອງສິນເຊື່ອ)
            // ==========================================
            if (oldData.status !== receipts_status && ['approved', 'rejected'].includes(receipts_status)) {
                await db.loan_approval_logs.create({
                    application_id: updatedDeliveryReceipt.application_id,
                    action: "verified_delivery_receipt", // 📍 ຊື່ Action ທີ່ສະແດງໃນ Timeline 
                    status_from: oldData.status,
                    status_to: receipts_status,
                    remarks: mapData.remark || `Delivery receipt has been ${receipts_status}`,
                    performed_by: performedBy
                }, { transaction });
            }

            // 10. ຈົບ Transaction (ຖ້າບໍ່ມີການສົ່ງມາຈາກຂ້າງນອກ)
            if (!options.transaction) {
                await transaction.commit();
            }
            logger.info(`Delivery receipt updated with ID: ${updatedDeliveryReceipt.id}`);

            return updatedDeliveryReceipt;

        } catch (error) {
            // ຖ້າເກີດ Error ໃຫ້ Rollback ຂໍ້ມູນທັງໝົດ
            if (!options.transaction) {
                await transaction.rollback();
            }
            logger.error(`Error updating delivery receipt: ${(error as Error).message}`);
            throw error;
        }
    }
}
export default new DeliveryReceiptRepository();