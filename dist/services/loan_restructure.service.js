"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const errors_1 = require("../utils/errors");
const auditLogger_1 = require("../utils/auditLogger");
const signatureGenerator_1 = require("../utils/signatureGenerator");
const logger_1 = require("../utils/logger");
class LoanRestructureService {
    /**
     * ໂລຈິກສຳລັບການປັບໂຄງສ້າງໜີ້ (Loan Restructuring)
     */
    async processRestructure(applicationId, newScheduleData, performedBy) {
        const transaction = await init_models_1.db.sequelize.transaction();
        try {
            // 1. ກວດສອບສະຖານະຂອງສິນເຊື່ອ (ຕ້ອງເປັນສິນເຊື່ອທີ່ປ່ອຍໄປແລ້ວເທົ່ານັ້ນ)
            const loanApp = await init_models_1.db.loan_applications.findByPk(applicationId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!loanApp)
                throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ');
            if (!['disbursed', 'approved'].includes(loanApp.status || '')) {
                throw new errors_1.BadRequestError('ບໍ່ສາມາດປັບໂຄງສ້າງໜີ້ໄດ້ ເພາະສິນເຊື່ອຍັງບໍ່ທັນປ່ອຍແທ້');
            }
            // 2. ຊອກຫາຕາຕະລາງຜ່ອນ (Version ລ່າສຸດ) ທີ່ກຳລັງໃຊ້ງານຢູ່ (approved)
            const activeSchedule = await init_models_1.db.repayment_schedules.findOne({
                where: {
                    application_id: applicationId,
                    status: 'approved'
                },
                order: [['version', 'DESC']],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!activeSchedule) {
                throw new errors_1.BadRequestError('ບໍ່ພົບຕາຕະລາງຜ່ອນຊຳລະທີ່ກຳລັງໃຊ້ງານຢູ່ (Active Schedule)');
            }
            // 3. 🚫 ກວດສອບ Guardrail: ຖ້າມີຕາຕະລາງທີ່ເປັນ 'draft' ຢູ່ແລ້ວ ໃຫ້ Error
            const existingDraft = await init_models_1.db.repayment_schedules.findOne({
                where: { application_id: applicationId, status: 'draft' },
                transaction
            });
            if (existingDraft) {
                throw new errors_1.BadRequestError('ມີຕາຕະລາງປັບໂຄງສ້າງໜີ້ສະບັບຮ່າງຢູ່ແລ້ວ ກະລຸນາກວດສອບ ຫຼື ຍົກເລີກສະບັບຮ່າງກ່ອນ');
            }
            // ==========================================
            // 🔄 4. ດຳເນີນການອັບເດດຂອງເກົ່າ (Archive Old Data)
            // ==========================================
            const oldScheduleData = activeSchedule.toJSON();
            // 🟢 ອັບເດດສະເພາະຕາຕະລາງຫຼັກ (Header) ໃຫ້ເປັນ 'restructured' 
            // ໂດຍບໍ່ຕ້ອງໄປກວນຕາຕະລາງຍ່ອຍ (repayments) ເພື່ອຮັກສາປະຫວັດເດີມໄວ້
            await activeSchedule.update({ status: 'restructured' }, { transaction });
            // ==========================================
            // ✨ 5. ສ້າງຕາຕະລາງໃໝ່ (Create New Data)
            // ==========================================
            const totalPrincipal = newScheduleData.reduce((sum, row) => sum + Number(row.principal || 0), 0);
            const totalInterest = newScheduleData.reduce((sum, row) => sum + Number(row.interest || 0), 0);
            const nextVersion = Number(activeSchedule.version) + 1;
            // 5.1 ສ້າງຕາຕະລາງ Header ໃໝ່
            const newSchedule = await init_models_1.db.repayment_schedules.create({
                application_id: applicationId,
                version: nextVersion,
                total_principal: totalPrincipal,
                total_interest: totalInterest,
                status: 'draft',
                created_by: performedBy
            }, { transaction });
            // 5.2 ບັນທຶກງວດຍ່ອຍໃໝ່ລົງຕາຕະລາງ Repayments
            const repaymentRecords = newScheduleData.map((row) => ({
                application_id: applicationId,
                schedule_id: newSchedule.id,
                installment_no: row.installment_number,
                due_date: row.due_date,
                principal_amount: Number(row.principal),
                interest_amount: Number(row.interest),
                total_due: Number(row.total_amount),
                remaining_principal: Number(row.remaining_balance),
                payment_status: 'unpaid', // 🟢 ແກ້ Error TS2345: ບອກ TypeScript ວ່າເປັນຄ່າ Enum ແນ່ນອນ
                paid_principal: 0,
                paid_interest: 0
            }));
            await init_models_1.db.repayments.bulkCreate(repaymentRecords, { transaction });
            // ==========================================
            // 📝 6. ຈັດການເອກະສານ ແລະ Log
            // ==========================================
            // ສ້າງຊ່ອງລາຍເຊັນສຳລັບຕາຕະລາງໃໝ່
            await (0, signatureGenerator_1.generateSignatureSlots)(applicationId, 'repayment_schedule', newSchedule.id, transaction);
            // ບັນທຶກ Audit Log ວ່າເກີດການ Re-structure ຂຶ້ນ
            await (0, auditLogger_1.logAudit)('repayment_schedules', applicationId, 'CREATE', // 🟢 ແກ້ Error TS2345: ປ່ຽນຈາກ 'RESTRUCTURE' ເປັນ 'CREATE'
            oldScheduleData, newSchedule.toJSON(), performedBy, transaction);
            await transaction.commit();
            logger_1.logger.info(`Successfully restructured loan for Application ID: ${applicationId}. New Schedule Version: ${nextVersion}`);
            return newSchedule;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error(`Failed to restructure loan: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new LoanRestructureService();
