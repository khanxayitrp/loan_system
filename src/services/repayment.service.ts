import { db } from '../models/init-models';
import repaymentRepo from '../repositories/repayment.repo';
import redisService from './redis.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';
import { Op } from 'sequelize';
import NotificationService from './notification.service';
import { CreateNotificationInput, RecipientType, NotificationEventType } from '../types/notification';

class RepaymentService {

    public async processPayment(data: any, receivedBy: number) {
        const transaction = await db.sequelize.transaction();

        try {
            const applicationId = data.application_id;

            // 1. ກວດສອບຍອດເງິນ
            let remaining_cash = Number(data.amount_paid || 0);
            let remaining_discount = Number(data.discount_amount || 0);

            if (remaining_cash <= 0 && remaining_discount <= 0) {
                throw new BadRequestError('ຍອດເງິນຊຳລະຕ້ອງຫຼາຍກວ່າ 0');
            }

            // 2. Lock Application & ດຶງຂໍ້ມູນລູກຄ້າ ແລະ ສິນຄ້າ (ສຳລັບສົ່ງແຈ້ງເຕືອນ)
            const loan = await db.loan_applications.findByPk(applicationId, {
                include: [
                    { model: db.customers, as: 'customer' },
                    { model: db.products, as: 'product' } // 🌟 ດຶງ Product ມາເພື່ອແຈ້ງເຕືອນ Case 4 (ຜ່ອນຄົບ)
                ],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!loan) throw new BadRequestError('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ');
            if (loan.status === 'completed') throw new BadRequestError('ສັນຍານີ້ຖືກປິດບັນຊີໄປແລ້ວ!');

            const channel = data.payment_method === 'transfer' ? 'bank_transfer' : 'cash_at_branch';
            let isCompleted = false;

            let final_schedule_id = data.schedule_id;
            let paymentAllocation = null;

            // ==========================================
            // 🌟 3. ແຍກໄປເຮັດວຽກຕາມປະເພດການຈ່າຍ
            // ==========================================
            if (data.is_early_payoff) {
                const result = await this.processEarlyPayoff(applicationId, remaining_cash, remaining_discount, data, receivedBy, transaction);
                remaining_cash = result.remaining_cash;
                isCompleted = result.isCompleted;
                final_schedule_id = null; // ປິດບັນຊີ ບໍ່ຈຳເປັນຕ້ອງມີ ID ງວດ
            } else {
                // 🚀 ສົ່ງ schedule_id ໄປກວດສອບ Strict FIFO
                const result = await this.processNormalPayment(applicationId, remaining_cash, remaining_discount, data.schedule_id, transaction);
                remaining_cash = result.remaining_cash;
                isCompleted = result.isCompleted;
                // 🌟 ເອົາ ID ທີ່ຖືກ Auto-correct ມາໃຊ້ແທນ
                final_schedule_id = result.actual_paid_schedule_id;
                paymentAllocation = result.allocation; // 🌟 ຮັບຄ່າການຈັດສັນ
            }

            // ==========================================
            // 4. ບັນທຶກໃບບິນ (Receipt/Ledger)
            // ==========================================
            // 🌟 ສ້າງ Object ສຳລັບເກັບລາຍລະອຽດໄວ້ໃນ Remarks ເປັນ JSON
            let finalRemarks = data.remarks || '';
            if (paymentAllocation) {
                // ຖ້າມີການຈ່າຍປົກກະຕິ ໃຫ້ເອົາ Allocation ມາລວມກັບ Note ອື່ນໆ ແລ້ວແປງເປັນ JSON String
                const remarkObj = {
                    ...paymentAllocation,
                    note: data.remarks || (remaining_cash > 0 ? `ມີຍອດເງິນທອນ/ຈ່າຍເກີນ: ${remaining_cash}` : ''),
                    change_amount: remaining_cash // ເກັບຍອດເງິນທອນໄວ້ນຳເຜື່ອຢາກໃຊ້
                };
                finalRemarks = JSON.stringify(remarkObj);
            } else if (data.is_early_payoff) {
                const remarkObj = {
                    note: data.remarks || 'ປິດບັນຊີກ່ອນກຳນົດ (Early Payoff)',
                    change_amount: remaining_cash
                };
                finalRemarks = JSON.stringify(remarkObj);
            } else if (remaining_cash > 0) {
                finalRemarks = `ມີຍອດເງິນທອນ/ຈ່າຍເກີນ: ${remaining_cash}`;
            }


            const transactionData = {
                application_id: applicationId,
                schedule_id: final_schedule_id, // 🌟 ໃຊ້ຕົວນີ້ບັນທຶກລົງ Database
                amount_paid: data.amount_paid,
                transaction_type: data.is_early_payoff ? 'closing' : 'installment',
                payment_channel: channel,
                payment_method: data.reference_number || 'Cash',
                paid_at: data.payment_date ? new Date(data.payment_date) : new Date(),
                recorded_by: receivedBy,
                remarks: finalRemarks // 🌟 ໃຊ້ finalRemarks ທີ່ເຮົາຈັດຮູບແບບເປັນ JSON ແລ້ວ
            };

            const newReceipt = await repaymentRepo.createReceipt(transactionData, transaction);
            await logAudit('payment_transactions', applicationId, 'CREATE', null, transactionData, receivedBy, transaction);

            // 5. Commit ຂໍ້ມູນທຸກຢ່າງລົງ Database
            await transaction.commit();
            await redisService.del(`cache:repayment_schedule:${applicationId}`);

            // ==========================================
            // 🌟 6. ສົ່ງ Notification ຫຼັງຈາກ Commit ສຳເລັດ
            // ==========================================
            try {
                if (loan && loan.customer) {
                    const customerId = loan.customer.id;
                    const customerPhone = loan.customer.phone;
                    const formattedAmount = new Intl.NumberFormat('lo-LA').format(data.amount_paid);
                    const loanNumber = loan.loan_id || applicationId;

                    if (isCompleted) {
                        // --- CASE 4: ຜ່ອນຊຳລະຄົບແລ້ວ (ປິດບັນຊີ) ---
                        const productName = loan.product?.product_name || 'ສິນຄ້າ';
                        const totalInstallments = loan.loan_period;

                        await NotificationService.sendNotification({
                            recipient_type: RecipientType.CUSTOMER,
                            recipient_id: customerId,
                            event_type: NotificationEventType.PAYMENT_COMPLETED,
                            title: 'ຜ່ອນຊຳລະຄົບແລ້ວ 🎉',
                            body: `ທ່ານໄດ້ຊຳລະ ${productName} ຄົບ ${totalInstallments} ງວດແລ້ວ ສິນຄ້າເປັນຂອງທ່ານສົມບູນ`,
                            reference_type: 'loan_applications',
                            reference_id: applicationId,
                        });
                    } else {
                        // --- ປົກກະຕິ: ຊຳລະເງິນສຳເລັດ ---
                        await NotificationService.sendNotification({
                            recipient_type: RecipientType.CUSTOMER,
                            recipient_id: customerId,
                            event_type: NotificationEventType.PAYMENT_SUCCESS,
                            title: 'ຊຳລະເງິນສຳເລັດ',
                            body: `ລະບົບໄດ້ຮັບຍອດຊຳລະຈຳນວນ ${formattedAmount} ກີບ ສຳລັບສິນເຊື່ອເລກທີ ${loanNumber} ຮຽບຮ້ອຍແລ້ວ. ຂອບໃຈທີ່ໃຊ້ບໍລິການ.`,
                            reference_type: 'payment_transactions',
                            reference_id: newReceipt.id,
                            data: {
                                paid_amount: formattedAmount,
                                month_payment: data.month_payment,
                                paid_at: transactionData.paid_at,
                                payment_channel: channel,
                            }
                        });
                    }

                    // ສົ່ງ SMS (Fire and Forget)
                    if (customerPhone) {
                        const smsMessage = `INSEE: ໄດ້ຮັບຍອດຊຳລະ ${formattedAmount} ₭ ສຳລັບສັນຍາ ${loanNumber} ສຳເລັດແລ້ວ.`;
                        NotificationService.sendSMS(customerPhone, smsMessage).catch(err => {
                            logger.error(`[Repayment] SMS send failed for Tx ${newReceipt.id}: ${err.message}`);
                        });
                    }
                }
            } catch (notifError) {
                logger.error(`[Repayment] Failed to send notification for App ${applicationId}: ${(notifError as Error).message}`);
            }

            return { receipt: newReceipt, change: remaining_cash };

        } catch (error) {
            await transaction.rollback();
            logger.error(`Error processing payment: ${(error as Error).message}`);
            throw error;
        }
    }


    // ==========================================
    // 🔴 PRIVATE: ປະມວນຜົນ ປິດບັນຊີກ່ອນກຳນົດ (Early Payoff)
    // ==========================================
    private async processEarlyPayoff(
        applicationId: number,
        remaining_cash: number,
        remaining_discount: number,
        data: any,
        receivedBy: number,
        transaction: any
    ) {
        const unpaidSchedules = await db.repayments.findAll({
            where: {
                application_id: applicationId,
                payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] }
            },
            order: [['installment_no', 'ASC']],
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (unpaidSchedules.length === 0) {
            throw new BadRequestError('ບໍ່ມີຍອດຄົງຄ້າງສຳລັບການປິດບັນຊີ');
        }

        let interestMonthsToCharge = 0;
        if (data.payoff_interest_months !== undefined && data.payoff_interest_months !== null) {
            interestMonthsToCharge = Number(data.payoff_interest_months);
        } else {
            interestMonthsToCharge = unpaidSchedules.length > 6 ? 5 : unpaidSchedules.length;
        }

        let totalExpectedPrincipal = 0;
        let totalExpectedInterest = 0;
        let totalExpectedPenalty = 0;

        for (let i = 0; i < unpaidSchedules.length; i++) {
            const sch = unpaidSchedules[i];
            totalExpectedPrincipal += Number(sch.principal_amount) - Number(sch.paid_principal || 0);
            totalExpectedPenalty += Number(sch.penalty || 0) - Number(sch.paid_penalty || 0);
            if (i < interestMonthsToCharge) {
                totalExpectedInterest += Number(sch.interest_amount) - Number(sch.paid_interest || 0);
            }
        }

        const totalRequired = Math.max(0, (totalExpectedPrincipal + totalExpectedInterest + totalExpectedPenalty) - remaining_discount);

        if (remaining_cash < (totalRequired - 1)) {
            throw new BadRequestError(`ຍອດເງິນບໍ່ພຽງພໍສຳລັບປິດບັນຊີ. ຕ້ອງຈ່າຍ: ${totalRequired} ກີບ (ຮັບມາ: ${remaining_cash} ກີບ)`);
        }

        for (let i = 0; i < unpaidSchedules.length; i++) {
            const sch = unpaidSchedules[i];
            let pay_principal = Number(sch.principal_amount) - Number(sch.paid_principal || 0);
            let pay_penalty = Number(sch.penalty || 0) - Number(sch.paid_penalty || 0);
            let pay_interest = 0;

            if (i < interestMonthsToCharge) {
                pay_interest = Number(sch.interest_amount) - Number(sch.paid_interest || 0);
            }

            await repaymentRepo.updateRepayment(sch.id, {
                paid_principal: Number(sch.paid_principal || 0) + pay_principal,
                paid_interest: Number(sch.paid_interest || 0) + pay_interest,
                paid_penalty: Number(sch.paid_penalty || 0) + pay_penalty,
                payment_status: 'paid',
                paid_at: new Date()
            }, transaction);
        }

        await repaymentRepo.updateLoanStatus(applicationId, 'completed', transaction);
        remaining_cash -= totalRequired;

        logger.info(`App ${applicationId} PAID OFF by user ${receivedBy}. Interest charged for ${interestMonthsToCharge} months.`);

        return { remaining_cash, isCompleted: true };
    }


    // ==========================================
    // 🟢 PRIVATE: ປະມວນຜົນ ຈ່າຍປົກກະຕິ (Waterfall / FIFO)
    // ==========================================
    private async processNormalPayment(
        applicationId: number,
        remaining_cash: number,
        remaining_discount: number,
        requested_schedule_id: number | null,
        transaction: any
    ) {
        // 1. ດຶງຕາຕະລາງທີ່ຍັງຄ້າງທັງໝົດ ມາລຽງຈາກເກົ່າໄປໃໝ່ (FIFO)
        const unpaidSchedules = await db.repayments.findAll({
            where: {
                application_id: applicationId,
                payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] }
            },
            order: [['installment_no', 'ASC']],
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (unpaidSchedules.length === 0) {
            throw new BadRequestError('ບໍ່ມີຍອດຄົງຄ້າງສຳລັບສັນຍານີ້');
        }

        // ====================================================
        // 🌟 BEST PRACTICE: Auto-Correct ໃບບິນ
        // ບັງຄັບໃຫ້ໃບບິນ (Receipt) ຜູກກັບງວດທີ່ເກົ່າທີ່ສຸດສະເໝີ
        // ເພື່ອໃຫ້ລຳດັບການບັນທຶກຖືກຕ້ອງ 100% ຕາມຫຼັກການ Waterfall
        // ====================================================
        const oldestUnpaidSchedule = unpaidSchedules[0];
        const actual_paid_schedule_id = oldestUnpaidSchedule.id;

        // 🌟 ສ້າງຕົວແປມາເກັບສະຖິຕິການແບ່ງເງິນສຳລັບໃບບິນນີ້
        let total_principal_allocated = 0;
        let total_interest_allocated = 0;
        let total_penalty_allocated = 0;

        // 2. ວົນ Loop ຕັດເງິນເທື່ອລະງວດ (Waterfall Algorithm)
        for (const schedule of unpaidSchedules) {
            if (remaining_cash <= 0 && remaining_discount <= 0) break;

            let unpaid_penalty = Number(schedule.penalty || 0) - Number(schedule.paid_penalty || 0);
            let unpaid_interest = Number(schedule.interest_amount) - Number(schedule.paid_interest || 0);
            let unpaid_principal = Number(schedule.principal_amount) - Number(schedule.paid_principal || 0);

            if (remaining_discount > 0) {
                const discountToPenalty = Math.min(remaining_discount, unpaid_penalty);
                unpaid_penalty -= discountToPenalty;
                remaining_discount -= discountToPenalty;

                const discountToInterest = Math.min(remaining_discount, unpaid_interest);
                unpaid_interest -= discountToInterest;
                remaining_discount -= discountToInterest;
            }

            const pay_penalty = Math.min(remaining_cash, Math.max(0, unpaid_penalty));
            remaining_cash -= pay_penalty;
            const new_paid_penalty = Number(schedule.paid_penalty || 0) + pay_penalty;
            total_penalty_allocated += pay_penalty;

            const pay_interest = Math.min(remaining_cash, Math.max(0, unpaid_interest));
            remaining_cash -= pay_interest;
            const new_paid_interest = Number(schedule.paid_interest || 0) + pay_interest;
            total_interest_allocated += pay_interest;

            const pay_principal = Math.min(remaining_cash, Math.max(0, unpaid_principal));
            remaining_cash -= pay_principal;
            const new_paid_principal = Number(schedule.paid_principal || 0) + pay_principal;
            total_principal_allocated += pay_principal;

            let newStatus: 'unpaid' | 'partial' | 'paid' | 'overdue' = schedule.payment_status as any;

            const isPrincipalPaid = new_paid_principal >= Number(schedule.principal_amount);
            const isInterestPaid = new_paid_interest >= Number(schedule.interest_amount);
            const isPenaltyPaid = new_paid_penalty >= Number(schedule.penalty || 0);

            if (isPrincipalPaid && isInterestPaid && isPenaltyPaid) {
                newStatus = 'paid';
            } else if (new_paid_principal > 0 || new_paid_interest > 0 || new_paid_penalty > 0) {
                newStatus = 'partial';
            }

            await repaymentRepo.updateRepayment(schedule.id, {
                paid_principal: new_paid_principal,
                paid_interest: new_paid_interest,
                paid_penalty: new_paid_penalty,
                payment_status: newStatus as any,
                paid_at: newStatus === 'paid' ? new Date() : schedule.paid_at
            }, transaction);
        }

        // 3. ເຊັກວ່າຍັງເຫຼືອໜີ້ຄ້າງຫຼືບໍ່
        let isCompleted = false;
        const checkAll = await db.repayments.count({
            where: {
                application_id: applicationId,
                payment_status: { [Op.ne]: 'paid' }
            },
            transaction
        });

        if (checkAll === 0) {
            await repaymentRepo.updateLoanStatus(applicationId, 'completed', transaction);
            isCompleted = true;
        }

        // 🌟 Return actual_paid_schedule_id ກັບຄືນໄປພ້ອມ
        return {
            remaining_cash,
            isCompleted,
            actual_paid_schedule_id,
            allocation: {
                principal_paid: total_principal_allocated,
                interest_paid: total_interest_allocated,
                penalty_paid: total_penalty_allocated
            }
        };
    }


    // ==========================================
    // 🟢 ອັບເດດ URL ຫຼັກຖານການໂອນເງິນລົງ Database
    // ==========================================
    public async updateProofUrl(transactionId: number, fileUrl: string, userId: number) {
        const transaction = await db.sequelize.transaction();

        try {
            const paymentTx = await db.payment_transactions.findByPk(transactionId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!paymentTx) {
                throw new BadRequestError('ບໍ່ພົບຂໍ້ມູນການຊຳລະເງິນນີ້ໃນລະບົບ');
            }

            const oldData = paymentTx.toJSON();

            const updatedTx = await paymentTx.update({
                proof_url: fileUrl
            } as any, { transaction });

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