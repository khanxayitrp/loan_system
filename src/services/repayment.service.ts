import { db } from '../models/init-models';
import repaymentRepo from '../repositories/repayment.repo';
import redisService from './redis.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';
import { Op } from 'sequelize';

class RepaymentService {

    public async processPayment(data: any, receivedBy: number) {
        const transaction = await db.sequelize.transaction();

        try {
            const applicationId = data.application_id;
            
            // 🟢 รับแค่ยอดเงินรวมที่ลูกค้าจ่ายมาจริง (ไม่ต้องสนใจการแยกยอดจาก Frontend)
            let remaining_cash = Number(data.amount_paid || 0);
            let remaining_discount = Number(data.discount_amount || 0);

            if (remaining_cash <= 0 && remaining_discount <= 0) {
                throw new BadRequestError('ຍອດເງິນຊຳລະຕ້ອງຫຼາຍກວ່າ 0');
            }

            // Lock Application ປ້ອງກັນການຈ່າຍຊ້ຳຊ້ອນ
            const loan = await db.loan_applications.findByPk(applicationId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!loan) throw new BadRequestError('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ');
            if (loan.status === 'completed') throw new BadRequestError('ສັນຍານີ້ຖືກປິດບັນຊີໄປແລ້ວ!');

            let channel = data.payment_method === 'transfer' ? 'bank_transfer' : 'cash_at_branch';

            // ==========================================
            // 🔴 ກໍລະນີປິດບັນຊີກ່ອນກຳນົດ (Early Payoff)
            // ==========================================
            if (data.is_early_payoff) {
                const payoffInfo = await repaymentRepo.calculateEarlyPayoff(applicationId);
                if (!payoffInfo) throw new BadRequestError('ບໍ່ມີຍອດຄົງຄ້າງສຳລັບການປິດບັນຊີ');

                const totalRequired = payoffInfo.total_payoff_amount - remaining_discount;
                
                // ເຊັກວ່າຍອດທີ່ຈ່າຍມາ ພໍສຳລັບປິດບັນຊີແທ້ຫຼືບໍ່ (ອະນຸຍາດໃຫ້ຫຼຸດກັນໄດ້ 1 ກີບ ກໍລະນີປັດເສດ)
                if (remaining_cash < (totalRequired - 1)) {
                    throw new BadRequestError(`ຍອດເງິນບໍ່ພຽງພໍສຳລັບປິດບັນຊີ. ຕ້ອງຈ່າຍ: ${totalRequired} ກີບ`);
                }

                // ອັບເດດທຸກງວດທີ່ເຫຼືອໃຫ້ເປັນ Paid ແລະ ຍັດຍອດເງິນຕົ້ນ/ດອກເບ້ຍ ໃຫ້ເຕັມ
                await repaymentRepo.processEarlyPayoffSettlement(applicationId, transaction);
                await repaymentRepo.updateLoanStatus(applicationId, 'completed', transaction);

                logger.info(`App ${applicationId} PAID OFF by user ${receivedBy}`);
            } 
            // ==========================================
            // 🟢 ກໍລະນີຈ່າຍປົກກະຕິ - ລະບົບຕັດນ້ຳຕົກ (Waterfall & FIFO)
            // ==========================================
            else {
                // 1. ດຶງຕາຕະລາງທີ່ຍັງຄ້າງທັງໝົດ ມາລຽງຈາກເກົ່າໄປໃໝ່ (FIFO)
                const unpaidSchedules = await db.repayments.findAll({
                    where: { 
                        application_id: applicationId,
                        payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] }
                    },
                    order: [['installment_no', 'ASC']],
                    lock: transaction.LOCK.UPDATE, // Lock row
                    transaction
                });

                if (unpaidSchedules.length === 0) {
                    throw new BadRequestError('ບໍ່ມຍອດຄົງຄ້າງສຳລັບສັນຍານີ້');
                }

                // 2. ວົນ Loop ຕັດເງິນເທື່ອລະງວດ (Waterfall Algorithm)
                for (const schedule of unpaidSchedules) {
                    if (remaining_cash <= 0 && remaining_discount <= 0) break; // ຖ້າເງິນໝົດແລ້ວ ໃຫ້ຢຸດ Loop

                    // ດຶງຍອດໜີ້ທີ່ຄ້າງຂອງງວດນີ້ (Unpaid Balances)
                    // (ໝາຍເຫດ: ຖ້າ DB ບໍ່ມີຊ່ອງ paid_penalty, ເຮົາຈະສົມມຸດວ່າ penalty ຖືກຫັກກ່ອນໝູ່)
                    let unpaid_penalty = Number(schedule.penalty || 0); 
                    let unpaid_interest = Number(schedule.interest_amount) - Number(schedule.paid_interest || 0);
                    let unpaid_principal = Number(schedule.principal_amount) - Number(schedule.paid_principal || 0);

                    // --- STEP A: ຕັດສ່ວນຫຼຸດ (Discount) ໃສ່ຄ່າປັບໃໝ ຫຼື ດອກເບ້ຍກ່ອນ ---
                    if (remaining_discount > 0) {
                        const discountToPenalty = Math.min(remaining_discount, unpaid_penalty);
                        unpaid_penalty -= discountToPenalty;
                        remaining_discount -= discountToPenalty;
                    }

                    // --- STEP B: ຕັດເງິນສົດໃສ່ຄ່າປັບໃໝ (Penalty) ---
                    const pay_penalty = Math.min(remaining_cash, unpaid_penalty);
                    remaining_cash -= pay_penalty;
                    unpaid_penalty -= pay_penalty;

                    // --- STEP C: ຕັດເງິນສົດໃສ່ດອກເບ້ຍ (Interest) ---
                    const pay_interest = Math.min(remaining_cash, unpaid_interest);
                    remaining_cash -= pay_interest;
                    const new_paid_interest = Number(schedule.paid_interest || 0) + pay_interest;

                    // --- STEP D: ຕັດເງິນສົດໃສ່ຕົ້ນທຶນ (Principal) ---
                    const pay_principal = Math.min(remaining_cash, unpaid_principal);
                    remaining_cash -= pay_principal;
                    const new_paid_principal = Number(schedule.paid_principal || 0) + pay_principal;

                    // ກຳນົດ Status ໃໝ່
                    let newStatus: 'unpaid' | 'partial' | 'paid' | 'overdue' = schedule.payment_status as any;
                    
                    // ຖ້າຈ່າຍຕົ້ນທຶນ ແລະ ດອກເບ້ຍຄົບແລ້ວ ຖືວ່າປິດງວດນີ້
                    if (new_paid_principal >= Number(schedule.principal_amount) && 
                        new_paid_interest >= Number(schedule.interest_amount)) {
                        newStatus = 'paid';
                    } else if (new_paid_principal > 0 || new_paid_interest > 0) {
                        newStatus = 'partial';
                    }

                    // ອັບເດດລົງ Database
                    await repaymentRepo.updateRepayment(schedule.id, {
                        paid_principal: new_paid_principal,
                        paid_interest: new_paid_interest,
                        // ຖ້າຢາກເກັບ paid_penalty ຕ້ອງເພີ່ມ column ໃນ DB, ແຕ່ຕອນນີ້ເຮົາຂ້າມໄປກ່ອນ
                        payment_status: newStatus as any,
                        paid_at: newStatus === 'paid' ? new Date() : schedule.paid_at
                    }, transaction);
                }

                // 3. ຫຼັງຈາກ Loop ຖ້າຕາຕະລາງທັງໝົດກາຍເປັນ paid ແລ້ວ ໃຫ້ປິດສັນຍາ
                const checkAll = await db.repayments.count({
                    where: { 
                        application_id: applicationId,
                        payment_status: { [Op.ne]: 'paid' } // ຫານັບອັນທີ່ຍັງບໍ່ຈ່າຍ
                    },
                    transaction
                });

                if (checkAll === 0) {
                    await repaymentRepo.updateLoanStatus(applicationId, 'completed', transaction);
                }
            }

            // 🟢 ບັນທຶກໃບບິນ (Receipt/Ledger) ໂດຍເກັບຍອດລວມ
            const transactionData = {
                application_id: applicationId,
                schedule_id: data.schedule_id || null,
                amount_paid: data.amount_paid, // ເກັບຍອດລວມທີ່ຮັບມາ
                transaction_type: data.is_early_payoff ? 'closing' : 'installment',
                payment_channel: channel,
                payment_method: data.reference_number || 'Cash',
                paid_at: data.payment_date ? new Date(data.payment_date) : new Date(),
                recorded_by: receivedBy,
                remarks: data.remarks || (remaining_cash > 0 ? `ມຍອດເງິນທອນ/ຈ່າຍເກີນ: ${remaining_cash}` : '')
            };

            const newReceipt = await repaymentRepo.createReceipt(transactionData, transaction);

            // 🟢 Audit Log
            await logAudit('payment_transactions', applicationId, 'CREATE', null, transactionData, receivedBy, transaction);

            await transaction.commit();
            await redisService.del(`cache:repayment_schedule:${applicationId}`);

            return { receipt: newReceipt, change: remaining_cash }; // ຖ້າ remaining_cash > 0 ຄືເງິນທອນ

        } catch (error) {
            await transaction.rollback();
            logger.error(`Error processing payment: ${(error as Error).message}`);
            throw error;
        }
    }

    // ==========================================
    // 🟢 ອັບເດດ URL ຫຼັກຖານການໂອນເງິນລົງ Database
    // ==========================================
    public async updateProofUrl(transactionId: number, fileUrl: string, userId: number) {
        const transaction = await db.sequelize.transaction();
        
        try {
            // 1. ຄົ້ນຫາ Transaction
            const paymentTx = await db.payment_transactions.findByPk(transactionId, { 
                transaction,
                lock: transaction.LOCK.UPDATE 
            });
            
            if (!paymentTx) {
                throw new BadRequestError('ບໍ່ພົບຂໍ້ມູນການຊຳລະເງິນນີ້ໃນລະບົບ');
            }

            const oldData = paymentTx.toJSON();

            // 2. ອັບເດດ URL ລົງໃນ proof_url
            const updatedTx = await paymentTx.update({ 
                proof_url: fileUrl 
            } as any, { transaction });

            // 3. ບັນທຶກ Audit Log
            await logAudit(
                'payment_transactions', 
                paymentTx.application_id, 
                'UPDATE', 
                oldData, 
                updatedTx.toJSON(), 
                userId, 
                transaction
            );

            await transaction.commit();
            return updatedTx;

        } catch (error) {
            await transaction.rollback();
            logger.error(`Error updating proof URL for TX ${transactionId}: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new RepaymentService();