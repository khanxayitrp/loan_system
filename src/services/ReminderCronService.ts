import cron from 'node-cron';
import { db } from '../models/init-models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import notificationService from './notification.service'; // 🟢 1. Import Notification Service เข้ามา

class ReminderCronService {

    public async processReminders() {
        try {
            logger.info(`[Reminder Batch] Start scanning for upcoming due dates (7, 3, 0 days)...`);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const in3Days = new Date(today);
            in3Days.setDate(today.getDate() + 3);

            const in7Days = new Date(today);
            in7Days.setDate(today.getDate() + 7);

            const upcomingSchedules = await db.repayments.findAll({
                where: {
                    due_date: {
                        [Op.in]: [today, in3Days, in7Days]
                    },
                    payment_status: { [Op.in]: ['unpaid', 'partial'] }
                },
                include: [
                    {
                        model: db.loan_applications,
                        as: 'application',
                        include: [{ model: db.customers, as: 'customer' }]
                    }
                ]
            });

            if (upcomingSchedules.length === 0) {
                logger.info(`[Reminder Batch] No customers to remind today.`);
                return;
            }

            let successCount = 0;

            for (const schedule of upcomingSchedules) {
                try {
                    const customer = (schedule as any).application?.customer;
                    if (!customer?.phone) continue;

                    const unpaidAmount = Number(schedule.principal_amount) - Number(schedule.paid_principal || 0) +
                        Number(schedule.interest_amount) - Number(schedule.paid_interest || 0) +
                        Number(schedule.penalty || 0);

                    const dueDate = new Date(schedule.due_date);
                    const diffTime = dueDate.getTime() - today.getTime();
                    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // 1. ฟังก์ชันช่วยจัดรูปแบบวันที่ให้สั้นลง (DD/MM) เช่น 24/04
                    const shortDate = `${dueDate.getDate().toString().padStart(2, '0')}/${(dueDate.getMonth() + 1).toString().padStart(2, '0')}`;
                    const strAmount = unpaidAmount.toLocaleString();

                    let messageBody = '';

                    // 2. เลือกระดับข้อความที่สุภาพและกระชับ (<= 65 chars)
                    if (daysRemaining === 0) {
                        // วันครบกำหนด
                        messageBody = `ມື້ນີ້ຮອດກຳນົດຊຳລະ ${strAmount} ₭. ກະລຸນາຊຳລະພາຍໃນມື້ນີ້.`;
                    } else if (daysRemaining === 3) {
                        // ล่วงหน้า 3 วัน
                        messageBody = `ກະລຸນາກຽມຊຳລະ ${strAmount} ₭ ພາຍໃນ 3 ມື້ (${shortDate}).`;
                    } else if (daysRemaining === 7) {
                        // ล่วงหน้า 7 วัน
                        messageBody = `ຂໍແຈ້ງຍອດຊຳລະ ${strAmount} ₭ ພາຍໃນວັນທີ ${shortDate}. ຂອບໃຈ`;
                    }

                    if (messageBody === '') continue;

                    // 🚀 3. สั่งยิง SMS ผ่าน Lao Telecom API
                    const isSent = await notificationService.sendSMS(customer.phone, messageBody);

                    if (isSent) {
                        successCount++;
                    }

                    // (Optional) หน่วงเวลา 1 วินาทีก่อนส่งข้อความถัดไป เพื่อป้องกัน API ของ Lao Telecom Block จากการส่งรัวเกินไป
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (err) {
                    logger.error(`[Reminder Batch] Error on schedule ${schedule.id}: ${(err as Error).message}`);
                }
            }

            logger.info(`[Reminder Batch] Success: Sent ${successCount} reminders.`);

        } catch (error) {
            logger.error(`[Reminder Batch] Critical Error: ${(error as Error).message}`);
        }
    }

    public startCronJob() {
        cron.schedule('0 8 * * *', async () => {
            logger.info('⏰ Cron Job Triggered: Daily Reminder Notification');
            await this.processReminders();
        }, {
            timezone: "Asia/Vientiane"
        });
    }
}

export default new ReminderCronService();