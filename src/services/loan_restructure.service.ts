import { db } from '../models/init-models';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logAudit } from '../utils/auditLogger';
import { generateSignatureSlots } from '../utils/signatureGenerator';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

class LoanRestructureService {
    
    /**
     * ໂລຈິກສຳລັບການປັບໂຄງສ້າງໜີ້ (Loan Restructuring)
     */
    async processRestructure(applicationId: number, newScheduleData: any[], performedBy: number) {
        const transaction = await db.sequelize.transaction();
        
        try {
            // 1. ກວດສອບສະຖານະຂອງສິນເຊື່ອ (ຕ້ອງເປັນສິນເຊື່ອທີ່ປ່ອຍໄປແລ້ວເທົ່ານັ້ນ)
            const loanApp = await db.loan_applications.findByPk(applicationId, { 
                transaction, 
                lock: transaction.LOCK.UPDATE 
            });

            if (!loanApp) throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ');
            if (!['disbursed', 'approved'].includes(loanApp.status || '')) {
                throw new BadRequestError('ບໍ່ສາມາດປັບໂຄງສ້າງໜີ້ໄດ້ ເພາະສິນເຊື່ອຍັງບໍ່ທັນປ່ອຍແທ້');
            }

            // 2. ຊອກຫາຕາຕະລາງຜ່ອນ (Version ລ່າສຸດ) ທີ່ກຳລັງໃຊ້ງານຢູ່ (approved)
            const activeSchedule = await db.repayment_schedules.findOne({
                where: { 
                    application_id: applicationId, 
                    status: 'approved' 
                },
                order: [['version', 'DESC']],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!activeSchedule) {
                throw new BadRequestError('ບໍ່ພົບຕາຕະລາງຜ່ອນຊຳລະທີ່ກຳລັງໃຊ້ງານຢູ່ (Active Schedule)');
            }

            // 3. 🚫 ກວດສອບ Guardrail: ຖ້າມີຕາຕະລາງທີ່ເປັນ 'draft' ຢູ່ແລ້ວ (ກຳລັງປັບໂຄງສ້າງແຕ່ຍັງບໍ່ສຳເລັດ) ໃຫ້ Error
            const existingDraft = await db.repayment_schedules.findOne({
                where: { application_id: applicationId, status: 'draft' },
                transaction
            });

            if (existingDraft) {
                throw new BadRequestError('ມີຕາຕະລາງປັບໂຄງສ້າງໜີ້ສະບັບຮ່າງຢູ່ແລ້ວ ກະລຸນາກວດສອບ ຫຼື ຍົກເລີກສະບັບຮ່າງກ່ອນ');
            }

            // ==========================================
            // 🔄 4. ດຳເນີນການອັບເດດຂອງເກົ່າ (Archive Old Data)
            // ==========================================
            const oldScheduleData = activeSchedule.toJSON();
            
            // 4.1 ປ່ຽນສະຖານະຕາຕະລາງ Header ເປັນ 'restructured'
            await activeSchedule.update({ status: 'restructured' }, { transaction });

            // 4.2 ຍົກເລີກງວດທີ່ຍັງບໍ່ທັນຈ່າຍໃນຕາຕະລາງຍ່ອຍ (Repayments) ໃຫ້ກາຍເປັນ 'restructured'
            await db.repayments.update(
                { payment_status: 'restructured' },
                { 
                    where: { 
                        schedule_id: activeSchedule.id, 
                        payment_status: { [Op.in]: ['unpaid', 'overdue'] } 
                    }, 
                    transaction 
                }
            );

            // ==========================================
            // ✨ 5. ສ້າງຕາຕະລາງໃໝ່ (Create New Data)
            // ==========================================
            const totalPrincipal = newScheduleData.reduce((sum, row: any) => sum + Number(row.principal || 0), 0);
            const totalInterest = newScheduleData.reduce((sum, row: any) => sum + Number(row.interest || 0), 0);
            const nextVersion = Number(activeSchedule.version) + 1;

            // 5.1 ສ້າງຕາຕະລາງ Header ໃໝ່
            const newSchedule = await db.repayment_schedules.create({
                application_id: applicationId,
                version: nextVersion,
                total_principal: totalPrincipal,
                total_interest: totalInterest,
                status: 'draft', // ເລີ່ມຕົ້ນເປັນ Draft ຈົນກວ່າຜູ້ບໍລິຫານຈະອະນຸມັດ
                created_by: performedBy
            }, { transaction });

            // 5.2 ບັນທຶກງວດຍ່ອຍໃໝ່ລົງຕາຕະລາງ Repayments
            const repaymentRecords = newScheduleData.map((row: any) => ({
                application_id: applicationId,
                schedule_id: newSchedule.id,
                installment_no: row.installment_number,
                due_date: row.due_date,
                principal_amount: Number(row.principal),
                interest_amount: Number(row.interest),
                total_due: Number(row.total_amount),
                remaining_principal: Number(row.remaining_balance),
                payment_status: 'unpaid',
                paid_principal: 0,
                paid_interest: 0
            }));

            await db.repayments.bulkCreate(repaymentRecords, { transaction });

            // ==========================================
            // 📝 6. ຈັດການເອກະສານ ແລະ Log
            // ==========================================
            // ສ້າງຊ່ອງລາຍເຊັນສຳລັບຕາຕະລາງໃໝ່
            await generateSignatureSlots(
                applicationId,
                'repayment_schedule',
                newSchedule.id,
                transaction
            );

            // ບັນທຶກ Audit Log ວ່າເກີດການ Re-structure ຂຶ້ນ
            await logAudit(
                'repayment_schedules', 
                applicationId, 
                'RESTRUCTURE', 
                oldScheduleData, 
                newSchedule.toJSON(), 
                performedBy, 
                transaction
            );

            await transaction.commit();
            logger.info(`Successfully restructured loan for Application ID: ${applicationId}. New Schedule Version: ${nextVersion}`);
            
            return newSchedule;

        } catch (error) {
            await transaction.rollback();
            logger.error(`Failed to restructure loan: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new LoanRestructureService();