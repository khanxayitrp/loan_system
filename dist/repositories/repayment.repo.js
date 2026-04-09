"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("@/utils/logger");
const sequelize_1 = require("sequelize");
const auditLogger_1 = require("../utils/auditLogger");
const signatureGenerator_1 = require("../utils/signatureGenerator");
class RepaymentRepository {
    // ในไฟล์ RepaymentRepository.ts (หรือไฟล์ Repo ของคุณ)
    async saveRepaymentSchedule(application_id, scheduleData, performedBy, transaction) {
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
            const loanExist = await init_models_1.db.loan_applications.findByPk(application_id, {
                transaction,
                lock: transaction.LOCK.UPDATE // SELECT ... FOR UPDATE
            });
            if (!loanExist) {
                throw new Error('ບໍ່ພົບຂໍ້ມູນຄຳຂໍສິນເຊື່ອ (Loan application does not exist)');
            }
            // คำนวณยอดรวมจากข้อมูลที่ส่งมาใหม่ให้ชัวร์
            const totalPrincipal = scheduleData.reduce((sum, row) => sum + Number(row.principal || 0), 0);
            const totalInterest = scheduleData.reduce((sum, row) => sum + Number(row.interest || 0), 0);
            let scheduleId;
            // 3. ค้นหาตาราง Header "ฉบับร่าง" (Draft) ของคำขอนี้
            const existingDraftSchedule = await init_models_1.db.repayment_schedules.findOne({
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
                await init_models_1.db.repayments.destroy({
                    where: { schedule_id: scheduleId },
                    transaction
                });
                await (0, auditLogger_1.logAudit)('repayment_schedules', application_id, 'UPDATE', null, existingDraftSchedule.toJSON(), performedBy, transaction);
            }
            else {
                // ==========================================
                // 🟢 CASE B: ยังไม่มีฉบับร่างเลย ต้องสร้างใหม่
                // ==========================================
                // หา Version สูงสุด เพื่อบวก 1 (ถ้าไม่มีเลยให้เริ่มที่ 1)
                const maxVersionSchedule = await init_models_1.db.repayment_schedules.findOne({
                    where: { application_id: application_id },
                    order: [['version', 'DESC']],
                    transaction
                });
                const nextVersion = maxVersionSchedule ? Number(maxVersionSchedule.version) + 1 : 1;
                // เช็คว่าเป็นเคสปกติ หรือ เคสปรับโครงสร้างหนี้
                const isPostApproval = ['approved'].includes(loanExist.status ?? '');
                if (isPostApproval) {
                    logger_1.logger.info(`Initiating Debt Restructure for Application ${application_id}. Creating Version ${nextVersion}`);
                    // 💡 หมายเหตุ: ตอนนี้เราแค่ "ร่าง" ตารางใหม่ เราจึงไม่ควรไปเปลี่ยนสถานะตารางเก่า
                    // ควรไปเปลี่ยนสถานะตารางเก่าเป็น 'restructured' ในฟังก์ชันอนุมัติ (Approve Schedule)
                }
                else {
                    logger_1.logger.info(`Creating initial schedule for Application ${application_id}. Version ${nextVersion}`);
                }
                // สร้าง Header ตัวใหม่
                const newRepaymentSchedule = await init_models_1.db.repayment_schedules.create({
                    application_id: application_id,
                    version: nextVersion,
                    total_principal: totalPrincipal,
                    total_interest: totalInterest,
                    status: 'draft',
                    created_by: performedBy
                }, { transaction });
                scheduleId = newRepaymentSchedule.id;
                await (0, auditLogger_1.logAudit)('repayment_schedules', application_id, 'CREATE', null, newRepaymentSchedule.toJSON(), performedBy, transaction);
                // ==========================================
                // 🌟 🟢 ເພີ່ມໃໝ່: ສ້າງຊ່ອງລາຍເຊັນລໍຖ້າໄວ້ ສຳລັບຕາຕະລາງຜ່ອນຊຳລະ
                // ==========================================
                await (0, signatureGenerator_1.generateSignatureSlots)(application_id, 'repayment_schedule', scheduleId, // ໃຊ້ ID ຂອງຕາຕະລາງ Header ເປັນ reference
                transaction);
            }
            // ==========================================
            // 4. 📝 เตรียมข้อมูล และ บันทึก Detail (Repayments)
            // ==========================================
            const repaymentRecords = scheduleData.map((row) => ({
                application_id: application_id,
                schedule_id: scheduleId, // ผูกกับ Header ID ที่ถูกต้อง
                installment_no: row.installment_number,
                due_date: row.due_date,
                principal_amount: Number(row.principal), // แปลงเป็น Number เสมอ
                interest_amount: Number(row.interest),
                total_due: Number(row.total_amount),
                remaining_principal: Number(row.remaining_balance),
                payment_status: 'unpaid',
                paid_principal: 0,
                paid_interest: 0
            }));
            // 5. 💾 บันทึกตารางชุดใหม่ลง Details (Bulk Create)
            const createdRepayments = await init_models_1.db.repayments.bulkCreate(repaymentRecords, { transaction });
            const actionType = existingDraftSchedule ? 'UPDATE' : 'CREATE';
            await (0, auditLogger_1.logAudit)('repayments', application_id, actionType, null, repaymentRecords, performedBy, transaction);
            logger_1.logger.info(`Saved ${createdRepayments.length} schedule rows for application ${application_id}, Schedule ID: ${scheduleId}`);
            return createdRepayments;
        }
        catch (error) {
            logger_1.logger.error(`Error saving repayment schedule: ${error.message}`);
            throw error;
        }
    }
    async findRepaymentsByApplicationId(applicationId) {
        return await init_models_1.db.repayments.findAll({
            where: { application_id: applicationId, },
            include: [
                {
                    model: init_models_1.db.repayment_schedules,
                    as: 'schedule',
                    attributes: ['id', 'version', 'status'],
                    // 🟢 ເພີ່ມເງື່ອນໄຂ where ໄວ້ທາງໃນ include
                    // where: { status: 'approved' }
                }
            ],
        });
    }
    async calculateEarlyPayoff(applicationId) {
        // 1. ດຶງສະເພາະງວດທີ່ "ຍັງບໍ່ທັນຈ່າຍ" ຫຼື "ຊັກຊ້າ" ອອກມາ ແລະ ລຽງລຳດັບງວດກ່ອນ-ຫຼັງ
        const unpaidSchedules = await init_models_1.db.repayments.findAll({
            where: {
                application_id: applicationId,
                payment_status: { [sequelize_1.Op.in]: ['unpaid', 'overdue', 'partial'] } // 🟢 ດຶງສະເພາະງວດທີ່ຍັງຄ້າງ
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
    async findRepaymentById(repaymentId) {
        return await init_models_1.db.repayments.findByPk(repaymentId, {
            include: [
                {
                    model: init_models_1.db.repayment_schedules,
                    as: 'schedule',
                    attributes: ['id', 'version', 'status'],
                    where: { status: 'approved' } // 🟢 ເພີ່ມເງື່ອນໄຂ where ໄວ້ທາງໃນ include
                }
            ]
        });
    }
    async updateRepayment(repaymentId, data, transaction) {
        try {
            const repayment = await init_models_1.db.repayments.findByPk(repaymentId, {
                transaction,
                lock: transaction ? transaction.LOCK.UPDATE : undefined // 🟢 เพิ่ม Lock เฉพาะตอนมี Transaction
            });
            if (!repayment) {
                logger_1.logger.error(`Repayment with ID: ${repaymentId} not found`);
                return null;
            }
            const updateRepayment = await repayment.update(data, {
                where: { id: repaymentId },
                returning: true
            });
            logger_1.logger.info(`Repayment with ID: ${repaymentId} updated successfully`);
            return updateRepayment;
        }
        catch (error) {
            logger_1.logger.error(`Error updating repayment with ID: ${repaymentId} - ${error.message}`);
            throw error;
        }
    }
    async deleteRepaymentsByApplicationId(applicationId) {
        try {
            const deletedCount = await init_models_1.db.repayments.destroy({ where: { application_id: applicationId } });
            logger_1.logger.info(`Deleted ${deletedCount} repayments for application ID: ${applicationId}`);
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting repayments for application ID: ${applicationId} - ${error.message}`);
            throw error;
        }
    }
    // ==========================================
    // 🟢 ສ່ວນທີ່ເພີ່ມໃໝ່ ສຳລັບການຮັບຊຳລະເງິນ (Payment Processing)
    // ==========================================
    // 1. ສ້າງໃບບິນຮັບເງິນ (Receipt / Transaction Log)
    // ໝາຍເຫດ: ປ່ຽນ db.payment_receipts ເປັນຊື່ Table ທີ່ທ່ານມີສຳລັບເກັບໃບບິນ
    async createReceipt(data, transaction) {
        return await init_models_1.db.payment_transactions.create(data, { transaction });
    }
    // 2. ສຳລັບ Early Payoff: ອັບເດດທຸກງວດທີ່ເຫຼືອໃຫ້ກາຍເປັນ 'paid'
    async markAllRemainingAsPaid(applicationId, transaction) {
        return await init_models_1.db.repayments.update({ payment_status: 'paid', paid_at: new Date() }, {
            where: {
                application_id: applicationId,
                payment_status: { [sequelize_1.Op.in]: ['unpaid', 'overdue', 'partial'] }
            },
            transaction
        });
    }
    // 3. ອັບເດດສະຖານະຂອງສັນຍາ (ເຊັ່ນ: ປ່ຽນເປັນ 'completed' ຕອນປິດບັນຊີ)
    async updateLoanStatus(applicationId, status, transaction) {
        return await init_models_1.db.loan_applications.update({ status: status }, { where: { id: applicationId }, transaction });
    }
}
exports.default = new RepaymentRepository();
