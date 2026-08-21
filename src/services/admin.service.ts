import { db } from '../models/init-models';
import { Op } from 'sequelize';
import redisService from '../services/redis.service';
import { logAudit } from '../utils/auditLogger';

export class AdminService {

    async executeFullOverride(loanId: number, payload: any, evidenceUrl: string, performedBy: number) {
        const t = await db.sequelize.transaction();
        const tablesAffected = new Set<string>(['loan_applications']); 

        try {
            // ==========================================
            // 1. Validation & Data Extraction
            // ==========================================
            const loan = await db.loan_applications.findByPk(loanId, { transaction: t, lock: t.LOCK.UPDATE });
            if (!loan) throw new Error('Loan not found');

            const oldData = loan.toJSON();
            let { status, product_id, variant_id, total_amount, down_payment, loan_period, interest_rate, monthly_pay, first_installment_date } = payload.data;
            const actionType = payload.action || 'FULL_OVERRIDE';

            // 🌟 เช็คจำนวนงวดที่จ่ายแล้วจากตาราง details (repayments)
            const paidInstallments = await db.repayments.count({
                where: { application_id: loanId, payment_status: 'paid' }, transaction: t
            });

            const hasFinancialChanged = (
                oldData.total_amount !== total_amount || oldData.loan_period !== loan_period ||
                oldData.interest_rate_at_apply !== interest_rate || oldData.down_payment !== down_payment
            );

            // บล็อคการแก้ข้อมูลการเงิน หากมีการจ่ายเงินเข้ามาแล้ว
            if (paidInstallments > 0 && hasFinancialChanged) {
                throw new Error('ບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນການເງິນໄດ້ (ຍອດຈັດ, ດອກເບ້ຍ) ເນື່ອງຈາກລູກຄ້າໄດ້ຊຳລະຄ່າງວດເຂົ້າມາແລ້ວ');
            }

            if (actionType === 'CANCEL_ONLY' || actionType === 'CANCEL_AND_RECREATE') {
                status = 'cancelled';
            }

            if (['CHANGE_PAYMENT_DATE', 'FULL_OVERRIDE'].includes(actionType) && first_installment_date) {
                if (!first_installment_date || isNaN(new Date(first_installment_date).getTime())) {
                    throw new Error('ກະລຸນາລະບຸວັນທີຜ່ອນງວດທຳອິດໃຫ້ຖືກຕ້ອງ (Valid First Installment Date)');
                }
            }

            // ==========================================
            // 2. Status Progression Guard & Signatures
            // ==========================================
            const statusProgression = ['pending', 'verifying', 'verified', 'approved', 'disbursed'];
            const oldStatusIndex = statusProgression.indexOf(oldData.status || '');
            const newStatusIndex = statusProgression.indexOf(status);

            if (actionType === 'FULL_OVERRIDE' && oldStatusIndex !== -1 && newStatusIndex !== -1) {
                if (newStatusIndex > oldStatusIndex) {
                    throw new Error(`ລະບົບປະຕິເສດ: ບໍ່ສາມາດປ່ຽນສະຖານະໄປຂ້າງໜ້າໄດ້ (ຈາກ ${oldData.status} ໄປ ${status})`);
                }
                
                if (newStatusIndex < oldStatusIndex) {
                    const targetRoles = ['credit_head', 'approver_1', 'approver_2', 'approver_3', 'finance_staff'];
                    const oldSignatures = await db.document_signatures.findAll({ 
                        where: { application_id: loanId, role_type: { [Op.in]: targetRoles } }, transaction: t 
                    });

                    if (oldSignatures.length > 0) {
                        await db.document_signatures.update(
                            { status: 'pending', signed_at: null, signature_image_url: null, remark: `System reset via Override (Reverted to ${status})` } as any,
                            { where: { application_id: loanId, role_type: { [Op.in]: targetRoles } }, transaction: t }
                        );
                        tablesAffected.add('document_signatures');
                    }
                }
            }

            // ==========================================
            // 3. Condition Flags & Stock Logic[cite: 1]
            // ==========================================
            const wasStockDeducted = ['approved', 'disbursed'].includes(oldData.status!);
            const isStockDeductedNow = ['approved', 'disbursed'].includes(status);
            const isProductChanged = (oldData.product_id !== product_id || oldData.variant_id !== variant_id);
            const isCancelAndRecreate = (actionType === 'CANCEL_AND_RECREATE');

            if (wasStockDeducted && (!isStockDeductedNow || isProductChanged)) {
                if (oldData.variant_id) {
                    await db.product_variants.increment('stock_quantity', { by: 1, where: { id: oldData.variant_id }, transaction: t });
                }
            }
            if (isStockDeductedNow && (!wasStockDeducted || isProductChanged)) {
                if (variant_id) {
                    const targetVariant = await db.product_variants.findByPk(variant_id, { transaction: t });
                    if (!targetVariant || targetVariant.stock_quantity < 1) throw new Error('ສະຕັອກສິນຄ້າໃໝ່ (Variant) ບໍ່ພຽງພໍ!');
                    await targetVariant.decrement('stock_quantity', { by: 1, transaction: t });
                }
            }

            // ==========================================
            // 🚀 4.2 Update Loan & Contract
            // ==========================================
            const loanUpdateData: any = { 
                status, product_id, variant_id, total_amount, down_payment, loan_period, interest_rate_at_apply: interest_rate, monthly_pay 
            };

            // 🌟 แก้ไขบั๊ก Loan_Applications ไม่เปลี่ยนวันที่: อัปเดตทั้ง payment_day และ first_due_date
            if (['CHANGE_PAYMENT_DATE', 'FULL_OVERRIDE'].includes(actionType) && first_installment_date) {
                const startDate = new Date(first_installment_date);
                loanUpdateData.payment_day = startDate.getDate();
                loanUpdateData.first_due_date = first_installment_date; // <-- 🌟 สำคัญมาก! เพิ่ม Field นี้
            }

            await loan.update(loanUpdateData, { transaction: t });

            if (['CHANGE_PARTNER', 'CHANGE_PRODUCT', 'FULL_OVERRIDE'].includes(actionType)) {
                const contract = await db.loan_contract.findOne({ where: { loan_id: loanId }, transaction: t });
                if (contract && (hasFinancialChanged || isProductChanged)) {
                    let contractUpdateData: any = {
                        totalAmount: total_amount, productPrice: total_amount, productDownPayment: down_payment,
                        interestRateAtApply: interest_rate, loanPeriod: loan_period, monthlyPay: monthly_pay
                    };

                    if (isProductChanged) {
                        const newProduct = await db.products.findByPk(product_id, { include: ['partner'], transaction: t });
                        const newVariant = await db.product_variants.findByPk(variant_id, { transaction: t });
                        contractUpdateData.shopId = newProduct?.partner?.shop_id || contract.shop_id;
                        contractUpdateData.shopBranch = newProduct?.partner?.shop_name || contract.shop_branch;
                        contractUpdateData.product_color = newVariant?.color || contract.product_color;
                        contractUpdateData.productDetail = newProduct?.product_name || contract.product_detail;
                    }
                    await contract.update(contractUpdateData, { transaction: t });
                    tablesAffected.add('loan_contract');
                }
            }

            // ==========================================
            // 🚀 4.3 Handle Repayment Schedules (Absolute Anchoring)
            // ==========================================
            const currentScheduleHeader = await db.repayment_schedules.findOne({
                where: { application_id: loanId, status: 'approved' },
                order: [['version', 'DESC']],
                transaction: t
            });

            if (['CANCEL_ONLY', 'CANCEL_AND_RECREATE'].includes(actionType)) {
                if (currentScheduleHeader) {
                    await currentScheduleHeader.update({ status: 'cancelled' }, { transaction: t });
                    await db.repayments.update(
                        { payment_status: 'cancelled' as any }, 
                        { where: { schedule_id: currentScheduleHeader.id }, transaction: t }
                    );
                    tablesAffected.add('repayment_schedules');
                }
            } 
            else if (['CHANGE_PAYMENT_DATE', 'FULL_OVERRIDE'].includes(actionType) && first_installment_date) {
                if (!currentScheduleHeader) throw new Error('ບໍ່ພົບຕາຕະລາງຜ່ອນຊຳລະເດີມທີ່ຖືກອະນຸມັດ');

                const startDate = new Date(first_installment_date);
                const anchorDay = startDate.getDate();
                const startMonth = startDate.getMonth();
                const startYear = startDate.getFullYear();

                const oldDetails = await db.repayments.findAll({
                    where: { schedule_id: currentScheduleHeader.id },
                    order: [['installment_no', 'ASC']],
                    transaction: t
                });

                if (paidInstallments === 0) {
                    // 🟢 STRATEGY 1: Fresh Start (Delete & Recreate)
                    await db.repayments.destroy({ where: { schedule_id: currentScheduleHeader.id }, transaction: t });

                    const newDetailsData: any[] = []; 
                    
                    for (let i = 0; i < oldDetails.length; i++) {
                        // 🌟 แก้ไขบั๊ก Indexing: ใช้ installment_no เป็นแกนหลักเสมอ
                        const monthOffset = oldDetails[i].installment_no - 1; 
                        const targetMonth = startMonth + monthOffset;

                        let nextDueDate = new Date(startYear, targetMonth, anchorDay);
                        
                        if (nextDueDate.getMonth() !== (targetMonth % 12)) {
                            nextDueDate = new Date(startYear, targetMonth + 1, 0); 
                        }

                        const y = nextDueDate.getFullYear();
                        const m = String(nextDueDate.getMonth() + 1).padStart(2, '0');
                        const d = String(nextDueDate.getDate()).padStart(2, '0');

                        newDetailsData.push({
                            application_id: loanId,
                            schedule_id: currentScheduleHeader.id, 
                            installment_no: oldDetails[i].installment_no,
                            due_date: `${y}-${m}-${d}`,
                            principal_amount: oldDetails[i].principal_amount,
                            interest_amount: oldDetails[i].interest_amount,
                            total_due: oldDetails[i].total_due,
                            remaining_principal: oldDetails[i].remaining_principal,
                            payment_status: 'unpaid', 
                            paid_principal: 0,
                            paid_interest: 0,
                            paid_penalty: 0,
                            penalty: oldDetails[i].penalty || 0,
                            
                            discounts: oldDetails[i].discounts || 0 
                        });
                    }
                    await db.repayments.bulkCreate(newDetailsData, { transaction: t });

                } else {
                    // 🟠 STRATEGY 2: Restructure & Transfer (มีประวัติจ่ายเงินแล้ว)
                    await currentScheduleHeader.update({ status: 'restructured' }, { transaction: t });

                    const newScheduleHeader = await db.repayment_schedules.create({
                        application_id: loanId,
                        version: Number(currentScheduleHeader.version) + 1,
                        total_principal: currentScheduleHeader.total_principal,
                        total_interest: currentScheduleHeader.total_interest,
                        status: 'approved',
                        approved_by: performedBy,
                        approved_at: new Date(),
                        created_by: performedBy
                    }, { transaction: t });

                    await db.repayments.update(
                        { schedule_id: newScheduleHeader.id },
                        { where: { schedule_id: currentScheduleHeader.id }, transaction: t }
                    );

                    // 🌟 แก้ไขบั๊ก Indexing: ดึงรายละเอียด "ทั้งหมด" มาอัปเดตวันที่ เพื่อให้ Timeline ตรงกัน
                    const allDetails = await db.repayments.findAll({
                        where: { schedule_id: newScheduleHeader.id },
                        order: [['installment_no', 'ASC']],
                        transaction: t
                    });

                    for (let i = 0; i < allDetails.length; i++) {
                        // 🌟 แก้ไขบั๊ก Indexing: ใช้ installment_no เป็นแกนหลักเสมอ
                        const monthOffset = allDetails[i].installment_no - 1; 
                        const targetMonth = startMonth + monthOffset;

                        let nextDueDate = new Date(startYear, targetMonth, anchorDay);
                        
                        if (nextDueDate.getMonth() !== (targetMonth % 12)) {
                            nextDueDate = new Date(startYear, targetMonth + 1, 0); 
                        }

                        const y = nextDueDate.getFullYear();
                        const m = String(nextDueDate.getMonth() + 1).padStart(2, '0');
                        const d = String(nextDueDate.getDate()).padStart(2, '0');
                        
                        // อัปเดตเฉพาะ Due Date เท่านั้น ข้อมูลการชำระเงินของงวด 1-3 จะยังคงอยู่ครบถ้วน
                        await allDetails[i].update({ due_date: `${y}-${m}-${d}` }, { transaction: t });
                    }
                }
                tablesAffected.add('repayment_schedules');
            }

            // 🚀 4.4 Verified Manual Linkage
            let targetReplacementId: number | null = null;
            if (isCancelAndRecreate) {
                const newLoanIdStr = payload.data.replacement_loan_id_str;
                if (!newLoanIdStr) throw new Error('ກະລຸນາລະບຸລະຫັດບິນໃໝ່ (New Loan ID)');
                const newLoanRecord = await db.loan_applications.findOne({ where: { loan_id: newLoanIdStr }, transaction: t });
                if (!newLoanRecord) throw new Error(`ບໍ່ພົບລະຫັດບິນໃໝ່ "${newLoanIdStr}" ໃນລະບົບ!`);
                if (newLoanRecord.id === loanId) throw new Error('ບໍ່ສາມາດໃຊ້ລະຫັດບິນດຽວກັນເພື່ອເຊື່ອມໂຍງໄດ້');
                targetReplacementId = newLoanRecord.id;
            }

            // 🚀 4.5 Save Business Evidence Log
            await db.loan_change_requests.create({
                application_id: loanId, requested_by: performedBy, reference_doc: payload.audit.reference_doc,
                change_type: actionType, old_data: oldData, reason: payload.audit.reason,
                evidence_urls: evidenceUrl, replacement_loan_id: targetReplacementId, 
                status: 'executed', new_data: loan.toJSON()
            } as any, { transaction: t });

            // ==========================================
            // 5. Commit & Precise Cache Invalidation
            // ==========================================
            await t.commit();

            if (redisService.isClientConnected()) {
                await redisService.delByPattern('cache:loan_applications:list:*');
                await redisService.delByPattern('cache:dashboard:*');

                if (tablesAffected.has('loan_applications')) {
                    await redisService.del(`cache:loan_application:${loanId}`);
                }
                if (tablesAffected.has('loan_contract')) {
                    const contract = await db.loan_contract.findOne({ where: { loan_id: loanId } });
                    if (contract) await redisService.del(`cache:pdf:contract:${contract.id}`); 
                }
                if (tablesAffected.has('repayment_schedules')) {
                    await redisService.del(`cache:repayment_schedule:${loanId}`);
                    await redisService.del(`cache:pdf:repayment_schedule:${loanId}`); 
                }
            }

            return targetReplacementId ? { ...loan.toJSON(), replacement_loan_id: targetReplacementId } : loan;

        } catch (error) {
            if (t && !(t as any).finished) await t.rollback();
            throw error;
        }
    }
}