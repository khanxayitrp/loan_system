import cron from 'node-cron';
import { db } from '../models/init-models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';
import redisService from './redis.service';

class DailyTrackingService {

    // เปลี่ยนจาก 999 เป็น ID ของ Admin ที่มีอยู่จริงในระบบ
    private readonly SYSTEM_USER_ID = 1;

    public async processDailyPenalties() {

        const LOCK_KEY = 'lock:cron:daily_penalties';
        const LOCK_TIMEOUT = 3600; // Lock ໄວ້ 1 ຊົ່ວໂມງ
        let hasLock = false;
        try {
            // 🔐 1. ຍາດເອົາ Lock ຜ່ານ Redis (NX + EX)
            await redisService.connect();
            hasLock = await redisService.setLock(LOCK_KEY, 'processing', LOCK_TIMEOUT);

            
        } catch (error) {
            logger.warn(`[Daily Batch] ⚠️ Redis unavailable, proceeding without lock:`, error);
            hasLock = true; // ให้ทำงานต่อไป แต่จะไม่มีการล็อกป้องกันการรันซ้ำ
            // ถ้า Redis ใช้งานไม่ได้ ก็ยังคงทำงานต่อไป แต่จะไม่มีการล็อกป้องกันการรันซ้ำ
        }
        if (!hasLock) {
                logger.info(`[Daily Batch] 🚫 Skip: Another server is already processing penalties.`);
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0); // ตั้งค่าเวลาเป็นเที่ยงคืนเป๊ะของวันนี้

            logger.info(`[Daily Batch] Start scanning for overdue schedules...`);

            const BATCH_SIZE = 500; // แบ่งทำทีละ 500 รายการ
            let offset = 0;
            let hasMore = true;
            let totalUpdated = 0;

            while (hasMore) {
                // 1. ดึงข้อมูลทีละ Batch
                const overdueSchedules = await db.repayments.findAll({
                    where: {
                        due_date: { [Op.lt]: today },
                        payment_status: { [Op.ne]: 'paid' }
                    },
                    include: [
                        {
                            model: db.repayment_schedules,
                            as: 'schedule', // ສົມມຸດວ່າຕັ້ງຊື່ alias ນີ້ໃນ model
                            where: { status: 'approved' }, // 🛡️ ຕ້ອງ Approved ເທົ່ານັ້ນຈຶ່ງຄິດຄ່າປັບ
                            required: true // Inner Join ເພື່ອຕັດລາຍການທີ່ບໍ່ແມ່ນ Approved ອອກເລີຍ
                        },
                        {
                            model: db.loan_applications,
                            as: 'application',
                            where: { status: 'disbursed' }, // 🛡️ ເພີ່ມຄວາມໝັ້ນໃຈ: ສະຖານະເງິນກູ້ຕ້ອງ "ຈ່າຍເງິນແລ້ວ"
                            attributes: ['interest_rate_at_apply', 'interest_rate_type']
                        }
                    ],
                    limit: BATCH_SIZE,
                    offset: offset,
                    order: [['id', 'ASC']]
                });

                if (overdueSchedules.length === 0) {
                    hasMore = false;
                    break;
                }

                // 2. ประมวลผลทีละรายการ (พัง 1 รายการ คนอื่นต้องไปต่อได้)
                for (const schedule of overdueSchedules) {
                    // แยก Transaction ระดับรายการ เพื่อความปลอดภัยสูงสุด
                    const transaction = await db.sequelize.transaction();

                    try {
                        // 🔒 Lock เฉพาะรายการนี้ เพื่อไม่ให้ชนกับการที่ลูกค้ากำลังกดโอนเงินเข้ามาพอดี
                        const lockedSchedule = await db.repayments.findByPk(schedule.id, {
                            transaction,
                            lock: transaction.LOCK.UPDATE
                        });

                        if (!lockedSchedule) {
                            await transaction.rollback();
                            continue;
                        }

                        // 🛡️ เช็ค Idempotent: วันนี้คิดค่าปรับไปแล้วหรือยัง?
                        // (ต้องเพิ่มคอลัมน์ last_penalty_date ใน Database ก่อน)
                        const lastPenaltyDate = lockedSchedule.last_penalty_date ? new Date(lockedSchedule.last_penalty_date) : null;
                        if (lastPenaltyDate && lastPenaltyDate.getTime() === today.getTime()) {
                            // วันนี้คิดไปแล้ว ให้ข้ามเลย (ป้องกันการคิดค่าปรับเบิ้ล)
                            await transaction.rollback();
                            continue;
                        }

                        // ---------------------------------------------------------
                        // ⚖️ 1. หาจำนวนวันที่ค้างชำระ
                        // ---------------------------------------------------------
                        const dueDate = new Date(lockedSchedule.due_date);
                        dueDate.setHours(0, 0, 0, 0);
                        const diffTime = today.getTime() - dueDate.getTime();
                        const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // หาวันที่เลยกำหนด

                        if (overdueDays > 0) {
                            // ---------------------------------------------------------
                            // ⚖️ 2. แปลงอัตราดอกเบี้ยให้เป็น "ต่อปี"
                            // ---------------------------------------------------------
                            // สังเกต: เราดึง application มาผ่าน include แล้ว (ต้อง cast type นิดหน่อยถ้าระบบไม่มองเห็น)
                            const appData = (schedule as any).application;
                            // ดักจับ Error กันเหนียว เผื่อตารางข้อมูลขาดหาย
                            if (!appData) {
                                logger.error(`[Daily Batch] Missing application data for Schedule ID ${schedule.id}`);
                                await transaction.rollback();
                                continue;
                            }
                            let annualInterestRate = Number(appData.interest_rate_at_apply) / 100; // แปลง 15% เป็น 0.15
                            if (appData.interest_rate_type === 'monthly') {
                                annualInterestRate = annualInterestRate * 12; // ถ้าเป็นรายเดือน ให้คูณ 12 เป็นรายปี
                            }

                            // ---------------------------------------------------------
                            // ⚖️ 3. หาอัตราค่าปรับตามกฎหมาย (<= ดอกเบี้ยต่อปี * 150%)
                            // ---------------------------------------------------------
                            const maxPenaltyRate = annualInterestRate * 1.5;

                            // ---------------------------------------------------------
                            // ⚖️ 4. หายอดเงินที่ค้างชำระ (เงินต้นคงค้าง + ดอกเบี้ยคงค้าง ของงวดนี้)
                            // หมายเหตุ: ตามกฎหมายบางประเทศคิดค่าปรับเฉพาะจาก "เงินต้น" เท่านั้น
                            // แต่ถ้ากฎหมายอนุญาตให้คิดจากยอดรวม ให้ใช้ unpaidTotal ครับ
                            // ---------------------------------------------------------
                            const unpaidPrincipal = Number(lockedSchedule.principal_amount) - Number(lockedSchedule.paid_principal || 0);
                            const unpaidInterest = Number(lockedSchedule.interest_amount) - Number(lockedSchedule.paid_interest || 0);
                            const overdueAmount = unpaidPrincipal + unpaidInterest; // ยอดที่ค้างชำระ

                            // ---------------------------------------------------------
                            // ⚖️ 5. เข้าสูตรคำนวณ (ยอดค้าง * อัตราค่าปรับ) / 360 * วันที่ค้าง
                            // ---------------------------------------------------------
                            const calculatedTotalPenalty = (overdueAmount * maxPenaltyRate) / 360 * overdueDays;

                            // ---------------------------------------------------------
                            // ⚖️ 6. อัปเดตลง Database (อัปเดตทับยอดเก่าไปเลย)
                            // ---------------------------------------------------------
                            // เก็บ Audit Log ข้อมูลเก่าก่อนอัปเดต (ถ้าคุณมีตัวแปร oldData)
                            const oldData = lockedSchedule.toJSON();

                            // อัปเดตข้อมูล
                            const updateSchedule = await lockedSchedule.update({
                                payment_status: 'overdue',
                                penalty: calculatedTotalPenalty,
                                last_penalty_date: today.toISOString() // อัปเดตว่าวันนี้คิดค่าปรับไปแล้ว
                            } as any, { transaction });

                            // 🟢 3. ส่งข้อมูล Audit Log
                            await logAudit('repayments', lockedSchedule.application_id, 'UPDATE', oldData, updateSchedule.toJSON(), this.SYSTEM_USER_ID, transaction);

                            await transaction.commit();
                            totalUpdated++;
                        } else {
                            await transaction.rollback();
                        }
                    } catch (error) {
                        await transaction.rollback();
                        // Log error ไว้ แต่ปล่อยให้ลูปเดินหน้าทำคนต่อไป
                        logger.error(`[Daily Batch] Failed to process schedule ID ${schedule.id}: ${(error as Error).message}`);
                    }
                }

                // ขยับ Offset ไป Batch ถัดไป
                offset += BATCH_SIZE;
            }

            logger.info(`[Daily Batch] Completed. Successfully updated ${totalUpdated} schedules.`);

    }

    public startCronJob() {
        // รันทุกๆ ตี 00:01 ของทุกวัน
        cron.schedule('1 0 * * *', async () => {
            // 🛠️ ปรับเป็น '*/5 * * * *' เพื่อทดสอบทุกๆ 5 นาที
            // cron.schedule('*/5 * * * *', async () => {
            logger.info('⏰ Cron Job Triggered: Daily Penalty Calculation');
            await this.processDailyPenalties();
        }, {
            timezone: "Asia/Vientiane"
        });
    }
}

export default new DailyTrackingService();