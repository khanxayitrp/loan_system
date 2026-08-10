import { db } from '../models/init-models';
import { Op } from 'sequelize';
import redisService from '../services/redis.service';
import { logAudit } from '@/utils/auditLogger';

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

            const paidInstallments = await db.repayment_schedules.count({
                where: { application_id: loanId, status: 'paid' }, transaction: t
            });
            if (paidInstallments > 0 && payload.data.status !== 'cancelled') {
                throw new Error('ບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນການເງິນໄດ້ ເນື່ອງຈາກລູກຄ້າໄດ້ຊຳລະຄ່າງວດເຂົ້າມາແລ້ວ');
            }

            const oldData = loan.toJSON();
            let { status, product_id, variant_id, total_amount, down_payment, loan_period, interest_rate, monthly_pay } = payload.data;
            const actionType = payload.action || 'FULL_OVERRIDE';

            if (actionType === 'CANCEL_ONLY' || actionType === 'CANCEL_AND_RECREATE') {
                status = 'cancelled';
            }

            // ==========================================
            // 2. Status Progression Guard & Signatures
            // ==========================================
            const statusProgression = ['pending', 'verifying', 'verified', 'approved', 'disbursed'];
            
            // 🌟 FIX 1: ເພີ່ມ `|| ''` ເພື່ອປ້ອງກັນ Error TS2345 (string | undefined)
            const oldStatusIndex = statusProgression.indexOf(oldData.status || '');
            const newStatusIndex = statusProgression.indexOf(status);

            if (actionType === 'FULL_OVERRIDE' && oldStatusIndex !== -1 && newStatusIndex !== -1) {
                if (newStatusIndex > oldStatusIndex) {
                    throw new Error(`ລະບົບປະຕິເສດ: ບໍ່ສາມາດປ່ຽນສະຖານະໄປຂ້າງໜ້າໄດ້ (ຈາກ ${oldData.status} ໄປ ${status})`);
                }
                
                // 🌟 ຍ້ອນສະຖານະ -> ລ້າງລາຍເຊັນ & ບັນທຶກ Audit Log
                if (newStatusIndex < oldStatusIndex) {
                    const targetRoles = ['credit_head', 'approver_1', 'approver_2', 'approver_3', 'finance_staff'];
                    
                    const oldSignatures = await db.document_signatures.findAll({ 
                        where: { application_id: loanId, role_type: { [Op.in]: targetRoles } }, transaction: t 
                    });

                    if (oldSignatures.length > 0) {
                        await db.document_signatures.update(
                            { 
                                status: 'pending', 
                                signed_at: null, 
                                signature_image_url: null, 
                                remark: `System reset via Override (Reverted to ${status})` 
                            } as any, // 🌟 FIX 2: ໃສ່ `as any` ເພື່ອປ້ອງກັນ Error TS2769 ທີ່ບໍ່ຍອມຮັບຄ່າ null
                            { where: { application_id: loanId, role_type: { [Op.in]: targetRoles } }, transaction: t }
                        );
                        
                        const newSignatures = await db.document_signatures.findAll({ 
                            where: { application_id: loanId, role_type: { [Op.in]: targetRoles } }, transaction: t 
                        });

                        // 🔴 AUDIT LOG: document_signatures
                        await logAudit('document_signatures', loanId, 'UPDATE', JSON.stringify(oldSignatures), JSON.stringify(newSignatures), performedBy, t);
                        tablesAffected.add('document_signatures');
                    }
                }
            }

            // ==========================================
            // 3. Condition Flags & Stock Logic [Hybrid System]
            // ==========================================
            const wasStockDeducted = ['approved', 'disbursed'].includes(oldData.status!);
            const isStockDeductedNow = ['approved', 'disbursed'].includes(status);
            const isProductChanged = (oldData.product_id !== product_id || oldData.variant_id !== variant_id);

            const hasFinancialChanged = (
                oldData.total_amount !== total_amount ||
                oldData.loan_period !== loan_period ||
                oldData.interest_rate_at_apply !== interest_rate ||
                oldData.down_payment !== down_payment
            );
            const shouldRegenerateSchedule = ['approved', 'disbursed', 'pending'].includes(status) && hasFinancialChanged;
            const isCancelAndRecreate = (actionType === 'CANCEL_AND_RECREATE');

            // 🚀 4.1 Stock Reversal (คืนสต็อกเก่า)
            if (wasStockDeducted && (!isStockDeductedNow || isProductChanged)) {
                if (oldData.variant_id) {
                    const oldVariant = await db.product_variants.findByPk(oldData.variant_id, { transaction: t });
                    if (oldVariant) {
                        const oldVariantData = oldVariant.toJSON();
                        await oldVariant.increment('stock_quantity', { by: 1, transaction: t });
                        await oldVariant.reload({ transaction: t });
                        
                        // 🔴 AUDIT LOG: product_variants (คืนสต็อก)
                        await logAudit('product_variants', oldData.variant_id, 'UPDATE', JSON.stringify(oldVariantData), JSON.stringify(oldVariant.toJSON()), performedBy, t);
                    }
                }
            }

            // 🚀 4.1.2 Stock Deduction (ตัดสต็อกใหม่)
            if (isStockDeductedNow && (!wasStockDeducted || isProductChanged)) {
                if (variant_id) {
                    const targetVariant = await db.product_variants.findByPk(variant_id, { transaction: t });
                    if (!targetVariant || targetVariant.stock_quantity < 1) throw new Error('ສະຕັອກສິນຄ້າໃໝ່ (Variant) ບໍ່ພຽງພໍ!');
                    
                    const oldTargetVariant = targetVariant.toJSON();
                    await targetVariant.decrement('stock_quantity', { by: 1, transaction: t });
                    await targetVariant.reload({ transaction: t });
                    
                    // 🔴 AUDIT LOG: product_variants (ตัดสต็อก)
                    await logAudit('product_variants', variant_id, 'UPDATE', JSON.stringify(oldTargetVariant), JSON.stringify(targetVariant.toJSON()), performedBy, t);
                }
            }

            // 🚀 4.2 Update Loan & Contract
            const loanUpdateData = { status, product_id, variant_id, total_amount, down_payment, loan_period, interest_rate_at_apply: interest_rate, monthly_pay };
            await loan.update(loanUpdateData, { transaction: t });
            
            // 🔴 AUDIT LOG: loan_applications
            await logAudit('loan_applications', loanId, 'UPDATE', JSON.stringify(oldData), JSON.stringify(loan.toJSON()), performedBy, t);

            if (['CHANGE_PARTNER', 'CHANGE_PRODUCT', 'FULL_OVERRIDE'].includes(actionType)) {
                const contract = await db.loan_contract.findOne({ where: { loan_id: loanId }, transaction: t });
                if (contract && (hasFinancialChanged || isProductChanged)) {
                    const oldContractData = contract.toJSON();
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
                    
                    // 🔴 AUDIT LOG: loan_contract
                    await logAudit('loan_contract', contract.id, 'UPDATE', JSON.stringify(oldContractData), JSON.stringify(contract.toJSON()), performedBy, t);
                    tablesAffected.add('loan_contract');
                }
            }

            // 🚀 4.3 Handle Repayment Schedules
            const oldSchedules = await db.repayment_schedules.findAll({ where: { application_id: loanId }, transaction: t });
            
            if (['CANCEL_ONLY', 'CANCEL_AND_RECREATE'].includes(actionType)) {
                if (oldSchedules.length > 0) {
                    await db.repayment_schedules.update({ status: 'cancelled' }, { where: { application_id: loanId }, transaction: t });
                    const newSchedules = await db.repayment_schedules.findAll({ where: { application_id: loanId }, transaction: t });
                    
                    // 🔴 AUDIT LOG: repayment_schedules (ยกเลิกค่างวด)
                    await logAudit('repayment_schedules', loanId, 'UPDATE', JSON.stringify(oldSchedules), JSON.stringify(newSchedules), performedBy, t);
                    tablesAffected.add('repayment_schedules');
                }
            } else if (shouldRegenerateSchedule) {
                if (oldSchedules.length > 0) {
                    await db.repayment_schedules.destroy({ where: { application_id: loanId }, transaction: t });
                    
                    // 🔴 AUDIT LOG: repayment_schedules (ลบค่างวดทิ้งเพื่อสร้างใหม่)
                    await logAudit('repayment_schedules', loanId, 'DELETE', JSON.stringify(oldSchedules), null, performedBy, t);
                    tablesAffected.add('repayment_schedules');
                }
                // 💡 Insert New Schedule Logic Here
            }

            // 🚀 4.4 Verified Manual Linkage (CANCEL_AND_RECREATE)
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
                application_id: loanId,
                requested_by: performedBy,
                reference_doc: payload.audit.reference_doc,
                change_type: actionType,
                old_data: oldData,
                reason: payload.audit.reason,
                evidence_urls: evidenceUrl, 
                replacement_loan_id: targetReplacementId, 
                status: 'executed',
                new_data: loan.toJSON()
            } as any, { transaction: t });

            // ==========================================
            // 5. Commit & Targeted Cache Invalidation
            // ==========================================
            await t.commit();

            if (redisService.isClientConnected()) {
                if (tablesAffected.has('loan_applications')) {
                    await redisService.delByPattern(`cache:loans:*`);
                    await redisService.delByPattern(`cache:loan_details:*`);
                    await redisService.delByPattern(`cache:dashboard:*`);
                }
                if (tablesAffected.has('loan_contract')) {
                    await redisService.delByPattern(`cache:contracts:*`);
                }
                if (tablesAffected.has('repayment_schedules')) {
                    await redisService.delByPattern(`cache:schedules:*`);
                }
                if (tablesAffected.has('document_signatures')) {
                    await redisService.delByPattern(`cache:signatures:*`);
                }
            }

            return targetReplacementId
                ? { ...loan.toJSON(), replacement_loan_id: targetReplacementId }
                : loan;

        } catch (error) {
            if (t && !(t as any).finished) await t.rollback();
            throw error;
        }
    }
}