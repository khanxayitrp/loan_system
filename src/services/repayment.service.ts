import { db } from '../models/init-models';
import repaymentRepo from '../repositories/repayment.repo';
import redisService from './redis.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';

class RepaymentService {

    public async processPayment(data: any, receivedBy: number) {
        const transaction = await db.sequelize.transaction();

        try {
            // ==========================================
            // 🛡️ ດ່ານທີ 1: Data Integrity Check (ກວດສອບຕົວເລກ)
            // ==========================================
            const calculatedTotal = Number(data.paid_principal || 0) + Number(data.paid_interest || 0) + Number(data.paid_penalty || 0) - Number(data.discount_amount || 0);

            if (Math.abs(calculatedTotal - Number(data.total_paid)) > 1) { // ຍອມໃຫ້ຜິດພາດໄດ້ແຄ່ 1 ກີບ (ເລື່ອງການປັດເສດ)
                throw new BadRequestError('ຂໍ້ມູນຍອດເງິນບໍ່ກົງກັນ ກະລຸນາກວດສອບໃໝ່');
            }

            let channel = 'cash_at_branch';
            if (data.payment_method === 'transfer') channel = 'bank_transfer';

            const transactionData = {
                application_id: data.application_id,
                schedule_id: data.schedule_id || null,
                amount_paid: data.total_paid,
                transaction_type: data.is_early_payoff ? 'closing' : 'installment',
                payment_channel: channel,
                payment_method: data.reference_number || 'Cash',
                paid_at: data.payment_date ? new Date(data.payment_date) : new Date(),
                recorded_by: receivedBy,
                remarks: data.remarks
            };

            const newReceipt = await repaymentRepo.createReceipt(transactionData, transaction);

            // ==========================================
            // 🔴 ດ່ານທີ 2: ກໍລະນີປິດບັນຊີ (Early Payoff)
            // ==========================================
            if (data.is_early_payoff) {
                // ເຊັກວ່າປິດບັນຊີໄປແລ້ວຫຼືຍັງ
                const loan = await db.loan_applications.findByPk(data.application_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (loan?.status === 'completed') throw new BadRequestError('ສັນຍານີ້ຖືກປິດບັນຊີໄປແລ້ວ ບໍ່ສາມາດຊຳລະຊ້ຳໄດ້!');

                // ອັບເດດທຸກງວດທີ່ເຫຼືອໃຫ້ເປັນ Paid
                await repaymentRepo.markAllRemainingAsPaid(data.application_id, transaction);
                // ປິດສັນຍາເງິນກູ້
                await repaymentRepo.updateLoanStatus(data.application_id, 'completed', transaction);

                logger.info(`Application ${data.application_id} has been fully PAID OFF by user ${receivedBy}`);
            }
            // ==========================================
            // 🟢 ດ່ານທີ 3: ກໍລະນີຈ່າຍປົກກະຕິ ຫຼື ຈ່າຍບາງສ່ວນ (Partial)
            // ==========================================
            else {
                if (!data.schedule_id) throw new BadRequestError('ບໍ່ພົບຂໍ້ມູນງວດທີ່ຕ້ອງການຊຳລະ');

                // ດຶງຂໍ້ມູນງວດ ແລະ ບັງຄັບ Lock ຫ້າມຄົນອື່ນແກ້ໄຂພ້ອມກັນ (Row-level Lock)
                const schedule = await db.repayments.findByPk(data.schedule_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (!schedule) throw new BadRequestError('ບໍ່ພົບຕາຕະລາງຊຳລະທີ່ລະບຸ');

                // 🛡️ ປ້ອງກັນການຈ່າຍຊ້ຳ (Double Payment Guard)
                if (schedule.payment_status === 'paid') {
                    throw new BadRequestError(`ງວດທີ ${schedule.installment_no} ໄດ້ຖືກຊຳລະສຳເລັດໄປແລ້ວ!`);
                }

                // 💡 ຄຳນວນຍອດເງິນທີ່ຈ່າຍເຂົ້າມາທຽບກັບຍອດທີ່ຕ້ອງຈ່າຍ
                const newPaidPrincipal = (Number(schedule.paid_principal) || 0) + Number(data.paid_principal || 0);
                const newPaidInterest = (Number(schedule.paid_interest) || 0) + Number(data.paid_interest || 0);

                const totalPaidForThisSchedule = newPaidPrincipal + newPaidInterest + Number(data.paid_penalty || 0) + Number(data.discount_amount || 0);
                const totalDue = Number(schedule.total_due) + Number(schedule.penalty || 0);

                // 🟢 ບັງຄັບ Type ໃຫ້ມັນຮູ້ຈັກ 'paid' ຢ່າງຊັດເຈນ
                let newStatus: 'unpaid' | 'partial' | 'paid' | 'overdue' = schedule.payment_status as any;
                if (totalPaidForThisSchedule >= totalDue) {
                    newStatus = 'paid';
                } else if (totalPaidForThisSchedule > 0 && totalPaidForThisSchedule < totalDue) {
                    newStatus = 'partial';
                }

                // 🔄 ອັບເດດງວດນັ້ນ
                await repaymentRepo.updateRepayment(schedule.id, {
                    paid_principal: newPaidPrincipal,
                    paid_interest: newPaidInterest,
                    payment_status: newStatus as any,
                    paid_at: newStatus === 'paid' ? new Date() : schedule.paid_at
                }, transaction);

                // 🔍 ເຊັກຕື່ມ: ຖ້າງວດນີ້ຈ່າຍຄົບ ແລ້ວເປັນງວດສຸດທ້າຍຂອງສັນຍາ ໃຫ້ປິດສັນຍາເລີຍ
                if (newStatus === 'paid') {
                    const allSchedules = await repaymentRepo.findRepaymentsByApplicationId(data.application_id);
                    // ກວດສອບວ່າງວດອື່ນໆເປັນ paid ໝົດຫຼືຍັງ (ຍົກເວັ້ນງວດປັດຈຸບັນທີ່ເຮົາຫາແຕ່ອັບເດດ)
                    const allPaid = allSchedules.every(s => s.id === schedule.id ? true : s.payment_status === 'paid');
                    if (allPaid) {
                        await repaymentRepo.updateLoanStatus(data.application_id, 'completed', transaction);
                    }
                }
            }

            // 🟢 ບັນທຶກ Audit Log
            await logAudit('payment_transactions', data.application_id, 'CREATE', null, transactionData, receivedBy, transaction);

            await transaction.commit();
            await redisService.del(`cache:repayment_schedule:${data.application_id}`);

            return newReceipt;

        } catch (error) {
            await transaction.rollback();
            logger.error(`Error processing payment for App ${data.application_id}: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new RepaymentService();