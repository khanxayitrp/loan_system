import { db } from '../models/init-models';
import repaymentRepo from '../repositories/repayment.repo';
import redisService from './redis.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';
import { Op } from 'sequelize';
import NotificationService from './notification.service';
import { CreateNotificationInput, RecipientType, NotificationEventType } from '../types/notification';
import { AmortizationBuilder } from '../utils/Amortizationbuilder';

class RepaymentService {

    public async processPayment(data: any, receivedBy: number) {
        const transaction = await db.sequelize.transaction();

        try {
            const applicationId = data.application_id;

            let remaining_cash = Number(data.amount_paid || 0);
            let remaining_discount = Number(data.discount_amount || 0);

            if (remaining_cash <= 0 && remaining_discount <= 0) {
                throw new BadRequestError('ຍອດເງິນຊຳລະຕ້ອງຫຼາຍກວ່າ 0');
            }

            const loan = await db.loan_applications.findByPk(applicationId, {
                include: [
                    { model: db.customers, as: 'customer' },
                    { model: db.products, as: 'product' } 
                ],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!loan) throw new BadRequestError('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ');
            if (loan.status === 'completed') throw new BadRequestError('ສັນຍານີ້ຖືກປິດບັນຊີໄປແລ້ວ!');

            const channel = data.payment_method === 'transfer' ? 'bank_transfer' : 'cash_at_branch';
            let isCompleted = false;
            let final_schedule_id = data.schedule_id;
            let paymentAllocation = null;

            // ==========================================
            // 🌟 3. Routing Logic (Early Payoff / Overpayment / Normal)
            // ==========================================
            if (data.is_early_payoff) {
                const result = await this.processEarlyPayoff(applicationId, remaining_cash, remaining_discount, data, receivedBy, transaction);
                remaining_cash = result.remaining_cash;
                isCompleted = result.isCompleted;
                final_schedule_id = null; 
            } else if (data.is_overpayment) {
                // 🚀 Overpayment Route (Unit of Work)
                const result = await this.processOverpaymentWithReschedule(applicationId, remaining_cash, receivedBy, loan, transaction);
                remaining_cash = result.remaining_cash;
                isCompleted = result.isCompleted;
                final_schedule_id = result.actual_paid_schedule_id;
            } else {
                // 🚀 Standard Normal/Advance Route
                const result = await this.processNormalPayment(applicationId, remaining_cash, remaining_discount, data.schedule_id, transaction);
                remaining_cash = result.remaining_cash;
                isCompleted = result.isCompleted;
                final_schedule_id = result.actual_paid_schedule_id;
                paymentAllocation = result.allocation; 
            }

            // ==========================================
            // 4. บันทึกใบเสร็จ
            // ==========================================
            let finalRemarks = data.remarks || '';
            if (paymentAllocation) {
                const remarkObj = {
                    ...paymentAllocation,
                    note: data.remarks || (remaining_cash > 0 ? `ມີຍອດເງິນທອນ/ຈ່າຍເກີນ: ${remaining_cash}` : ''),
                    change_amount: remaining_cash 
                };
                finalRemarks = JSON.stringify(remarkObj);
            } else if (data.is_overpayment) {
                const remarkObj = { note: data.remarks || 'ໂປະເງິນຕົ້ນ (Overpayment & Reschedule)', change_amount: remaining_cash };
                finalRemarks = JSON.stringify(remarkObj);
            } else if (data.is_early_payoff) {
                const remarkObj = { note: data.remarks || 'ປິດບັນຊີກ່ອນກຳນົດ (Early Payoff)', change_amount: remaining_cash };
                finalRemarks = JSON.stringify(remarkObj);
            } else if (remaining_cash > 0) {
                finalRemarks = `ມີຍອດເງິນທອນ/ຈ່າຍເກີນ: ${remaining_cash}`;
            }

            const transactionData = {
                application_id: applicationId,
                schedule_id: final_schedule_id, 
                amount_paid: data.amount_paid,
                transaction_type: data.is_early_payoff ? 'closing' : 'installment',
                payment_channel: channel,
                payment_method: data.reference_number || 'Cash',
                paid_at: data.payment_date ? new Date(data.payment_date) : new Date(),
                recorded_by: receivedBy,
                remarks: finalRemarks 
            };

            const newReceipt = await repaymentRepo.createReceipt(transactionData, transaction);
            await logAudit('payment_transactions', applicationId, 'CREATE', null, transactionData, receivedBy, transaction);

            // 5. Commit
            await transaction.commit();
            
            // 🌟 6. Cache Invalidation (Strict Standard)
            await redisService.del(`cache:repayment_schedule:${applicationId}`);

            // ==========================================
            // 7. ส่ง Notification (Background Task)
            // ==========================================
            try {
                if (loan && loan.customer) {
                    const customerId = loan.customer.id;
                    const customerPhone = loan.customer.phone;
                    const formattedAmount = new Intl.NumberFormat('lo-LA').format(data.amount_paid);
                    const loanNumber = loan.loan_id || applicationId;

                    let notifTitle = '';
                    let notifBody = '';
                    let eventType: NotificationEventType;
                    let refType = '';
                    let refId = 0;
                    let notifData: any = undefined;

                    if (isCompleted) {
                        const productName = loan.product?.product_name || 'ສິນຄ້າ';
                        const totalInstallments = loan.loan_period;
                        notifTitle = 'ຜ່ອນຊຳລະຄົບແລ້ວ 🎉';
                        notifBody = `ທ່ານໄດ້ຊຳລະ ${productName} ຄົບ ${totalInstallments} ງວດແລ້ວ ສິນຄ້າເປັນຂອງທ່ານສົມບູນ`;
                        eventType = NotificationEventType.PAYMENT_COMPLETED;
                        refType = 'loan_applications';
                        refId = applicationId;
                    } else {
                        notifTitle = 'ຊຳລະເງິນສຳເລັດ';
                        notifBody = `ລະບົບໄດ້ຮັບຍອດຊຳລະຈຳນວນ ${formattedAmount} ກີບ ສຳລັບສິນເຊື່ອເລກທີ ${loanNumber} ຮຽບຮ້ອຍແລ້ວ. ຂອບໃຈທີ່ໃຊ້ບໍລິການ.`;
                        eventType = NotificationEventType.PAYMENT_SUCCESS;
                        refType = 'payment_transactions';
                        refId = newReceipt.id;
                        notifData = {
                            paid_amount: formattedAmount,
                            month_payment: data.month_payment,
                            paid_at: transactionData.paid_at,
                            payment_channel: channel,
                        };
                    }

                    await NotificationService.sendNotification({
                        recipient_type: RecipientType.CUSTOMER,
                        recipient_id: customerId,
                        event_type: eventType,
                        title: notifTitle,
                        body: notifBody,
                        reference_type: refType,
                        reference_id: refId,
                        data: notifData
                    });

                    if (customerPhone) {
                        const smsMessage = `INSEE: ໄດ້ຮັບຍອດຊຳລະ ${formattedAmount} ₭ ສຳລັບສັນຍາ ${loanNumber} ສຳເລັດແລ້ວ.`;
                        NotificationService.sendSMS(customerPhone, smsMessage).catch(err => {
                            logger.error(`[Repayment] SMS send failed for Tx ${newReceipt.id}: ${err.message}`);
                        });
                        NotificationService.sendSuperAppNotification([customerPhone], notifTitle, notifBody).catch(err => {
                            logger.error(`[Repayment] SuperApp Notif failed for Tx ${newReceipt.id}: ${err.message}`);
                        });
                    }
                }
            } catch (notifError) {
                logger.error(`[Repayment] Failed to send notification for App ${applicationId}: ${(notifError as Error).message}`);
            }

            return { receipt: newReceipt, change: remaining_cash };

        } catch (error) {
            await transaction.rollback();
            logger.error(`Error processing payment: ${(error as Error).message}`);
            throw error;
        }
    }

    // ==========================================
    // 🔴 ປະມວນຜົນ ໂປະເງິນຕົ້ນ (Overpayment & Reschedule) 
    // [Refactored: Calculate First, Write Last + Explicit Field Mapping]
    // ==========================================
    private async processOverpaymentWithReschedule(applicationId: number, amount_paid: number, receivedBy: number, loan: any, transaction: any) {
        const currentSchedule = await db.repayment_schedules.findOne({
            where: { application_id: applicationId, status: 'approved' },
            lock: transaction.LOCK.UPDATE,
            transaction
        });
        if (!currentSchedule) throw new BadRequestError('ບໍ່ພົບຕາຕະລາງທີ່ອະນຸມັດແລ້ວ');

        const unpaidSchedules = await db.repayments.findAll({
            where: { schedule_id: currentSchedule.id, payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] } },
            order: [['installment_no', 'ASC']],
            lock: transaction.LOCK.UPDATE,
            transaction
        });
        if (unpaidSchedules.length === 0) throw new BadRequestError('ບໍ່ມີຍອດຄົງຄ້າງ');

        const historicalRepayments = await db.repayments.findAll({
            where: { schedule_id: currentSchedule.id, payment_status: 'paid' },
            order: [['installment_no', 'ASC']],
            raw: true,
            transaction
        });

        let remaining_cash = amount_paid;
        const firstUnpaid = unpaidSchedules[0]; 
        
        const requiredForFirst = (Number(firstUnpaid.principal_amount) + Number(firstUnpaid.interest_amount) + Number(firstUnpaid.penalty || 0)) 
            - (Number(firstUnpaid.paid_principal || 0) + Number(firstUnpaid.paid_interest || 0) + Number(firstUnpaid.paid_penalty || 0));

        if (remaining_cash < requiredForFirst) {
            throw new BadRequestError(`ຍອດໂປະຕ້ອງຫຼາຍກວ່າ ຫຼື ເທົ່າກັບຄ່າງວດປະຈຸບັນ (${requiredForFirst} ກີບ)`);
        }

        remaining_cash -= requiredForFirst;
        
        const remainingTerm = unpaidSchedules.length - 1; 
        if (remainingTerm === 0) {
             await repaymentRepo.updateRepayment(firstUnpaid.id, {
                 paid_principal: Number(firstUnpaid.principal_amount),
                 paid_interest: Number(firstUnpaid.interest_amount),
                 paid_penalty: Number(firstUnpaid.penalty || 0),
                 payment_status: 'paid', paid_at: new Date()
             }, transaction);
             await repaymentRepo.updateLoanStatus(applicationId, 'completed', transaction);
             return { remaining_cash, isCompleted: true, actual_paid_schedule_id: firstUnpaid.id };
        }

        let oldRemainingPrincipal = 0;
        for (let i = 1; i < unpaidSchedules.length; i++) { 
            oldRemainingPrincipal += (Number(unpaidSchedules[i].principal_amount) - Number(unpaidSchedules[i].paid_principal || 0));
        }

        const newRemainingPrincipal = oldRemainingPrincipal - remaining_cash;
        if (newRemainingPrincipal <= 0) {
            throw new BadRequestError('ຍອດເງິນໂປະຫຼາຍກວ່າເງິນຕົ້ນຄົງເຫຼືອ (ກະລຸນາໃຊ້ເມນູປິດບັນຊີແທນ)');
        }

        // 🌟 แก้ไข: คำนวณดอกเบี้ยที่แท้จริงต่อเดือนจากตารางเก่า ป้องกันดอกเบี้ยก้าวกระโดด
        const originalTotalPrincipal = Number(currentSchedule.total_principal);
        const originalMonthlyInterest = Number(firstUnpaid.interest_amount);
        let actualMonthlyInterestRate = 0;

        if (originalTotalPrincipal > 0) {
            actualMonthlyInterestRate = originalMonthlyInterest / originalTotalPrincipal;
        } else {
            const rawInterest = Number(loan.interest_rate_at_apply) || 1.5; 
            actualMonthlyInterestRate = rawInterest >= 1 ? rawInterest / 100 : rawInterest;
        }

        // 🌟 แก้ไข: ใช้วันที่ของงวดล่าสุดเป็นฐานในการคำนวณงวดถัดไป ป้องกันงวดชนกัน
        const paymentDay = new Date(unpaidSchedules[1].due_date).getDate(); 
        const baseDate = new Date(firstUnpaid.due_date); 
        const newScheduleRows = AmortizationBuilder.generate(newRemainingPrincipal, remainingTerm, actualMonthlyInterestRate, baseDate, paymentDay);

        const totalHistoricalPrincipal = historicalRepayments.reduce((sum, r) => sum + Number(r.principal_amount), 0);
        const totalHistoricalInterest = historicalRepayments.reduce((sum, r) => sum + Number(r.interest_amount), 0);
        const newTotalPrincipal = totalHistoricalPrincipal + Number(firstUnpaid.principal_amount) + newScheduleRows.reduce((sum, row) => sum + Number(row.principal), 0);
        const newTotalInterest = totalHistoricalInterest + Number(firstUnpaid.interest_amount) + newScheduleRows.reduce((sum, row) => sum + Number(row.interest), 0);

        await repaymentRepo.updateRepayment(firstUnpaid.id, {
            paid_principal: Number(firstUnpaid.principal_amount),
            paid_interest: Number(firstUnpaid.interest_amount),
            paid_penalty: Number(firstUnpaid.penalty || 0),
            payment_status: 'paid',
            paid_at: new Date()
        }, transaction);

        await currentSchedule.update({ status: 'superseded' }, { transaction });

        const nextVersion = Number(currentSchedule.version) + 1;
        const newRepaymentSchedule = await db.repayment_schedules.create({
            application_id: applicationId,
            version: nextVersion,
            total_principal: newTotalPrincipal,
            total_interest: newTotalInterest,
            status: 'approved',
            created_by: receivedBy,
            approved_by: receivedBy,
            approved_at: new Date()
        }, { transaction });

        const historicalRecordsToInsert = historicalRepayments.map(r => ({
            application_id: applicationId,
            schedule_id: newRepaymentSchedule.id,
            installment_no: r.installment_no,
            due_date: r.due_date,
            principal_amount: Number(r.principal_amount),
            interest_amount: Number(r.interest_amount),
            total_due: Number(r.total_due),
            discounts: Number(r.discounts || 0),
            penalty: Number(r.penalty || 0),
            remaining_principal: Number(r.remaining_principal),
            paid_principal: Number(r.paid_principal || 0),
            paid_interest: Number(r.paid_interest || 0),
            paid_penalty: Number(r.paid_penalty || 0),
            payment_status: r.payment_status as 'paid',
            paid_at: r.paid_at
        }));

        const freshlyPaidRecordToInsert = {
            application_id: applicationId,
            schedule_id: newRepaymentSchedule.id,
            installment_no: firstUnpaid.installment_no,
            due_date: firstUnpaid.due_date,
            principal_amount: Number(firstUnpaid.principal_amount),
            interest_amount: Number(firstUnpaid.interest_amount),
            total_due: Number(firstUnpaid.total_due),
            discounts: Number(firstUnpaid.discounts || 0),
            penalty: Number(firstUnpaid.penalty || 0),
            remaining_principal: Number(firstUnpaid.remaining_principal),
            paid_principal: Number(firstUnpaid.principal_amount),
            paid_interest: Number(firstUnpaid.interest_amount),
            paid_penalty: Number(firstUnpaid.penalty || 0),
            payment_status: 'paid' as 'paid',
            paid_at: new Date()
        };

        const lastPaidInstallmentNo = Math.max(
            historicalRepayments.length > 0 ? Math.max(...historicalRepayments.map(r => Number(r.installment_no))) : 0,
            Number(firstUnpaid.installment_no)
        );

        const futureRecordsToInsert = newScheduleRows.map((row: any) => ({
            application_id: applicationId,
            schedule_id: newRepaymentSchedule.id,
            installment_no: lastPaidInstallmentNo + row.installment_number, 
            due_date: row.due_date,
            principal_amount: Number(row.principal),
            interest_amount: Number(row.interest),
            total_due: Number(row.total_amount),
            remaining_principal: Number(row.remaining_balance),
            payment_status: 'unpaid' as 'unpaid',
            paid_principal: 0,
            paid_interest: 0
        }));

        await db.repayments.bulkCreate([
            ...historicalRecordsToInsert, 
            freshlyPaidRecordToInsert, 
            ...futureRecordsToInsert
        ], { transaction });
        
        logger.info(`App ${applicationId} OVERPAYMENT processed. Version ${currentSchedule.version} superseded by ${nextVersion}.`);

        return { remaining_cash: 0, isCompleted: false, actual_paid_schedule_id: firstUnpaid.id };
    }

    // ==========================================
    // 🔴 ປະມວນຜົນ ປິດບັນຊີກ່ອນກຳນົດ
    // ==========================================
    private async processEarlyPayoff(applicationId: number, remaining_cash: number, remaining_discount: number, data: any, receivedBy: number, transaction: any) {
        // 🌟 แก้ไข: ดึงตารางปัจจุบันก่อน เพื่อป้องกันคิวรีรั่วไหลไปดึงข้อมูลจากตารางเก่า
        const currentSchedule = await db.repayment_schedules.findOne({
            where: { application_id: applicationId, status: 'approved' },
            lock: transaction.LOCK.UPDATE,
            transaction
        });
        if (!currentSchedule) throw new BadRequestError('ບໍ່ພົບຕາຕະລາງທີ່ອະນຸມັດແລ້ວ');

        const unpaidSchedules = await db.repayments.findAll({
            where: { 
                schedule_id: currentSchedule.id, // 🌟 ใช้ schedule_id แทน
                payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] } 
            },
            order: [['installment_no', 'ASC']],
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (unpaidSchedules.length === 0) throw new BadRequestError('ບໍ່ມີຍອດຄົງຄ້າງສຳລັບການປິດບັນຊີ');

        let interestMonthsToCharge = data.payoff_interest_months !== undefined && data.payoff_interest_months !== null ? Number(data.payoff_interest_months) : (unpaidSchedules.length > 6 ? 5 : unpaidSchedules.length);
        let [totalExpectedPrincipal, totalExpectedInterest, totalExpectedPenalty] = [0, 0, 0];

        for (let i = 0; i < unpaidSchedules.length; i++) {
            const sch = unpaidSchedules[i];
            totalExpectedPrincipal += Number(sch.principal_amount) - Number(sch.paid_principal || 0);
            totalExpectedPenalty += Number(sch.penalty || 0) - Number(sch.paid_penalty || 0);
            if (i < interestMonthsToCharge) totalExpectedInterest += Number(sch.interest_amount) - Number(sch.paid_interest || 0);
        }

        const totalRequired = Math.max(0, (totalExpectedPrincipal + totalExpectedInterest + totalExpectedPenalty) - remaining_discount);

        if (remaining_cash < (totalRequired - 1)) throw new BadRequestError(`ຍອດເງິນບໍ່ພຽງພໍສຳລັບປິດບັນຊີ. ຕ້ອງຈ່າຍ: ${totalRequired} ກີບ (ຮັບມາ: ${remaining_cash} ກີບ)`);

        for (let i = 0; i < unpaidSchedules.length; i++) {
            const sch = unpaidSchedules[i];
            let pay_principal = Number(sch.principal_amount) - Number(sch.paid_principal || 0);
            let pay_penalty = Number(sch.penalty || 0) - Number(sch.paid_penalty || 0);
            let pay_interest = i < interestMonthsToCharge ? Number(sch.interest_amount) - Number(sch.paid_interest || 0) : 0;

            await repaymentRepo.updateRepayment(sch.id, {
                paid_principal: Number(sch.paid_principal || 0) + pay_principal,
                paid_interest: Number(sch.paid_interest || 0) + pay_interest,
                paid_penalty: Number(sch.paid_penalty || 0) + pay_penalty,
                payment_status: 'paid', paid_at: new Date()
            }, transaction);
        }

        await repaymentRepo.updateLoanStatus(applicationId, 'completed', transaction);
        remaining_cash -= totalRequired;
        return { remaining_cash, isCompleted: true };
    }

    // ==========================================
    // 🔴 ປະມວນຜົນ ຈ່າຍປົກກະຕິ (Waterfall / FIFO)
    // ==========================================
    private async processNormalPayment(applicationId: number, remaining_cash: number, remaining_discount: number, requested_schedule_id: number | null, transaction: any) {
        // 🌟 แก้ไข: ดึงตารางปัจจุบันก่อน
        const currentSchedule = await db.repayment_schedules.findOne({
            where: { application_id: applicationId, status: 'approved' },
            lock: transaction.LOCK.UPDATE,
            transaction
        });
        if (!currentSchedule) throw new BadRequestError('ບໍ່ພົບຕາຕະລາງທີ່ອະນຸມັດແລ້ວ');

        const unpaidSchedules = await db.repayments.findAll({
            where: { 
                schedule_id: currentSchedule.id, // 🌟 ใช้ schedule_id แทน
                payment_status: { [Op.in]: ['unpaid', 'overdue', 'partial'] } 
            },
            order: [['installment_no', 'ASC']],
            lock: transaction.LOCK.UPDATE, transaction
        });

        if (unpaidSchedules.length === 0) throw new BadRequestError('ບໍ່ມີຍອດຄົງຄ້າງສຳລັບສັນຍານີ້');

        const actual_paid_schedule_id = unpaidSchedules[0].id;
        let [total_principal_allocated, total_interest_allocated, total_penalty_allocated] = [0, 0, 0];

        for (const schedule of unpaidSchedules) {
            if (remaining_cash <= 0 && remaining_discount <= 0) break;

            let unpaid_penalty = Number(schedule.penalty || 0) - Number(schedule.paid_penalty || 0);
            let unpaid_interest = Number(schedule.interest_amount) - Number(schedule.paid_interest || 0);
            let unpaid_principal = Number(schedule.principal_amount) - Number(schedule.paid_principal || 0);
            let schedule_discount = 0;

            if (remaining_discount > 0) {
                const discountToPenalty = Math.min(remaining_discount, unpaid_penalty);
                unpaid_penalty -= discountToPenalty; remaining_discount -= discountToPenalty; schedule_discount += discountToPenalty;

                const discountToInterest = Math.min(remaining_discount, unpaid_interest);
                unpaid_interest -= discountToInterest; remaining_discount -= discountToInterest; schedule_discount += discountToInterest;
            }

            const new_discount_amount = Number(schedule.discounts || 0) + schedule_discount;

            const pay_penalty = Math.min(remaining_cash, Math.max(0, unpaid_penalty));
            remaining_cash -= pay_penalty; total_penalty_allocated += pay_penalty;
            const new_paid_penalty = Number(schedule.paid_penalty || 0) + pay_penalty;

            const pay_interest = Math.min(remaining_cash, Math.max(0, unpaid_interest));
            remaining_cash -= pay_interest; total_interest_allocated += pay_interest;
            const new_paid_interest = Number(schedule.paid_interest || 0) + pay_interest;

            const pay_principal = Math.min(remaining_cash, Math.max(0, unpaid_principal));
            remaining_cash -= pay_principal; total_principal_allocated += pay_principal;
            const new_paid_principal = Number(schedule.paid_principal || 0) + pay_principal;

            const total_cleared = new_paid_principal + new_paid_interest + new_paid_penalty + new_discount_amount;
            const total_expected = Number(schedule.principal_amount) + Number(schedule.interest_amount) + Number(schedule.penalty || 0);

            let newStatus: 'unpaid' | 'partial' | 'paid' | 'overdue' = schedule.payment_status as any;
            if (total_cleared >= (total_expected - 0.01)) newStatus = 'paid';
            else if (total_cleared > 0) newStatus = 'partial';

            await repaymentRepo.updateRepayment(schedule.id, {
                paid_principal: new_paid_principal, paid_interest: new_paid_interest, paid_penalty: new_paid_penalty,
                discounts: new_discount_amount, payment_status: newStatus as any,
                paid_at: newStatus === 'paid' ? new Date() : schedule.paid_at
            }, transaction);
        }

        let isCompleted = false;
        const checkAll = await db.repayments.count({ where: { application_id: applicationId, payment_status: { [Op.ne]: 'paid' } }, transaction });
        if (checkAll === 0) {
            await repaymentRepo.updateLoanStatus(applicationId, 'completed', transaction);
            isCompleted = true;
        }

        return { remaining_cash, isCompleted, actual_paid_schedule_id, allocation: { principal_paid: total_principal_allocated, interest_paid: total_interest_allocated, penalty_paid: total_penalty_allocated } };
    }


    // ==========================================
    // 🟢 ອັບເດດ URL ຫຼັກຖານການໂອນເງິນລົງ Database
    // ==========================================
    public async updateProofUrl(transactionId: number, fileUrl: string, userId: number) {
        const transaction = await db.sequelize.transaction();

        try {
            const paymentTx = await db.payment_transactions.findByPk(transactionId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!paymentTx) {
                throw new BadRequestError('ບໍ່ພົບຂໍ້ມູນການຊຳລະເງິນນີ້ໃນລະບົບ');
            }

            const oldData = paymentTx.toJSON();

            const updatedTx = await paymentTx.update({
                proof_url: fileUrl
            } as any, { transaction });

            await logAudit(
                'payment_transactions',
                paymentTx.application_id,
                'UPDATE',
                oldData,
                updatedTx.toJSON(),
                userId,
                transaction
            );

            await transaction.commit();
            return updatedTx;

        } catch (error) {
            await transaction.rollback();
            logger.error(`Error updating proof URL for TX ${transactionId}: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new RepaymentService();