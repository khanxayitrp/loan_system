import { db } from '../models/init-models';
import { Op } from 'sequelize';
import redisService from '../services/redis.service';

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
            let { 
                status, product_id, variant_id, total_amount, down_payment, loan_period, interest_rate, monthly_pay, first_installment_date,
                cust_first_name, cust_last_name, cust_gender, cust_phone, cust_dob, cust_age, 
                cust_identity_number, cust_census_number, cust_account_number, cust_issue_place, cust_issue_date, 
                cust_unit, cust_province_id, cust_district_id, cust_address, cust_occupation, cust_income, cust_other_debt,
                work_company_name, work_phone, work_employment_type, work_business_type, work_department, 
                work_position, work_duration_years, work_duration_months, work_province_id, work_district_id, 
                work_salary, work_business_detail, work_address,
                guar_ref_type, guar_name, guar_phone, guar_relationship, guar_identity_number, guar_dob, 
                guar_age, guar_occupation, guar_address, guar_province_id, guar_district_id, 
                guar_work_company_name, guar_work_phone, guar_work_position, guar_work_salary, 
                guar_work_province_id, guar_work_district_id, guar_work_location
            } = payload.data;

            const actionType = payload.action || 'FULL_OVERRIDE';

            // 🌟 1.1 คำนวณดอกเบี้ยรวม (Total Interest) อัตโนมัติด้วยสูตร Inverse
            const safeTotalAmount = Number(total_amount) || 0;
            const safeDownPayment = Number(down_payment) || 0;
            const safeMonthlyPay = Number(monthly_pay) || 0;
            const safePeriod = Number(loan_period) || 0;

            const principal = safeTotalAmount - safeDownPayment;
            const computed_total_interest = Math.max(0, (safeMonthlyPay * safePeriod) - principal);

            // ==========================================
            // 2. Financial Guard
            // ==========================================
            const paidInstallments = await db.repayments.count({
                where: { application_id: loanId, payment_status: 'paid' }, transaction: t
            });

            const hasFinancialChanged = (
                oldData.total_amount !== total_amount || oldData.loan_period !== loan_period ||
                oldData.interest_rate_at_apply !== interest_rate || oldData.down_payment !== down_payment
            );

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
            // 3. Status Progression & Signatures
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
            // 4. Stock Logic
            // ==========================================
            const wasStockDeducted = ['approved', 'disbursed'].includes(oldData.status!);
            const isStockDeductedNow = ['approved', 'disbursed'].includes(status);
            const isProductChanged = (oldData.product_id !== product_id || oldData.variant_id !== variant_id);

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
            // 🚀 5. ແກ້ໄຂຂໍ້ມູນບຸກຄົນຫຼັກ (Master Data)
            // ==========================================
            if (['FULL_OVERRIDE', 'CHANGE_CUSTOMER_INFO'].includes(actionType) && loan.customer_id) {
                await db.customers.update({
                    first_name: cust_first_name, last_name: cust_last_name, gender: cust_gender || null,
                    phone: cust_phone, date_of_birth: cust_dob || null, age: cust_age || 0,
                    identity_number: cust_identity_number || null, census_number: cust_census_number || null,
                    account_number: cust_account_number || null, issue_place: cust_issue_place || null,
                    issue_date: cust_issue_date || null, unit: cust_unit || null,
                    province_id: cust_province_id || null, district_id: cust_district_id || null,
                    address: cust_address || null, occupation: cust_occupation || null,
                    income_per_month: cust_income || null, other_debt: cust_other_debt || null
                }, { where: { id: loan.customer_id }, transaction: t });
                tablesAffected.add('customers');
            }

            if (['FULL_OVERRIDE', 'CHANGE_WORK_INFO'].includes(actionType) && loan.customer_id) {
                const workInfo = await db.customer_work_info.findOne({ where: { customer_id: loan.customer_id }, transaction: t });
                const workData = {
                    company_name: work_company_name || null, phone: work_phone || null,
                    employment_type: work_employment_type || null, business_type: work_business_type || null,
                    department: work_department || null, position: work_position || null,
                    duration_years: work_duration_years || null, duration_months: work_duration_months || null,
                    province_id: work_province_id || null, district_id: work_district_id || null,
                    salary: work_salary || null, business_detail: work_business_detail || null, address: work_address || null
                };
                if (workInfo) {
                    await workInfo.update(workData, { transaction: t });
                } else if (work_company_name) {
                    await db.customer_work_info.create({ ...workData, customer_id: loan.customer_id }, { transaction: t });
                }
                tablesAffected.add('customer_work_info');
            }

            if (['FULL_OVERRIDE', 'CHANGE_GUARANTOR_INFO'].includes(actionType)) {
                const guarantorInfo = await db.loan_guarantors.findOne({ where: { application_id: loanId }, transaction: t });
                const guarData: any = {
                    ref_Type: guar_ref_type || null, name: guar_name || null, phone: guar_phone || null,
                    relationship: guar_relationship || null, identity_number: guar_identity_number || null,
                    date_of_birth: guar_dob || null, age: guar_age || 0, occupation: guar_occupation || null,
                    address: guar_address || null, province_id: guar_province_id || null, district_id: guar_district_id || null,
                    work_company_name: guar_work_company_name || null, work_phone: guar_work_phone || null,
                    work_position: guar_work_position || null, work_salary: guar_work_salary || null,
                    work_province_id: guar_work_province_id || null, work_district_id: guar_work_district_id || null,
                    work_location: guar_work_location || null
                };
                if (guarantorInfo) {
                    await guarantorInfo.update(guarData, { transaction: t });
                } else if (guar_name) {
                    await db.loan_guarantors.create({ ...guarData, application_id: loanId }, { transaction: t });
                }
                tablesAffected.add('loan_guarantors');
            }

            // ==========================================
            // 🚀 6. ຊິ້ງຂໍ້ມູນເຂົ້າຕາຕະລາງ ໂທຢືນຢັນ (Call Verifications)
            // ==========================================
            if (['FULL_OVERRIDE', 'CHANGE_CUSTOMER_INFO', 'CHANGE_WORK_INFO', 'CHANGE_GUARANTOR_INFO'].includes(actionType)) {
                if (work_phone && ['FULL_OVERRIDE', 'CHANGE_WORK_INFO'].includes(actionType)) {
                    await db.loan_call_verifications.update(
                        { contact_phone: work_phone },
                        { where: { application_id: loanId, call_target: 'workplace' }, transaction: t }
                    );
                }
                if (cust_phone && ['FULL_OVERRIDE', 'CHANGE_CUSTOMER_INFO'].includes(actionType)) {
                    await db.loan_call_verifications.update(
                        { contact_phone: cust_phone, contact_name: `${cust_first_name} ${cust_last_name}`.trim() },
                        { where: { application_id: loanId, call_target: 'home' }, transaction: t }
                    );
                }
                if (['FULL_OVERRIDE', 'CHANGE_GUARANTOR_INFO'].includes(actionType)) {
                    const guarUpdates: any = {};
                    if (guar_name) guarUpdates.contact_name = guar_name;
                    if (guar_phone) guarUpdates.contact_phone = guar_phone;
                    if (guar_relationship) guarUpdates.relationship = guar_relationship;
                    if (Object.keys(guarUpdates).length > 0) {
                        await db.loan_call_verifications.update(
                            guarUpdates,
                            { where: { application_id: loanId, call_target: 'guarantor' }, transaction: t }
                        );
                    }
                }
            }

            // ==========================================
            // 🚀 7. ຊິ້ງຂໍ້ມູນເຂົ້າຕາຕະລາງ ສັນຍາ (Loan Contract) ໃຫ້ກົງກັນ 100%
            // ==========================================
            const contract = await db.loan_contract.findOne({ where: { loan_id: loanId }, transaction: t });
            
            if (contract) {
                let contractUpdates: any = {};

                if (['CHANGE_PARTNER', 'CHANGE_PRODUCT', 'FULL_OVERRIDE', 'CHANGE_PAYMENT_DATE'].includes(actionType)) {
                    if (hasFinancialChanged || isProductChanged || actionType === 'CHANGE_PAYMENT_DATE') {
                        contractUpdates = {
                            ...contractUpdates,
                            total_amount: total_amount, product_price: total_amount, product_down_payment: down_payment,
                            interest_rate_at_apply: interest_rate, loan_period: loan_period, monthly_pay: monthly_pay,
                            total_interest: computed_total_interest // 🌟 អັບເດດດອກເບ້ຍລວມ
                        };

                        if (isProductChanged) {
                            const newProduct = await db.products.findByPk(product_id, { include: ['partner'], transaction: t });
                            const newVariant = await db.product_variants.findByPk(variant_id, { transaction: t });
                            contractUpdates.shop_id = newProduct?.partner?.shop_id || contract.shop_id;
                            contractUpdates.shop_branch = newProduct?.partner?.shop_name || contract.shop_branch;
                            contractUpdates.product_color = newVariant?.color || contract.product_color;
                            contractUpdates.product_detail = newProduct?.product_name || contract.product_detail;
                        }
                    }
                }

                if (['FULL_OVERRIDE', 'CHANGE_CUSTOMER_INFO'].includes(actionType)) {
                    if (cust_first_name || cust_last_name) contractUpdates.cus_full_name = `${cust_first_name || ''} ${cust_last_name || ''}`.trim();
                    if (cust_gender) contractUpdates.cus_sex = cust_gender;
                    if (cust_dob) contractUpdates.cus_date_of_birth = cust_dob;
                    if (cust_phone) contractUpdates.cus_phone = cust_phone;
                    if (cust_identity_number) contractUpdates.cus_id_pass_number = cust_identity_number;
                    if (cust_issue_date) contractUpdates.cus_id_pass_date_start = cust_issue_date;
                    if (cust_census_number) contractUpdates.cus_census_number = cust_census_number;
                    if (cust_unit !== undefined) contractUpdates.cus_unit = cust_unit || 0;
                    if (cust_address) contractUpdates.cus_address = cust_address;
                    if (cust_province_id) contractUpdates.cus_province_id = cust_province_id;
                    if (cust_district_id) contractUpdates.cus_district_id = cust_district_id;
                    if (cust_occupation) contractUpdates.cus_occupation = cust_occupation;
                    if (cust_income !== undefined) contractUpdates.cus_income = cust_income || 0;
                }

                if (['FULL_OVERRIDE', 'CHANGE_WORK_INFO'].includes(actionType)) {
                    if (work_company_name) contractUpdates.cus_company_name = work_company_name;
                    if (work_business_type) contractUpdates.cus_company_businessType = work_business_type;
                    if (work_address) contractUpdates.cus_company_location = work_address;
                    if (work_duration_years !== undefined) contractUpdates.cus_company_workYear = work_duration_years || 0;
                    if (work_position) contractUpdates.cus_position = work_position;
                }

                if (['FULL_OVERRIDE', 'CHANGE_GUARANTOR_INFO'].includes(actionType)) {
                    if (guar_ref_type) contractUpdates.ref_Type = guar_ref_type;
                    if (guar_name) contractUpdates.ref_name = guar_name;
                    if (guar_dob) contractUpdates.ref_date_of_birth = guar_dob;
                    if (guar_phone) contractUpdates.ref_phone = guar_phone;
                    if (guar_identity_number) contractUpdates.ref_id_pass_number = guar_identity_number;
                    if (guar_address) contractUpdates.ref_address = guar_address;
                    if (guar_province_id) contractUpdates.ref_province_id = guar_province_id;
                    if (guar_district_id) contractUpdates.ref_district_id = guar_district_id;
                    if (guar_occupation) contractUpdates.ref_occupation = guar_occupation;
                    if (guar_relationship) contractUpdates.ref_relationship = guar_relationship;
                    if (guar_work_company_name) contractUpdates.ref_company_name = guar_work_company_name;
                    if (guar_work_position) contractUpdates.ref_position = guar_work_position;
                    if (guar_work_salary !== undefined) contractUpdates.ref_income = guar_work_salary || 0;
                    if (guar_work_location) contractUpdates.ref_company_location = guar_work_location;
                }

                if (Object.keys(contractUpdates).length > 0) {
                    contractUpdates.version = contract.version + 1;
                    await contract.update(contractUpdates, { transaction: t });
                    tablesAffected.add('loan_contract');
                }
            }

            // ==========================================
            // 🚀 8. Update Loan Main Table
            // ==========================================
            const loanUpdateData: any = { 
                status, product_id, variant_id, total_amount, down_payment, loan_period, interest_rate_at_apply: interest_rate, monthly_pay 
            };

            if (['CHANGE_PAYMENT_DATE', 'FULL_OVERRIDE'].includes(actionType) && first_installment_date) {
                const startDate = new Date(first_installment_date);
                loanUpdateData.payment_day = startDate.getDate();
                loanUpdateData.first_due_date = first_installment_date;
            }

            await loan.update(loanUpdateData, { transaction: t });

            // ==========================================
            // 🚀 9. Handle Repayment Schedules (ຕາຕະລາງຜ່ອນ)
            // ==========================================
            const currentScheduleHeader = await db.repayment_schedules.findOne({
                where: { application_id: loanId, status: 'approved' },
                order: [['version', 'DESC']],
                transaction: t
            });

            if (['CANCEL_ONLY', 'CANCEL_AND_RECREATE'].includes(actionType)) {
                if (currentScheduleHeader) {
                    await currentScheduleHeader.update({ status: 'cancelled' }, { transaction: t });
                    
                    // 🌟 ປ້ອງກັນປະຫວັດການຈ່າຍຫາຍ: ລຶບສະເພາະງວດທີ່ຍັງບໍ່ຈ່າຍ 🌟
                    if (paidInstallments === 0) {
                        // ຖ້າບໍ່ເຄີຍຈ່າຍເລີຍ: ລຶບຄ່າງວດທີ່ຄ້າງຢູ່ອອກໃຫ້ສະອາດ
                        await db.repayments.destroy({ 
                            where: { schedule_id: currentScheduleHeader.id, payment_status: 'unpaid' }, 
                            transaction: t 
                        });
                    } else {
                        // ຖ້າເຄີຍຈ່າຍແລ້ວ: ຫ້າມລຶບເດັດຂາດ! ປະໄວ້ໃຫ້ເປັນປະຫວັດ 
                        // ເພາະ Header ຖືກປ່ຽນເປັນ cancelled ລະບົບຈະບໍ່ເອົາມາຄິດໄລ່ແລ້ວ
                        console.log(`[Audit] Loan ${loanId} cancelled but retained repayment history due to ${paidInstallments} paid installments.`);
                    }
                    
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
                    await db.repayments.destroy({ where: { schedule_id: currentScheduleHeader.id }, transaction: t });
                    const newDetailsData: any[] = []; 
                    
                    for (let i = 0; i < oldDetails.length; i++) {
                        const monthOffset = oldDetails[i].installment_no - 1; 
                        const targetMonth = startMonth + monthOffset;
                        let nextDueDate = new Date(startYear, targetMonth, anchorDay);
                        if (nextDueDate.getMonth() !== (targetMonth % 12)) nextDueDate = new Date(startYear, targetMonth + 1, 0); 

                        const y = nextDueDate.getFullYear();
                        const m = String(nextDueDate.getMonth() + 1).padStart(2, '0');
                        const d = String(nextDueDate.getDate()).padStart(2, '0');

                        newDetailsData.push({
                            application_id: loanId, schedule_id: currentScheduleHeader.id, 
                            installment_no: oldDetails[i].installment_no, due_date: `${y}-${m}-${d}`,
                            principal_amount: oldDetails[i].principal_amount, interest_amount: oldDetails[i].interest_amount,
                            total_due: oldDetails[i].total_due, remaining_principal: oldDetails[i].remaining_principal,
                            payment_status: 'unpaid', paid_principal: 0, paid_interest: 0, paid_penalty: 0,
                            penalty: oldDetails[i].penalty || 0, discounts: oldDetails[i].discounts || 0 
                        });
                    }
                    await db.repayments.bulkCreate(newDetailsData, { transaction: t });
                    
                    // 🌟 ຖ້າບໍ່ມີການຊຳລະໃດໆ, ພຽງແຕ່ອັບເດດ Header ໃຫ້ຕົງກັບຂໍ້ມູນການເງິນໃໝ່
                    await currentScheduleHeader.update({
                        total_principal: principal,
                        total_interest: computed_total_interest
                    }, { transaction: t });

                } else {
                    await currentScheduleHeader.update({ status: 'restructured' }, { transaction: t });
                    const newScheduleHeader = await db.repayment_schedules.create({
                        application_id: loanId, version: Number(currentScheduleHeader.version) + 1,
                        total_principal: principal, // 🌟 ອັບເດດເງິນຕົ້ນລວມ
                        total_interest: computed_total_interest, // 🌟 ອັບເດດດອກເບ້ຍລວມ
                        status: 'approved', approved_by: performedBy, approved_at: new Date(), created_by: performedBy
                    }, { transaction: t });

                    await db.repayments.update(
                        { schedule_id: newScheduleHeader.id },
                        { where: { schedule_id: currentScheduleHeader.id }, transaction: t }
                    );

                    const allDetails = await db.repayments.findAll({
                        where: { schedule_id: newScheduleHeader.id },
                        order: [['installment_no', 'ASC']],
                        transaction: t
                    });

                    for (let i = 0; i < allDetails.length; i++) {
                        const monthOffset = allDetails[i].installment_no - 1; 
                        const targetMonth = startMonth + monthOffset;
                        let nextDueDate = new Date(startYear, targetMonth, anchorDay);
                        if (nextDueDate.getMonth() !== (targetMonth % 12)) nextDueDate = new Date(startYear, targetMonth + 1, 0); 

                        const y = nextDueDate.getFullYear();
                        const m = String(nextDueDate.getMonth() + 1).padStart(2, '0');
                        const d = String(nextDueDate.getDate()).padStart(2, '0');
                        
                        await allDetails[i].update({ due_date: `${y}-${m}-${d}` }, { transaction: t });
                    }
                }
                tablesAffected.add('repayment_schedules');
            }

            // 🚀 10. Manual Linkage & Change Log
            let targetReplacementId: number | null = null;
            if (actionType === 'CANCEL_AND_RECREATE') {
                const newLoanIdStr = payload.data.replacement_loan_id_str;
                if (!newLoanIdStr) throw new Error('ກະລຸນາລະບຸລະຫັດບິນໃໝ່ (New Loan ID)');
                const newLoanRecord = await db.loan_applications.findOne({ where: { loan_id: newLoanIdStr }, transaction: t });
                if (!newLoanRecord) throw new Error(`ບໍ່ພົບລະຫັດບິນໃໝ່ "${newLoanIdStr}" ໃນລະບົບ!`);
                if (newLoanRecord.id === loanId) throw new Error('ບໍ່ສາມາດໃຊ້ລະຫັດບິນດຽວກັນເພື່ອເຊື່ອມໂຍງໄດ້');
                targetReplacementId = newLoanRecord.id;
            }

            await db.loan_change_requests.create({
                application_id: loanId, requested_by: performedBy, reference_doc: payload.audit.reference_doc,
                change_type: actionType, old_data: oldData, reason: payload.audit.reason,
                evidence_urls: evidenceUrl, replacement_loan_id: targetReplacementId, 
                status: 'executed', new_data: loan.toJSON()
            } as any, { transaction: t });

            // ==========================================
            // 11. Commit & Cache Invalidation
            // ==========================================
            await t.commit();

            if (redisService.isClientConnected()) {
                await redisService.delByPattern('cache:loan_applications:list:*');
                await redisService.delByPattern('cache:dashboard:*');
                await redisService.delByPattern(`cache:customer:*`);
                await redisService.del(`cache:loan_application:${loanId}`);
                await redisService.del(`cache:repayment_schedule:${loanId}`);
                await redisService.del(`cache:pdf:repayment_schedule:${loanId}`); 
                await redisService.delByPattern(`*repayment_schedule*${loanId}*`); 
                const c = await db.loan_contract.findOne({ where: { loan_id: loanId } });
                if (c) {
                    await redisService.del(`cache:pdf:contract:${c.id}`); 
                    await redisService.delByPattern(`*contract*${c.id}*`); 
                }
            }

            return targetReplacementId ? { ...loan.toJSON(), replacement_loan_id: targetReplacementId } : loan;

        } catch (error) {
            if (t && !(t as any).finished) await t.rollback();
            throw error;
        }
    }
}