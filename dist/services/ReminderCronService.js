"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const init_models_1 = require("../models/init-models");
const sequelize_1 = require("sequelize");
const logger_1 = require("../utils/logger");
const notification_service_1 = __importDefault(require("./notification.service"));
const redis_service_1 = __importDefault(require("./redis.service"));
class ReminderCronService {
    async processReminders() {
        const LOCK_KEY = 'lock:cron:reminders_sms';
        const LOCK_TIMEOUT = 3600; // Lock ໄວ້ 1 ຊົ່ວໂມງ
        let hasLock = false;
        // ==========================================
        // 1. ແຍກ Try-Catch ສຳລັບເຊັກ Redis Lock ໂດຍສະເພາະ
        // ==========================================
        try {
            await redis_service_1.default.connect();
            hasLock = await redis_service_1.default.setLock(LOCK_KEY, 'sending', LOCK_TIMEOUT);
        }
        catch (error) {
            logger_1.logger.warn(`[Reminder Batch] ⚠️ Redis unavailable, proceeding without lock: ${error.message}`);
            // ຖ້າ Redis ພັງ ອະນຸຍາດໃຫ້ລັນຕໍ່ໄດ້ (Fallback)
            hasLock = true;
        }
        // ຖ້າມີ Server ອື່ນກຳລັງສົ່ງ SMS ຢູ່ແລ້ວ ໃຫ້ຢຸດເຮັດວຽກ
        if (!hasLock) {
            logger_1.logger.info(`[Reminder Batch] 🚫 Skip: Another server is already sending SMS.`);
            return;
        }
        // ==========================================
        // 2. ໂລຈິກຫຼັກ ສຳລັບການດຶງຂໍ້ມູນ ແລະ ສົ່ງ SMS
        // ==========================================
        try {
            logger_1.logger.info(`[Reminder Batch] Start scanning for upcoming due dates (7, 3, 0 days)...`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const in3Days = new Date(today);
            in3Days.setDate(today.getDate() + 3);
            const in7Days = new Date(today);
            in7Days.setDate(today.getDate() + 7);
            const upcomingSchedules = await init_models_1.db.repayments.findAll({
                where: {
                    due_date: {
                        [sequelize_1.Op.in]: [today, in3Days, in7Days]
                    },
                    payment_status: { [sequelize_1.Op.in]: ['unpaid', 'partial'] }
                },
                include: [
                    // 🛡️ 1. ຕາຕະລາງຕ້ອງຖືກອະນຸມັດແລ້ວເທົ່ານັ້ນ (ຕັດ Draft ຖິ້ມ)
                    {
                        model: init_models_1.db.repayment_schedules,
                        as: 'schedule', // 📍 ໝາຍເຫດ: ໃຫ້ກວດເບິ່ງຊື່ alias ໃນ Model ຂອງທ່ານອີກຄັ້ງ (ບາງເທື່ອອາດຈະເປັນ 'schedule_header')
                        where: { status: 'approved' },
                        required: true
                    },
                    // 🛡️ 2. ລູກຄ້າຕ້ອງໄດ້ຮັບເງິນແລ້ວເທົ່ານັ້ນ (disbursed) ຈຶ່ງຈະທວງເງິນໄດ້
                    {
                        model: init_models_1.db.loan_applications,
                        as: 'application',
                        where: { status: 'disbursed' },
                        required: true,
                        include: [{ model: init_models_1.db.customers, as: 'customer' }]
                    }
                ]
            });
            if (upcomingSchedules.length === 0) {
                logger_1.logger.info(`[Reminder Batch] No customers to remind today.`);
                return;
            }
            let successCount = 0;
            for (const schedule of upcomingSchedules) {
                try {
                    const customer = schedule.application?.customer;
                    if (!customer?.phone)
                        continue;
                    const unpaidAmount = Number(schedule.principal_amount) - Number(schedule.paid_principal || 0) +
                        Number(schedule.interest_amount) - Number(schedule.paid_interest || 0) +
                        Number(schedule.penalty || 0);
                    const dueDate = new Date(schedule.due_date);
                    const diffTime = dueDate.getTime() - today.getTime();
                    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const shortDate = `${dueDate.getDate().toString().padStart(2, '0')}/${(dueDate.getMonth() + 1).toString().padStart(2, '0')}`;
                    const strAmount = unpaidAmount.toLocaleString();
                    let messageBody = '';
                    if (daysRemaining === 0) {
                        messageBody = `ມື້ນີ້ຮອດກຳນົດຊຳລະ ${strAmount} ₭. ກະລຸນາຊຳລະພາຍໃນມື້ນີ້.`;
                    }
                    else if (daysRemaining === 3) {
                        messageBody = `ກະລຸນາກຽມຊຳລະ ${strAmount} ₭ ພາຍໃນ 3 ມື້ (${shortDate}).`;
                    }
                    else if (daysRemaining === 7) {
                        messageBody = `ຂໍແຈ້ງຍອດຊຳລະ ${strAmount} ₭ ພາຍໃນວັນທີ ${shortDate}. ຂອບໃຈ`;
                    }
                    if (messageBody === '')
                        continue;
                    // 🚀 ສັ່ງຍິງ SMS
                    const isSent = await notification_service_1.default.sendSMS(customer.phone, messageBody);
                    if (isSent) {
                        successCount++;
                    }
                    // ໜ່ວງເວລາ 1 ວິນາທີ ປ້ອງກັນ API ຂອງ Gateway ບລັອກ
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (err) {
                    logger_1.logger.error(`[Reminder Batch] Error on schedule ${schedule.id}: ${err.message}`);
                }
            }
            logger_1.logger.info(`[Reminder Batch] Success: Sent ${successCount} reminders.`);
        }
        catch (error) {
            // ຖ້າພັງທີ່ການເຊື່ອມຕໍ່ DB ຫຼື ການ Query ຈະເດັ້ງມາເຂົ້າ Catch ນີ້
            logger_1.logger.error(`[Reminder Batch] Critical Error during processing: ${error.message}`);
        }
    }
    startCronJob() {
        node_cron_1.default.schedule('0 8 * * *', async () => {
            logger_1.logger.info('⏰ Cron Job Triggered: Daily Reminder Notification');
            await this.processReminders();
        }, {
            timezone: "Asia/Vientiane"
        });
    }
}
exports.default = new ReminderCronService();
