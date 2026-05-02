import { repayment_schedules } from './../models/repayment_schedules';
import { repayments, repaymentsAttributes, repaymentsCreationAttributes } from '../models/repayments';
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op, Sequelize, where } from 'sequelize';
import { logAudit } from '../utils/auditLogger';
import { generateSignatureSlots } from '../utils/signatureGenerator';

class RepaymentRepository {
    // ในไฟล์ RepaymentRepository.ts (หรือไฟล์ Repo ของคุณ)

    async saveRepaymentSchedule(application_id: number, scheduleData: Partial<any>[], performedBy: number, transaction?: any): Promise<any[]> {
        try {
            // 1. Validate Input
            if (!application_id || application_id === 0) {
                throw new Error('Application ID is required');
            }
            if (!performedBy) {
                throw new Error('performedBy (user ID) is required for audit logging');
            }

            // 2. ตรวจสอบว่ามี Loan Application นี้หรือไม่
            // const loanExist = await db.loan_applications.findOne({
            //     where: { id: application_id },
            //     transaction
            // });
            // ປ້ອງກັນບໍ່ໃຫ້ໃຜມາແກ້ໄຂຄຳຂໍນີ້ ໃນຂະນະທີ່ເຮົາກຳລັງສ້າງຕາຕະລາງຜ່ອນ
            const loanExist = await db.loan_applications.findByPk(application_id, {
                transaction,
                lock: transaction.LOCK.UPDATE // SELECT ... FOR UPDATE
            });

            if (!loanExist) {
                throw new Error('ບໍ່ພົບຂໍ້ມູນຄຳຂໍສິນເຊື່ອ (Loan application does not exist)');
            }

            // คำนวณยอดรวมจากข้อมูลที่ส่งมาใหม่ให้ชัวร์
            const totalPrincipal = scheduleData.reduce((sum, row: any) => sum + Number(row.principal || 0), 0);
            const totalInterest = scheduleData.reduce((sum, row: any) => sum + Number(row.interest || 0), 0);

            let scheduleId: number;

            // 3. ค้นหาตาราง Header "ฉบับร่าง" (Draft) ของคำขอนี้
            const existingDraftSchedule = await db.repayment_schedules.findOne({
                where: {
                    application_id: application_id,
                    status: 'draft' // หาเฉพาะฉบับร่าง
                },
                transaction,
                lock: transaction.LOCK.UPDATE // SELECT ... FOR UPDATE เพื่อป้องกันการแก้ไขพร้อมกัน
            });

            if (existingDraftSchedule) {
                // ==========================================
                // 🟢 CASE A: มีฉบับร่างอยู่แล้ว (อาจจะแก้ก่อนอนุมัติ หรือกำลังร่างตารางปรับโครงสร้าง)
                // ==========================================
                scheduleId = existingDraftSchedule.id;

                // อัปเดตยอดรวมใน Header ให้เป็นปัจจุบัน
                await existingDraftSchedule.update({
                    total_principal: totalPrincipal,
                    total_interest: totalInterest
                }, { transaction });

                // 🗑️ ลบ Detail เก่าทิ้งทั้งหมด ที่ผูกกับ schedule_id ของ "ฉบับร่าง" นี้
                // (ปลอดภัยเพราะเราลบเฉพาะข้อมูลร่าง ไม่ได้ลบประวัติของตารางที่ approved แล้ว)
                await db.repayments.destroy({
                    where: { schedule_id: scheduleId },
                    transaction
                });

                await logAudit('repayment_schedules', application_id, 'UPDATE', null, existingDraftSchedule.toJSON(), performedBy, transaction);

            } else {
                // ==========================================
                // 🟢 CASE B: ยังไม่มีฉบับร่างเลย ต้องสร้างใหม่
                // ==========================================

                // หา Version สูงสุด เพื่อบวก 1 (ถ้าไม่มีเลยให้เริ่มที่ 1)
                const maxVersionSchedule = await db.repayment_schedules.findOne({
                    where: { application_id: application_id },
                    order: [['version', 'DESC']],
                    transaction
                });
                const nextVersion = maxVersionSchedule ? Number(maxVersionSchedule.version) + 1 : 1;

                // เช็คว่าเป็นเคสปกติ หรือ เคสปรับโครงสร้างหนี้
                const isPostApproval = ['approved'].includes(loanExist.status ?? '');

                if (isPostApproval) {
                    logger.info(`Initiating Debt Restructure for Application ${application_id}. Creating Version ${nextVersion}`);
                    // 💡 หมายเหตุ: ตอนนี้เราแค่ "ร่าง" ตารางใหม่ เราจึงไม่ควรไปเปลี่ยนสถานะตารางเก่า
                    // ควรไปเปลี่ยนสถานะตารางเก่าเป็น 'restructured' ในฟังก์ชันอนุมัติ (Approve Schedule)
                } else {
                    logger.info(`Creating initial schedule for Application ${application_id}. Version ${nextVersion}`);
                }

                // สร้าง Header ตัวใหม่
                const newRepaymentSchedule = await db.repayment_schedules.create({
                    application_id: application_id,
                    version: nextVersion,
                    total_principal: totalPrincipal,
                    total_interest: totalInterest,
                    status: 'draft',
                    created_by: performedBy
                }, { transaction });

                scheduleId = newRepaymentSchedule.id;
                await logAudit('repayment_schedules', application_id, 'CREATE', null, newRepaymentSchedule.toJSON(), performedBy, transaction);

                // ==========================================
                // 🌟 🟢 ເພີ່ມໃໝ່: ສ້າງຊ່ອງລາຍເຊັນລໍຖ້າໄວ້ ສຳລັບຕາຕະລາງຜ່ອນຊຳລະ
                // ==========================================
                await generateSignatureSlots(
                    application_id,
                    'repayment_schedule',
                    scheduleId, // ໃຊ້ ID ຂອງຕາຕະລາງ Header ເປັນ reference
                    transaction
                );
            }

            // ==========================================
            // 4. 📝 เตรียมข้อมูล และ บันทึก Detail (Repayments)
            // ==========================================
            const repaymentRecords: any[] = scheduleData.map((row: any) => ({
                application_id: application_id,
                schedule_id: scheduleId,                   // ผูกกับ Header ID ที่ถูกต้อง
                installment_no: row.installment_number,
                due_date: row.due_date,
                principal_amount: Number(row.principal),   // แปลงเป็น Number เสมอ
                interest_amount: Number(row.interest),
                total_due: Number(row.total_amount),
                remaining_principal: Number(row.remaining_balance),
                payment_status: 'unpaid',
                paid_principal: 0,
                paid_interest: 0
            }));

            // 5. 💾 บันทึกตารางชุดใหม่ลง Details (Bulk Create)
            const createdRepayments = await db.repayments.bulkCreate(repaymentRecords, { transaction });

            const actionType = existingDraftSchedule ? 'UPDATE' : 'CREATE';
            await logAudit('repayments', application_id, actionType, null, repaymentRecords, performedBy, transaction);

            logger.info(`Saved ${createdRepayments.length} schedule rows for application ${application_id}, Schedule ID: ${scheduleId}`);

            return createdRepayments;

        } catch (error) {
            logger.error(`Error saving repayment schedule: ${(error as Error).message}`);
            throw error;
        }
    }
    async findRepaymentsByApplicationId(applicationId: number): Promise<repayments[]> {
        return await db.repayments.findAll({
            where: { application_id: applicationId, },
            include: [
                {
                    model: db.repayment_schedules,
                    as: 'schedule',
                    attributes: ['id', 'version', 'status'],
                    // 🟢 ເພີ່ມເງື່ອນໄຂ where ໄວ້ທາງໃນ include
                    // where: { status: 'approved' }
                }
            ],
        });
    }

    async calculateEarlyPayoff(applicationId: number): Promise<{ remaining_principal: number; calculated_interest: number; total_penalty: number; total_payoff_amount: number } | null> {

        // 1. ດຶງສະເພາະງວດທີ່ "ຍັງບໍ່ທັນຈ່າຍ" ຫຼື "ຊັກຊ້າ" ອອກມາ ແລະ ລຽງລຳດັບງວດກ່ອນ-ຫຼັງ
        const unpaidSchedules = await db.repayments.findAll({
            where: {
                application_id: applicationId,
                payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] } // 🟢 ດຶງສະເພາະງວດທີ່ຍັງຄ້າງ
            },
            order: [['installment_no', 'ASC']], // ລຽງຈາກງວດປະຈຸບັນ ໄປຫາງວດອະນາຄົດ
            raw: true
        });

        if (!unpaidSchedules || unpaidSchedules.length === 0) {
            return null; // ປິດບັນຊີແລ້ວ ຫຼື ບໍ່ມີຕາຕະລາງ
        }

        let total_principal = 0;
        let total_interest = 0;
        let total_penalty = 0;

        // 2. ວົນ Loop ເພື່ອບວກຕົວເລກຕາມໂລຈິກ
        unpaidSchedules.forEach((sch, index) => {
            // ຕົ້ນທຶນ: ບວກເອົາທຸກງວດທີ່ເຫຼືອ
            total_principal += Number(sch.principal_amount) || 0;

            // ຄ່າປັບໃໝ: ບວກເອົາທຸກງວດທີ່ເຫຼືອ (ຖ້າມີ)
            total_penalty += Number(sch.penalty) || 0;

            // 🟢 ດອກເບ້ຍ (Option 2): ຄິດໄລ່ດອກເບ້ຍເຕັມເດືອນ ສະເພາະ "ງວດປະຈຸບັນ" (index === 0)
            // ສ່ວນງວດອະນາຄົດ (index > 0) ຈະຖືວ່າໄດ້ຮັບການ "ຍົກເວັ້ນດອກເບ້ຍ (0 ກີບ)" ອັດຕະໂນມັດ
            if (index === 0) {
                total_interest += Number(sch.interest_amount) || 0;
            }
        });

        // 3. ຄຳນວນຍອດປິດບັນຊີລວມ
        const total_payoff_amount = total_principal + total_interest + total_penalty;

        return {
            remaining_principal: total_principal,
            calculated_interest: total_interest,
            total_penalty: total_penalty,
            total_payoff_amount: total_payoff_amount
        };
    }

    async findRepaymentById(application_id: number) {
        return await db.repayment_schedules.findOne({
            where: { application_id: application_id },
            order: [['version', 'DESC']],
            limit: 1
            // status: 'approved' }, // 🟢 ເພີ່ມເງື່ອນໄຂ where ໄວ້ທາງໃນ include
            // include: [
            //     {
            //         model: db.r,
            //         as: 'schedule',
            //         attributes: ['id', 'version', 'status'],
            //         where: { status: 'approved' } // 🟢 ເພີ່ມເງື່ອນໄຂ where ໄວ້ທາງໃນ include
            //     }
            // ]
        });
    }

    async updateRepayment(repaymentId: number, data: Partial<repaymentsAttributes>, transaction?: any): Promise<repayments | null> {
        try {
            const repayment = await db.repayments.findByPk(repaymentId, {
                transaction,
                lock: transaction ? transaction.LOCK.UPDATE : undefined
            });

            if (!repayment) {
                logger.error(`Repayment with ID: ${repaymentId} not found`);
                return null;
            }

            // ✅ จุดที่แก้: ใส่ { transaction } เข้าไป เพื่อให้มันทำงานในท่อเดียวกัน
            const updateRepayment = await repayment.update(data, {
                transaction // 🟢 สำคัญมาก ห้ามลืม!
            });

            logger.info(`Repayment with ID: ${repaymentId} updated successfully`);
            return updateRepayment;

        } catch (error) {
            logger.error(`Error updating repayment with ID: ${repaymentId} - ${(error as Error).message}`);
            throw error;
        }
    }
    async deleteRepaymentsByApplicationId(applicationId: number): Promise<number> {
        try {
            const deletedCount = await db.repayments.destroy({ where: { application_id: applicationId } });
            logger.info(`Deleted ${deletedCount} repayments for application ID: ${applicationId}`);
            return deletedCount;
        } catch (error) {
            logger.error(`Error deleting repayments for application ID: ${applicationId} - ${(error as Error).message}`);
            throw error;

        }
    }

    // ==========================================
    // 🟢 ສ່ວນທີ່ເພີ່ມໃໝ່ ສຳລັບການຮັບຊຳລະເງິນ (Payment Processing)
    // ==========================================

    // 1. ສ້າງໃບບິນຮັບເງິນ (Receipt / Transaction Log)
    // ໝາຍເຫດ: ປ່ຽນ db.payment_receipts ເປັນຊື່ Table ທີ່ທ່ານມີສຳລັບເກັບໃບບິນ
    async createReceipt(data: any, transaction?: any): Promise<any> {
        return await db.payment_transactions.create(data, { transaction });
    }

    // // 2. ສຳລັບ Early Payoff: ອັບເດດທຸກງວດທີ່ເຫຼືອໃຫ້ກາຍເປັນ 'paid'
    // async markAllRemainingAsPaid(applicationId: number, transaction?: any): Promise<any> {
    //     return await db.repayments.update(
    //         { payment_status: 'paid', paid_at: new Date() },
    //         { 
    //             where: { 
    //                 application_id: applicationId, 
    //                 payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] } 
    //             },
    //             transaction 
    //         }
    //     );
    // }

    // ==========================================
    // ໃນໄຟລ໌ RepaymentRepository.ts (ເພີ່ມຟັງຊັນນີ້ແທນອັນເກົ່າ)
    // ==========================================

    // ສຳລັບ Early Payoff: ອັບເດດທຸກງວດທີ່ເຫຼືອໃຫ້ກາຍເປັນ 'paid' ພ້ອມຍັດຍອດເງິນ
    async processEarlyPayoffSettlement(applicationId: number, transaction?: any): Promise<void> {

        // 1. ດຶງງວດທີ່ຍັງຄ້າງທັງໝົດ
        const unpaidSchedules = await db.repayments.findAll({
            where: {
                application_id: applicationId,
                payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] }
            },
            order: [['installment_no', 'ASC']],
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
            transaction
        });

        const now = new Date();

        // 2. ວົນ Loop ອັບເດດຍອດເງິນທີ່ຄວນຈະຈ່າຍ ໃຫ້ເຕັມ
        for (let i = 0; i < unpaidSchedules.length; i++) {
            const sch = unpaidSchedules[i];

            // ສູດ Early Payoff: ດອກເບ້ຍເອົາສະເພາະງວດທຳອິດທີ່ຄ້າງ (i === 0), ງວດຖັດໄປດອກເບ້ຍເປັນ 0
            const finalInterest = i === 0 ? Number(sch.interest_amount) : Number(sch.paid_interest || 0);

            await sch.update({
                paid_principal: Number(sch.principal_amount), // ຈ່າຍຕົ້ນທຶນເຕັມ
                paid_interest: finalInterest,                 // ຈ່າຍດອກເບ້ຍຕາມສູດ
                payment_status: 'paid',
                paid_at: now
            }, { transaction });
        }
    }

    // 3. ອັບເດດສະຖານະຂອງສັນຍາ (ເຊັ່ນ: ປ່ຽນເປັນ 'completed' ຕອນປິດບັນຊີ)
    async updateLoanStatus(applicationId: number, status: string, transaction?: any): Promise<any> {
        return await db.loan_applications.update(
            { status: status as any },
            { where: { id: applicationId }, transaction }
        );
    }

   /**
     * 🟢 ຟັງຊັນທີ 1: ອັບເດດວັນທີຈ່າຍເງິນ ແຕ່ຍັງຄົງສະຖານະເປັນ Draft 
     * (ໃຊ້ສຳລັບຕອນຫົວໜ້າສິນເຊື່ອກວດຜ່ານ ເພື່ອໃຫ້ຕາຕະລາງພ້ອມພິມ)
     */
    async shiftDraftScheduleDates(applicationId: number, paymentDay: number, baseDate: Date, transaction: any): Promise<void> {
        try {
            const schedule = await db.repayment_schedules.findOne({
                where: { application_id: applicationId, status: 'draft' },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!schedule) return; // ຖ້າບໍ່ມີຕາຕະລາງຮ່າງ ກໍຂ້າມໄປ (ອາດຈະເກີດຈາກຍັງບໍ່ໄດ້ສ້າງ)

            const repayments = await db.repayments.findAll({
                where: { schedule_id: schedule.id },
                order: [['installment_no', 'ASC']],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            const currentDay = baseDate.getDate(); // ວັນທີປັດຈຸບັນທີ່ Verify
            let startMonthOffset = 0;

            // ຖ້າ payment_day ໃຫຍ່ກວ່າຫຼຶເທົ່າກັບວັນທີປັດຈຸບັນ -> ໃຫ້ເລີ່ມເດືອນນີ້ (offset = 0)
            // ຖ້າ payment_day ນ້ອຍກວ່າວັນທີປັດຈຸບັນ -> ໃຫ້ເລີ່ມເດືອນໜ້າ (offset = 1) ເພາະກາຍມື້ຈ່າຍໄປແລ້ວ
            if (paymentDay <= currentDay) {
                startMonthOffset = 1;
            }

            const baseYear = baseDate.getFullYear();
            const baseMonth = baseDate.getMonth(); // 0 = ມັງກອນ, 11 = ທັນວາ

            // ອັບເດດວັນທີຈ່າຍຂອງແຕ່ລະງວດ
            for (let i = 0; i < repayments.length; i++) {
                const targetMonth = baseMonth + startMonthOffset + i;
                let targetDueDate = new Date(baseYear, targetMonth, paymentDay);

                // ⚠️ ປ້ອງກັນ Edge Case ເຊັ່ນ payment_day = 31 ແຕ່ເດືອນນັ້ນມີແຄ່ 28 ຫຼຶ 30 ມື້
                if (targetDueDate.getMonth() !== (targetMonth % 12)) {
                    // ຖອຍກາຍມາເປັນມື້ສຸດທ້າຍຂອງເດືອນທີ່ຄວນຈະເປັນ
                    targetDueDate = new Date(baseYear, targetMonth + 1, 0);
                }

                // ອັບເດດແຄ່ວັນທີ ແລະ ໃຫ້ສະຖານະຍັງເປັນ unpaid
                await repayments[i].update({
                    due_date: targetDueDate.toISOString().split('T')[0],
                    payment_status: 'unpaid'
                }, { transaction });
            }

            logger.info(`Shifted Draft Schedule dates for Application ID: ${applicationId}`);

        } catch (error) {
            logger.error(`Error in shiftDraftScheduleDates: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * 🟢 ຟັງຊັນທີ 2: ລັອກຕາຕະລາງ ແລະ ປ່ຽນສະຖານະເປັນ Approved 
     * (ໃຊ້ຕອນຜູ້ບໍລິຫານກົດອະນຸມັດ/ປ່ອຍສິນເຊື່ອ ໂດຍຈະບໍ່ໄປແຕະຕ້ອງວັນທີອີກແລ້ວ)
     */
    async finalizeScheduleApproval(applicationId: number, adminId: number, approvalDate: Date, transaction: any): Promise<void> {
        try {
            const schedule = await db.repayment_schedules.findOne({
                where: { application_id: applicationId, status: 'draft' },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!schedule) {
                throw new Error('ບໍ່ພົບຕາຕະລາງຮ່າງ (Draft Schedule not found). ກະລຸນາສ້າງຕາຕະລາງກ່ອນ.');
            }

            const oldScheduleData = schedule.toJSON();

            // ອັບເດດສະຖານະ Header ເປັນ approved ເທົ່ານັ້ນ
            await schedule.update({
                status: 'approved',
                approved_by: adminId,
                approved_at: approvalDate
            }, { transaction });

            // ຖ້າມີລະບົບ Audit Log ກໍບັນທຶກໄວ້
            if (typeof logAudit === 'function') {
                await logAudit('repayment_schedules', applicationId, 'UPDATE', oldScheduleData, schedule.toJSON(), adminId, transaction);
            }

            logger.info(`Finalized Schedule Approval for Application ID: ${applicationId}`);

        } catch (error) {
            logger.error(`Error in finalizeScheduleApproval: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new RepaymentRepository();