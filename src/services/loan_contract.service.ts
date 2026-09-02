import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Transaction, Op } from "sequelize";
import { logAudit } from '../utils/auditLogger';
import { generateSignatureSlots } from '../utils/signatureGenerator';

class LoanContractService {

    async createLoanContract(data: any) {
        const t = await db.sequelize.transaction();
        try {
            if (!data.loan_id) {
                throw new Error('loan_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            const performedBy = data.user_id || data.performed_by || 1;
            let loan_contract = null;

            const existingContract = await db.loan_contract.findOne({
                where: { loan_id: data.loan_id },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            // 🟢 Mapping ຂໍ້ມູນຫຼັກທັງໝົດ
            const loanContractData: any = {
                loan_id: data.loan_id,
                cus_full_name: data.cusFullName,
                cus_sex: data.cusSex,
                cus_date_of_birth: data.cusDateOfBirth || null,
                cus_phone: data.cusPhone,
                cus_marital_status: data.cusMaritalStatus,
                cus_id_pass_number: data.cusIdPassNumber,
                cus_id_pass_date_start: data.cusIdPassDate || null,
                cus_id_pass_date_expired: data.cusIdPassExpiryDate || null,
                cus_census_number: data.cusCensusNumber || null,
                cus_census_created: data.cusCensusCreated || null,
                cus_census_authorize_by: data.cusCensusAuthorizeBy,
                cus_house_number: data.cusHouseNumber,
                cus_unit: data.cusUnit,
                cus_address: `${data.cusAddress} ${data.cusDistrictName || ''} ${data.cusProvinceName || ''}`.trim(),
                cus_province_id: data.cusProvinceId || null,
                cus_district_id: data.cusDistrictId || null,
                cus_lived_year: data.cusLivedYear,
                cus_lived_with: data.cusLivedWith,
                cus_lived_situation: data.cusLivedSituation,
                cus_occupation: data.cusOccupation || null,
                cus_company_name: data.cusCompanyName,
                cus_company_businessType: data.cusCompanyBusinessType,
                cus_company_location: data.cusCompanyLocation,
                cus_company_workYear: data.cusCompanyWorkYear,
                cus_company_workMonth: data.cusCompanyWorkMonth,
                cus_position: data.cusPosition,
                cus_income: data.cusIncome || null,
                cus_payroll_date: data.cusPayrollDate || null,
                cus_company_emp_number: data.cusCompanyEmpNumber,
                cus_income_other: data.cusIncomeOther || null,
                cus_income_other_source: data.cusIncomeOtherSource,
                product_detail: data.productDetail,
                producttype_id: data.producttypeId || null,
                variant_id: data.variant_id || null,
                product_brand: data.productBrand,
                product_model: data.productModel,
                product_color: data.product_color || null,
                product_size: data.product_size || null,
                product_price: data.productPrice || null,
                product_down_payment: data.productDownPayment || null,
                total_amount: data.totalAmount || null,
                interest_rate_at_apply: data.interestRateAtApply,
                loan_period: data.loanPeriod,
                total_interest: data.totalInterest || null,
                fee: data.fee,
                monthly_pay: data.monthlyPay,
                first_installment_amount: data.firstInstallmentAmount,
                payment_day: data.paymentDay,
                motor_id: data.motorId || null,
                motor_color: data.motorColor || null,
                tank_number: data.tankNumber || null,
                motor_warranty: data.motorWarranty || null,
                partner_id: data.partner_id || null,
                shop_branch: data.shopBranch,
                shop_id: data.shopId,
                ref_Type: data.ref_Type,
                ref_name: data.refName,
                ref_date_of_birth: data.refDateOfBirth || null,
                ref_phone: data.refPhone,
                ref_sex: data.refSex,
                ref_marital_status: data.refMaritalStatus,
                ref_id_pass_number: data.refIdPassNumber,
                ref_id_pass_date_start: data.refIdPassDate || null,
                ref_id_pass_date_expired: data.refIdPassExpiryDate || null,
                ref_census_number: data.refCensusNumber || null,
                ref_census_created: data.refCensusCreated || null,
                ref_census_authorize_by: data.refCensusAuthorizeBy,
                ref_house_number: data.refHouseNumber,
                ref_unit: data.refUnit,
                ref_address: `${data.refAddress} ${data.refDistrictName || ''} ${data.refProvinceName || ''}`.trim(),
                ref_province_id: data.refProvinceId || null,
                ref_district_id: data.refDistrictId || null,
                ref_lived_year: data.refLivedYear,
                ref_lived_with: data.refLivedWith,
                ref_lived_situation: data.refLivedSituation,
                ref_occupation: data.refOccupation || null,
                ref_relationship: data.refRelationship || null,
                ref_company_name: data.refCompanyName || null,
                ref_company_businessType: data.refCompanyBusinessType,
                ref_company_location: data.refCompanyLocation,
                ref_company_workYear: data.refCompanyWorkYear,
                ref_position: data.refPosition,
                ref_income: data.refIncome || null,
                ref_payroll_date: data.refPayrollDate || null,
                ref_company_emp_number: data.refCompanyEmpNumber,
                ref_income_other: data.refIncomeOther || null,
                ref_income_other_source: data.refIncomeOtherSource,
                is_confirmed: data.isConfirmed !== undefined ? data.isConfirmed : 0
            };

            if (existingContract) {
                // ✅ CASE: UPDATE
                console.log('📝 Loan Contract info exists, updating...');
                const oldContractData = existingContract.toJSON();
                loanContractData.version = (existingContract.version || 1) + 1;
                loanContractData.updated_by = performedBy;

                await existingContract.update(loanContractData, { transaction: t });
                loan_contract = existingContract;
                await logAudit('loan_contract', existingContract.id, 'UPDATE', oldContractData, loanContractData, performedBy, t);

            } else {
                // ✅ CASE: CREATE 
                console.log('📝 Loan Contract info does not exist, creating new...');
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();

                const lastloanContract = await db.loan_contract.findOne({
                    order: [['id', 'DESC']],
                    attributes: ['loan_contract_number'],
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                let contractNumber = 1;
                if (lastloanContract?.loan_contract_number) {
                    const parts = lastloanContract.loan_contract_number.split('-');
                    const lastNum = parseInt(parts[parts.length - 1], 10);
                    if (!isNaN(lastNum)) contractNumber = lastNum + 1;
                }
                const formattedNumber = `LC-${currentYear}-${String(contractNumber).padStart(6, '0')}`;

                loanContractData.loan_contract_number = formattedNumber;
                loanContractData.created_by = performedBy;
                loanContractData.version = 1;

                loan_contract = await db.loan_contract.create(loanContractData, { transaction: t });
                await logAudit('loan_contract', loan_contract.id, 'CREATE', null, loanContractData, performedBy, t);

                await generateSignatureSlots(data.loan_id, 'contract', loan_contract.id, t);
            }

            // ==========================================
            // 🌟 CASCADING UPDATES ໄປຫາ CHECKLIST 
            // ==========================================
            const newSalary = loanContractData.cus_income !== null ? Number(loanContractData.cus_income) : null;
            const newOtherIncome = loanContractData.cus_income_other !== null ? Number(loanContractData.cus_income_other) : null;
            const newMonthlyPay = loanContractData.monthly_pay !== null ? Number(loanContractData.monthly_pay) : null;

            const newWorkYear = loanContractData.cus_company_workYear !== null && loanContractData.cus_company_workYear !== undefined ? Number(loanContractData.cus_company_workYear) : null;
            const newWorkMonth = loanContractData.cus_company_workMonth !== undefined ? Number(loanContractData.cus_company_workMonth) : null;

            if (newSalary !== null || newOtherIncome !== null || newMonthlyPay !== null || newWorkYear !== null || newWorkMonth !== null) {

                // 1. Sync ກັບ loan_basic_verifications
                if (newSalary !== null || newWorkYear !== null || newWorkMonth !== null) {
                    const basicVerif = await db.loan_basic_verifications.findOne({
                        where: { application_id: data.loan_id },
                        transaction: t,
                        lock: t.LOCK.UPDATE
                    });

                    if (basicVerif) {
                        const bvPayload: any = {};
                        let isBvChanged = false;

                        if (newSalary !== null && Number(basicVerif.work_salary) !== newSalary) {
                            bvPayload.work_salary = newSalary;
                            isBvChanged = true;
                        }
                        if (newWorkYear !== null && Number(basicVerif.work_years) !== newWorkYear) {
                            bvPayload.work_years = newWorkYear;
                            isBvChanged = true;
                        }
                        if (newWorkMonth !== null && Number(basicVerif.work_months) !== newWorkMonth) {
                            bvPayload.work_months = newWorkMonth;
                            isBvChanged = true;
                        }

                        if (isBvChanged) {
                            const oldBvData = basicVerif.toJSON();
                            await basicVerif.update(bvPayload, { transaction: t });
                            await logAudit('loan_basic_verifications', basicVerif.id, 'UPDATE', oldBvData, bvPayload, performedBy, t);
                            logger.info(`Synced salary & work duration to loan_basic_verifications for Loan ID: ${data.loan_id}`);
                        }
                    }
                }

                // 2. Sync ກັບ loan_income_assessments
                const incomeAsses = await db.loan_income_assessments.findOne({
                    where: { application_id: data.loan_id },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (incomeAsses) {
                    const iaPayload: any = {};
                    let isIaChanged = false;

                    if (newSalary !== null && Number(incomeAsses.average_monthly_income) !== newSalary) {
                        iaPayload.average_monthly_income = newSalary;
                        isIaChanged = true;
                    }

                    if (newOtherIncome !== null && Number(incomeAsses.other_verified_income) !== newOtherIncome) {
                        iaPayload.other_verified_income = newOtherIncome;
                        isIaChanged = true;
                    }

                    if (newMonthlyPay !== null && Number(incomeAsses.proposed_installment) !== newMonthlyPay) {
                        iaPayload.proposed_installment = newMonthlyPay;
                        isIaChanged = true;
                    }

                    if (isIaChanged) {
                        const currentAvg = iaPayload.average_monthly_income !== undefined ? iaPayload.average_monthly_income : Number(incomeAsses.average_monthly_income || 0);
                        const currentOther = iaPayload.other_verified_income !== undefined ? iaPayload.other_verified_income : Number(incomeAsses.other_verified_income || 0);
                        const currentProposed = iaPayload.proposed_installment !== undefined ? iaPayload.proposed_installment : Number(incomeAsses.proposed_installment || 0);

                        iaPayload.total_verified_income = currentAvg + currentOther;

                        const actualDebtBurden = Number(incomeAsses.existing_debt_payments || 0)
                            + Number(incomeAsses.internal_active_installments || 0)
                            + currentProposed;

                        iaPayload.dsr_percentage = iaPayload.total_verified_income > 0 ? (actualDebtBurden / iaPayload.total_verified_income) * 100 : 0;

                        const oldIaData = incomeAsses.toJSON();
                        await incomeAsses.update(iaPayload, { transaction: t });
                        await logAudit('loan_income_assessments', incomeAsses.id, 'UPDATE', oldIaData, iaPayload, performedBy, t);
                        logger.info(`Synced income and DSR to loan_income_assessments for Loan ID: ${data.loan_id}`);
                    }
                }
            }

            // ==========================================
            // 🌟 ອັບເດດ Gender ເຂົ້າຕາຕະລາງ Customers 
            // ==========================================
            if (loanContractData.cus_sex) {
                const loanApp = await db.loan_applications.findByPk(data.loan_id, { transaction: t, attributes: ['customer_id'] });

                if (loanApp && loanApp.customer_id) {
                    const customer = await db.customers.findByPk(loanApp.customer_id, { transaction: t, lock: t.LOCK.UPDATE });

                    if (customer) {
                        let genderToUpdate: 'Female' | 'Male' | null = null;
                        const sexInput = loanContractData.cus_sex.toLowerCase();

                        if (sexInput === 'male' || sexInput === 'ຊາຍ') {
                            genderToUpdate = 'Male';
                        } else if (sexInput === 'female' || sexInput === 'ຍິງ') {
                            genderToUpdate = 'Female';
                        }

                        if (genderToUpdate && customer.gender !== genderToUpdate) {
                            const oldCusData = customer.toJSON();
                            // 🟢 ໃຊ້ Type Assertion (as 'Female' | 'Male') ປ້ອງກັນ TypeScript Error
                            await customer.update({ gender: genderToUpdate as 'Female' | 'Male' }, { transaction: t });
                            await logAudit('customers', customer.id, 'UPDATE', oldCusData, { gender: genderToUpdate }, performedBy, t);
                            logger.info(`Synced gender (${genderToUpdate}) to customers table for Customer ID: ${customer.id}`);
                        }
                    }
                }
            }

            // Auto-Sign ສຳລັບພະນັກງານສິນເຊື່ອ (Maker)
            const staffUser = await db.users.findByPk(performedBy, { transaction: t });
            const staffName = staffUser ? (staffUser.full_name || staffUser.username) : 'ພະນັກງານສິນເຊື່ອ';

            await db.document_signatures.update(
                {
                    user_id: performedBy,
                    signer_name: staffName,
                    status: 'signed',
                    signed_at: new Date()
                },
                {
                    where: {
                        application_id: data.loan_id,
                        document_type: 'contract',
                        reference_id: loan_contract.id,
                        role_type: 'credit_staff'
                    },
                    transaction: t
                }
            );

            await t.commit();
            console.log('✅ Loan Contract created/updated successfully:', loan_contract.id);

            return {
                success: true,
                message: existingContract ? 'Loan Contract updated successfully' : 'Loan Contract created successfully',
                data: loan_contract
            }

        } catch (error: any) {
            if (t && !(t as any).finished) await t.rollback();
            logger.error('Create Loan Contract Error:', (error as Error).message);
            throw error;
        }
    }

    async getLoanContract(loan_id: number) {
        try {
            const loanContract = await db.loan_contract.findOne({
                where: { loan_id }, include: [{
                    model: db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }, {
                    model: db.product_types,
                    as: 'producttype',
                    attributes: ['id', 'type_name']
                }],
                raw: true
            });
            return {
                success: true,
                data: loanContract,
                message: 'Loan Contract retrieved successfully'
            };
        } catch (error: any) {
            logger.error('Get Loan Contract Error:', (error as Error).message);
            throw error;
        }
    }

    async updateLoanContract(updateData: any) {
        const t = await db.sequelize.transaction();
        try {
            const existingContract = await db.loan_contract.findOne({
                where: { loan_id: updateData.loan_id },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!existingContract) {
                throw new Error('Loan Contract not found for update');
            }

            const oldContractData = existingContract.toJSON();

            // 🟢 1. Mapping ຂໍ້ມູນທີ່ຈະອັບເດດ (ລວມທັງ cusIncome, cusIncomeOther ແລະ Work Years/Months)
            const allowedFields = [
                'cusPhone', 'cusAddress', 'cusOccupation', 'payment_day',
                'refPhone', 'refAddress', 'refOccupation',
                'cusIncome', 'cusIncomeOther',
                'cusCompanyWorkYear', 'cusCompanyWorkMonth' // 🌟 ເພີ່ມອາຍຸການເຮັດວຽກ
            ];
            const updatedFields: any = {};

            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    if (field === 'cusIncome') updatedFields.cus_income = updateData[field];
                    else if (field === 'cusIncomeOther') updatedFields.cus_income_other = updateData[field];
                    else if (field === 'cusCompanyWorkYear') updatedFields.cus_company_workYear = updateData[field];
                    else if (field === 'cusCompanyWorkMonth') updatedFields.cus_company_workMonth = updateData[field];
                    else updatedFields[field] = updateData[field];
                }
            });

            if (Object.keys(updatedFields).length === 0) {
                throw new Error('No valid fields provided for update');
            }

            // ອັບເດດລົງສັນຍາຫຼັກ
            await existingContract.update(updatedFields, { transaction: t });

            const performedBy = updateData.performed_by || updateData.user_id || 1;
            await logAudit('loan_contract', existingContract.id, 'UPDATE', oldContractData, updatedFields, performedBy, t);

            // ==========================================
            // 🌟 2. CASCADING UPDATES ໄປຫາ CHECKLIST
            // ==========================================
            const newSalary = updatedFields.cus_income !== undefined ? Number(updatedFields.cus_income) : null;
            const newOtherIncome = updatedFields.cus_income_other !== undefined ? Number(updatedFields.cus_income_other) : null;
            const newWorkYear = updatedFields.cus_company_workYear !== undefined ? Number(updatedFields.cus_company_workYear) : null;
            const newWorkMonth = updatedFields.cus_company_workMonth !== undefined ? Number(updatedFields.cus_company_workMonth) : null;

            if (newSalary !== null || newOtherIncome !== null || newWorkYear !== null || newWorkMonth !== null) {

                // --- Sync ໄປ loan_basic_verifications ---
                if (newSalary !== null || newWorkYear !== null || newWorkMonth !== null) {
                    const basicVerif = await db.loan_basic_verifications.findOne({
                        where: { application_id: updateData.loan_id },
                        transaction: t,
                        lock: t.LOCK.UPDATE
                    });

                    if (basicVerif) {
                        const bvPayload: any = {};
                        let isBvChanged = false;

                        if (newSalary !== null && Number(basicVerif.work_salary) !== newSalary) {
                            bvPayload.work_salary = newSalary;
                            isBvChanged = true;
                        }
                        if (newWorkYear !== null && Number(basicVerif.work_years) !== newWorkYear) {
                            bvPayload.work_years = newWorkYear;
                            isBvChanged = true;
                        }
                        if (newWorkMonth !== null && Number(basicVerif.work_months) !== newWorkMonth) {
                            bvPayload.work_months = newWorkMonth;
                            isBvChanged = true;
                        }

                        if (isBvChanged) {
                            const oldBvData = basicVerif.toJSON();
                            await basicVerif.update(bvPayload, { transaction: t });
                            await logAudit('loan_basic_verifications', basicVerif.id, 'UPDATE', oldBvData, bvPayload, performedBy, t);
                            logger.info(`Synced work details to loan_basic_verifications for Loan ID: ${updateData.loan_id}`);
                        }
                    }
                }

                // --- Sync ໄປ loan_income_assessments ---
                const incomeAsses = await db.loan_income_assessments.findOne({
                    where: { application_id: updateData.loan_id },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (incomeAsses) {
                    const iaPayload: any = {};
                    let isIaChanged = false;

                    if (newSalary !== null && Number(incomeAsses.average_monthly_income) !== newSalary) {
                        iaPayload.average_monthly_income = newSalary;
                        isIaChanged = true;
                    }

                    if (newOtherIncome !== null && Number(incomeAsses.other_verified_income) !== newOtherIncome) {
                        iaPayload.other_verified_income = newOtherIncome;
                        isIaChanged = true;
                    }

                    if (isIaChanged) {
                        const currentAvg = iaPayload.average_monthly_income !== undefined ? iaPayload.average_monthly_income : Number(incomeAsses.average_monthly_income || 0);
                        const currentOther = iaPayload.other_verified_income !== undefined ? iaPayload.other_verified_income : Number(incomeAsses.other_verified_income || 0);

                        iaPayload.total_verified_income = currentAvg + currentOther;

                        const actualDebtBurden = Number(incomeAsses.existing_debt_payments || 0)
                            + Number(incomeAsses.internal_active_installments || 0)
                            + Number(incomeAsses.proposed_installment || 0);

                        iaPayload.dsr_percentage = iaPayload.total_verified_income > 0 ? (actualDebtBurden / iaPayload.total_verified_income) * 100 : 0;

                        const oldIaData = incomeAsses.toJSON();
                        await incomeAsses.update(iaPayload, { transaction: t });
                        await logAudit('loan_income_assessments', incomeAsses.id, 'UPDATE', oldIaData, iaPayload, performedBy, t);
                        logger.info(`Synced income and DSR to loan_income_assessments for Loan ID: ${updateData.loan_id}`);
                    }
                }
            }
            // ==========================================

            await t.commit();

            return {
                success: true,
                message: 'Loan Contract updated successfully',
                data: existingContract
            };

        } catch (error: any) {
            if (t && !(t as any).finished) await t.rollback();
            logger.error('Update Loan Contract Error:', (error as Error).message);
            throw error;
        }
    }
}

export default new LoanContractService();