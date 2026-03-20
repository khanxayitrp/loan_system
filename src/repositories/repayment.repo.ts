import { repayment_schedules } from './../models/repayment_schedules';
import { repayments, repaymentsAttributes, repaymentsCreationAttributes } from '../models/repayments';
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op, Sequelize, where } from 'sequelize';
import { logAudit } from '../utils/auditLogger';

class RepaymentRepository {
    // ในไฟล์ RepaymentRepository.ts (หรือไฟล์ Repo ของคุณ)

    async saveRepaymentSchedule(application_id: number, scheduleData: Partial<repaymentsAttributes>[], performedBy: number, transaction?: any): Promise<repayments[]> {
    try {
        // 1. Validate Input
        if (!application_id || application_id === 0) {
            throw new Error('Application ID is required');
        }
        if (!performedBy) {
            throw new Error('performedBy (user ID) is required for audit logging');
        }

        // 2. ตรวจสอบว่ามี Loan Application นี้หรือไม่
        const loanExist = await db.loan_applications.findOne({
            where: { id: application_id },
            transaction
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
            transaction
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
            const nextVersion = maxVersionSchedule ? Number(maxVersionSchedule!.version) + 1 : 1;

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
        return await db.repayments.findAll({ where: { application_id: applicationId,  },
        include: [
            {
                model: db.repayment_schedules,
                as: 'schedule',
                attributes: ['id', 'version', 'status'],
                // 🟢 ເພີ່ມເງື່ອນໄຂ where ໄວ້ທາງໃນ include
                where: { status: 'approved' }
            }
        ],
     });
    }

    async findRepaymentById(repaymentId: number): Promise<repayments | null> {
        return await db.repayments.findByPk(repaymentId, {
            include: [
                {
                    model: db.repayment_schedules,
                    as: 'schedule',
                    attributes: ['id', 'version', 'status'],
                    where: { status: 'approved' } // 🟢 ເພີ່ມເງື່ອນໄຂ where ໄວ້ທາງໃນ include
                }
            ]
        });
    }

    async updateRepayment(repaymentId: number, data: Partial<repaymentsAttributes>): Promise<repayments | null> {
        try {
            const repayment = await db.repayments.findByPk(repaymentId);
            if (!repayment) {
                logger.error(`Repayment with ID: ${repaymentId} not found`);
                return null;

            }
            const updateRepayment = await repayment.update(data, {
                where: { id: repaymentId },
                returning: true
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
}

export default new RepaymentRepository();