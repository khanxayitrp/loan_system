import cron from 'node-cron';
import { db } from '../models/init-models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import notificationService from './notification.service';
import redisService from './redis.service';

import { CreateNotificationInput, RecipientType, NotificationEventType } from '../types/notification';

class ReminderCronService {

    public async processReminders() {
        const LOCK_KEY = 'lock:cron:reminders_sms';
        const LOCK_TIMEOUT = 3600;
        let hasLock = false;

        // ==========================================
        // 1. Redis Lock (ปรับปรุงให้ปลอดภัยขึ้น)
        // ==========================================
        try {
            await redisService.connect();
            hasLock = await redisService.setLock(LOCK_KEY, 'sending', LOCK_TIMEOUT);
        } catch (error) {
            logger.error(`[Reminder Batch] ❌ Redis unavailable. Stopping job to prevent duplicate SMS: ${(error as Error).message}`);
            // 🛑 Best Practice: ถ้า Redis พัง ให้หยุดการทำงานเลย ป้องกัน Server 2 ตัวแย่งกันส่ง SMS เบิ้ล
            return;
        }

        if (!hasLock) {
            logger.info(`[Reminder Batch] 🚫 Skip: Another server is already processing reminders.`);
            return;
        }

        // ==========================================
        // 2. ໂລຈິກຫຼັກ
        // ==========================================
        try {
            logger.info(`[Reminder Batch] Start scanning for upcoming due dates (7, 3, 0 days) and Overdue payments...`);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const in3Days = new Date(today);
            in3Days.setDate(today.getDate() + 3);

            const in7Days = new Date(today);
            in7Days.setDate(today.getDate() + 7);

            const targetSchedules = await db.repayments.findAll({
                where: {
                    [Op.or]: [
                        { due_date: { [Op.in]: [today, in3Days, in7Days] } },
                        { due_date: { [Op.lt]: today } }
                    ],
                    payment_status: { [Op.in]: ['unpaid', 'partial'] }
                },
                include: [
                    {
                        model: db.repayment_schedules,
                        as: 'schedule',
                        where: { status: 'approved' },
                        required: true
                    },
                    {
                        model: db.loan_applications,
                        as: 'application',
                        where: { status: 'disbursed' },
                        required: true,
                        include: [{ model: db.customers, as: 'customer' }]
                    }
                ]
                // 💡 Pro-Tip ในอนาคต: ถ้าข้อมูลเริ่มเยอะเกิน 10,000 ให้ใส่ limit: 1000, offset: 0 แล้ววน Loop เอาครับ
            });

            if (targetSchedules.length === 0) {
                logger.info(`[Reminder Batch] No customers to remind or alert today.`);
                // 🟢 อย่าลืมปลด Lock ถ้าไม่มีงานทำ (หรือจะปล่อยให้ Timeout ไปเองก็ได้)
                await redisService.del(LOCK_KEY);
                return;
            }

            let reminderSuccessCount = 0;
            let overdueSuccessCount = 0;

            for (const schedule of targetSchedules) {
                try {
                    const loan = (schedule as any).application;
                    const customer = loan?.customer;
                    if (!customer || !customer.phone) continue;

                    const remainingPrincipal = Number(schedule.principal_amount) - Number(schedule.paid_principal || 0);
                    const remainingInterest = Number(schedule.interest_amount) - Number(schedule.paid_interest || 0);
                    const remainingPenalty = Number(schedule.penalty || 0) - Number(schedule.paid_penalty || 0);

                    const unpaidAmountWithoutPenalty = remainingPrincipal + remainingInterest;
                    const totalUnpaidAmount = unpaidAmountWithoutPenalty + remainingPenalty;

                    // ป้องกันปัญหายอดเป็น 0 แต่ status ผิดพลาด
                    if (totalUnpaidAmount <= 0) continue;

                    const dueDate = new Date(schedule.due_date);
                    dueDate.setHours(0, 0, 0, 0);

                    const diffTime = dueDate.getTime() - today.getTime();
                    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    const shortDate = `${dueDate.getDate().toString().padStart(2, '0')}/${(dueDate.getMonth() + 1).toString().padStart(2, '0')}`;
                    const formatMoney = (amount: number) => new Intl.NumberFormat('lo-LA').format(amount);

                    let title = '';
                    let messageBody = '';
                    let eventType!: NotificationEventType;
                    let isOverdue = false;

                    if (daysDiff === 0) {
                        title = '🔴 ເຖິງກຳນົດຊຳລະຄ່າງວດມື້ນີ້';
                        messageBody = `ມື້ນີ້ຮອດກຳນົດຊຳລະ ${formatMoney(totalUnpaidAmount)} ₭. ກະລຸນາຊຳລະພາຍໃນມື້ນີ້.`;
                        eventType = NotificationEventType.PAYMENT_DUE;
                    } else if (daysDiff === 3) {
                        title = '🟡 ແຈ້ງເຕືອນກຽມຊຳລະຄ່າງວດ';
                        messageBody = `ກະລຸນາກຽມຊຳລະ ${formatMoney(totalUnpaidAmount)} ₭ ພາຍໃນ 3 ມື້ (${shortDate}).`;
                        eventType = NotificationEventType.PAYMENT_DUE;
                    } else if (daysDiff === 7) {
                        title = '🟢 ແຈ້ງເຕືອນລ່ວງໜ້າ 7 ມື້';
                        messageBody = `ຂໍແຈ້ງຍອດຊຳລະ ${formatMoney(totalUnpaidAmount)} ₭ ພາຍໃນວັນທີ ${shortDate}. ຂອບໃຈ`;
                        eventType = NotificationEventType.PAYMENT_DUE;
                    } else if (daysDiff < 0) {
                        isOverdue = true;
                        const overdueDays = Math.abs(daysDiff);
                        title = 'ເລີຍກຳນົດຊຳລະ ⚠️';
                        messageBody = `ງວດທີ ${schedule.installment_no}/${loan.loan_period} ເລີຍກຳນົດມາ ${overdueDays} ມື້ ກະລຸນາຊຳລະ ${formatMoney(unpaidAmountWithoutPenalty)} ກີບ + ຄ່າປັບ ${formatMoney(remainingPenalty)} ກີບ ໂດຍດ່ວນ`;
                        eventType = 'PAYMENT_OVERDUE' as any;
                    }

                    if (messageBody === '') continue;

                    // 1. In-App Notification
                    const notificationPayload: CreateNotificationInput = {
                        recipient_type: RecipientType.CUSTOMER,
                        recipient_id: customer.id,
                        event_type: eventType,
                        title: title,
                        body: messageBody,
                        reference_type: 'repayments',
                        reference_id: schedule.id,
                        data: {
                            unpaid_amount: totalUnpaidAmount,
                            principal_interest: unpaidAmountWithoutPenalty,
                            penalty: remainingPenalty,
                            days_diff: daysDiff,
                            due_date: schedule.due_date,
                            is_overdue: isOverdue
                        }
                    };

                    await notificationService.sendNotification(notificationPayload);

                    // 2. SMS Notification
                    if (customer.phone) {
                        let smsMsg = messageBody;
                        if (isOverdue) {
                            smsMsg = `INSEE: ງວດ ${schedule.installment_no}/${loan.loan_period} ເລີຍກຳນົດມາ ${Math.abs(daysDiff)} ມື້. ກະລຸນາຊຳລະ ${formatMoney(unpaidAmountWithoutPenalty)}₭ + ຄ່າປັບ ${formatMoney(remainingPenalty)}₭ ໂດຍດ່ວນ.`;
                        }

                        const isSent = await notificationService.sendSMS(customer.phone, smsMsg);
                        if (isSent) {
                            if (isOverdue) overdueSuccessCount++;
                            else reminderSuccessCount++;
                        }
                    }

                    // หน่วงเวลาเพื่อไม่ให้ SMS Gateway ทำงานหนักไป
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (err) {
                    logger.error(`[Reminder Batch] Error on schedule ${schedule.id}: ${(err as Error).message}`);
                }
            }

            logger.info(`[Reminder Batch] Success: Sent ${reminderSuccessCount} reminders and ${overdueSuccessCount} overdue alerts.`);

            // 🟢 ปลด Lock ทันทีเมื่องานเสร็จสิ้น เพื่อไม่ให้กีดขวางการทำงานในรอบถัดไป
            await redisService.del(LOCK_KEY);

        } catch (error) {
            logger.error(`[Reminder Batch] Critical Error during processing: ${(error as Error).message}`);
            // ปลด Lock หากเกิด Error ใหญ่ๆ ด้วย
            await redisService.del(LOCK_KEY);
        }
    }

    public startCronJob() {
        cron.schedule('0 8 * * *', async () => {
            logger.info('⏰ Cron Job Triggered: Daily Reminder & Overdue Notification');
            await this.processReminders();
        }, {
            timezone: "Asia/Vientiane"
        });
    }
}

export default new ReminderCronService();