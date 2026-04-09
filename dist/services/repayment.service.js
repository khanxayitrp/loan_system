"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const repayment_repo_1 = __importDefault(require("../repositories/repayment.repo"));
const redis_service_1 = __importDefault(require("./redis.service"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const auditLogger_1 = require("../utils/auditLogger");
class RepaymentService {
    async processPayment(data, receivedBy) {
        const transaction = await init_models_1.db.sequelize.transaction();
        try {
            // ==========================================
            // 🛡️ ດ່ານທີ 1: Data Integrity Check (ກວດສອບຕົວເລກ)
            // ==========================================
            const calculatedTotal = Number(data.paid_principal || 0) + Number(data.paid_interest || 0) + Number(data.paid_penalty || 0) - Number(data.discount_amount || 0);
            if (Math.abs(calculatedTotal - Number(data.total_paid)) > 1) { // ຍອມໃຫ້ຜິດພາດໄດ້ແຄ່ 1 ກີບ (ເລື່ອງການປັດເສດ)
                throw new errors_1.BadRequestError('ຂໍ້ມູນຍອດເງິນບໍ່ກົງກັນ ກະລຸນາກວດສອບໃໝ່');
            }
            let channel = 'cash_at_branch';
            if (data.payment_method === 'transfer')
                channel = 'bank_transfer';
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
            const newReceipt = await repayment_repo_1.default.createReceipt(transactionData, transaction);
            // ==========================================
            // 🔴 ດ່ານທີ 2: ກໍລະນີປິດບັນຊີ (Early Payoff)
            // ==========================================
            if (data.is_early_payoff) {
                // ເຊັກວ່າປິດບັນຊີໄປແລ້ວຫຼືຍັງ
                const loan = await init_models_1.db.loan_applications.findByPk(data.application_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (loan?.status === 'completed')
                    throw new errors_1.BadRequestError('ສັນຍານີ້ຖືກປິດບັນຊີໄປແລ້ວ ບໍ່ສາມາດຊຳລະຊ້ຳໄດ້!');
                // ອັບເດດທຸກງວດທີ່ເຫຼືອໃຫ້ເປັນ Paid
                await repayment_repo_1.default.markAllRemainingAsPaid(data.application_id, transaction);
                // ປິດສັນຍາເງິນກູ້
                await repayment_repo_1.default.updateLoanStatus(data.application_id, 'completed', transaction);
                logger_1.logger.info(`Application ${data.application_id} has been fully PAID OFF by user ${receivedBy}`);
            }
            // ==========================================
            // 🟢 ດ່ານທີ 3: ກໍລະນີຈ່າຍປົກກະຕິ ຫຼື ຈ່າຍບາງສ່ວນ (Partial)
            // ==========================================
            else {
                if (!data.schedule_id)
                    throw new errors_1.BadRequestError('ບໍ່ພົບຂໍ້ມູນງວດທີ່ຕ້ອງການຊຳລະ');
                // ດຶງຂໍ້ມູນງວດ ແລະ ບັງຄັບ Lock ຫ້າມຄົນອື່ນແກ້ໄຂພ້ອມກັນ (Row-level Lock)
                const schedule = await init_models_1.db.repayments.findByPk(data.schedule_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (!schedule)
                    throw new errors_1.BadRequestError('ບໍ່ພົບຕາຕະລາງຊຳລະທີ່ລະບຸ');
                // 🛡️ ປ້ອງກັນການຈ່າຍຊ້ຳ (Double Payment Guard)
                if (schedule.payment_status === 'paid') {
                    throw new errors_1.BadRequestError(`ງວດທີ ${schedule.installment_no} ໄດ້ຖືກຊຳລະສຳເລັດໄປແລ້ວ!`);
                }
                // 💡 ຄຳນວນຍອດເງິນທີ່ຈ່າຍເຂົ້າມາທຽບກັບຍອດທີ່ຕ້ອງຈ່າຍ
                const newPaidPrincipal = (Number(schedule.paid_principal) || 0) + Number(data.paid_principal || 0);
                const newPaidInterest = (Number(schedule.paid_interest) || 0) + Number(data.paid_interest || 0);
                const totalPaidForThisSchedule = newPaidPrincipal + newPaidInterest + Number(data.paid_penalty || 0) + Number(data.discount_amount || 0);
                const totalDue = Number(schedule.total_due) + Number(schedule.penalty || 0);
                // 🟢 ບັງຄັບ Type ໃຫ້ມັນຮູ້ຈັກ 'paid' ຢ່າງຊັດເຈນ
                let newStatus = schedule.payment_status;
                if (totalPaidForThisSchedule >= totalDue) {
                    newStatus = 'paid';
                }
                else if (totalPaidForThisSchedule > 0 && totalPaidForThisSchedule < totalDue) {
                    newStatus = 'partial';
                }
                // 🔄 ອັບເດດງວດນັ້ນ
                await repayment_repo_1.default.updateRepayment(schedule.id, {
                    paid_principal: newPaidPrincipal,
                    paid_interest: newPaidInterest,
                    payment_status: newStatus,
                    paid_at: newStatus === 'paid' ? new Date() : schedule.paid_at
                }, transaction);
                // 🔍 ເຊັກຕື່ມ: ຖ້າງວດນີ້ຈ່າຍຄົບ ແລ້ວເປັນງວດສຸດທ້າຍຂອງສັນຍາ ໃຫ້ປິດສັນຍາເລີຍ
                if (newStatus === 'paid') {
                    const allSchedules = await repayment_repo_1.default.findRepaymentsByApplicationId(data.application_id);
                    // ກວດສອບວ່າງວດອື່ນໆເປັນ paid ໝົດຫຼືຍັງ (ຍົກເວັ້ນງວດປັດຈຸບັນທີ່ເຮົາຫາແຕ່ອັບເດດ)
                    const allPaid = allSchedules.every(s => s.id === schedule.id ? true : s.payment_status === 'paid');
                    if (allPaid) {
                        await repayment_repo_1.default.updateLoanStatus(data.application_id, 'completed', transaction);
                    }
                }
            }
            // 🟢 ບັນທຶກ Audit Log
            await (0, auditLogger_1.logAudit)('payment_transactions', data.application_id, 'CREATE', null, transactionData, receivedBy, transaction);
            await transaction.commit();
            await redis_service_1.default.del(`cache:repayment_schedule:${data.application_id}`);
            return newReceipt;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error(`Error processing payment for App ${data.application_id}: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new RepaymentService();
