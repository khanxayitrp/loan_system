import { delivery_receipts, delivery_receiptsAttributes, delivery_receiptsCreationAttributes } from "../models/delivery_receipts";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

class DeliveryReceiptRepository {
    async createDeliveryReceipt(data: delivery_receiptsCreationAttributes, options: {transaction?: any} = {}): Promise<delivery_receipts> {
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
                // where: { application_id: cleanDeliveryReceipt.application_id },
                order: [['created_at', 'DESC']],
                attributes: ['receipts_id'],
             transaction });
                let receiptId: string;
             if (last_receipt) {
                const lastIdNum = parseInt(last_receipt.receipts_id.split('-')[1], 10);
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
            const newDeliveryReceipt = await db.delivery_receipts.create(mapData, {transaction});
            // บันทึกทุกอย่างลง Database
            await transaction.commit();
            logger.info(`Delivery receipt created with ID: ${newDeliveryReceipt.id}`);
            return newDeliveryReceipt;

        } catch (error) {
            await transaction.rollback();
            logger.error(`Error creating delivery receipt: ${(error as Error).message}`);
            throw error;
        }
    }

    async findDeliveryReceiptById(deliveryReceiptId: number): Promise<delivery_receipts | null> {
        return await db.delivery_receipts.findByPk(deliveryReceiptId);
    }
    async findDeliveryReceiptsByApplicationId(applicationId: number): Promise<delivery_receipts[]> {
        return await db.delivery_receipts.findAll({ where: { application_id: applicationId } });
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
    async updateDeliveryReceipt(deliveryReceiptId: number, data: Partial<delivery_receiptsAttributes>, options: {transaction?: any} = {}): Promise<delivery_receipts | null> {
        const transaction = options.transaction || await db.sequelize.transaction();
        try {
            const deliveryReceipt = await this.findDeliveryReceiptById(deliveryReceiptId);
            if (!deliveryReceipt) {
                logger.error(`Delivery receipt with ID: ${deliveryReceiptId} not found`);
                return null;
            }
            if (!options.transaction) {
                await transaction.commit();
            }
            let receipts_status = "pending";
            if (data.status && !['pending', 'approved', 'rejected'].includes(data.status)) {
                throw new Error('Invalid status value');
            }
            if (data.receipt_image_url) {
                receipts_status = 'approved';
            }

            const mapData: any = {
                receiver_name: data.receiver_name,
                delivery_date: data.delivery_date,
                receipt_image_url: data.receipt_image_url,  
                status: receipts_status,
                approver_id: data.approver_id,
                approved_at: new Date(),
                remark: data.remark || null,
            }


            const updatedDeliveryReceipt = await deliveryReceipt.update(mapData, { transaction });
            await transaction.commit();
            logger.info(`Delivery receipt updated with ID: ${updatedDeliveryReceipt.id}`);
            return updatedDeliveryReceipt;
        } catch (error) {
            await transaction.rollback();
            logger.error(`Error updating delivery receipt: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new DeliveryReceiptRepository();