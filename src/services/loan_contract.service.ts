import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Transaction } from "sequelize";
import { logAudit } from '../utils/auditLogger';
import { generateSignatureSlots } from '../utils/signatureGenerator';

class LoanContractService {

    // ==========================================
    // 🟢 HELPER FUNCTION: ສຳລັບບັນທຶກ Audit Log
    // ==========================================
    // private async logAudit(
    //     tableName: string,
    //     recordId: number,
    //     action: 'CREATE' | 'UPDATE' | 'DELETE',
    //     oldValues: any,
    //     newValues: any,
    //     performedBy: number,
    //     t: Transaction
    // ) {
    //     let changedColumns: any = undefined;

    //     if (action === 'UPDATE' && oldValues && newValues) {
    //         const changes: string[] = [];
    //         for (const key in newValues) {
    //             if (newValues[key] !== undefined && oldValues[key] != newValues[key]) {
    //                 changes.push(key);
    //             }
    //         }
    //         if (changes.length === 0) return;
    //         changedColumns = changes; 
    //     }

    //     await db.audit_logs.create({
    //         table_name: tableName,
    //         record_id: recordId,
    //         action: action,
    //         old_values: oldValues || undefined,
    //         new_values: newValues || undefined,
    //         changed_columns: changedColumns,
    //         performed_by: performedBy
    //     }, { transaction: t });
    // }

    async createLoanContract(data: any) {
        const t = await db.sequelize.transaction();
        try {
            if (!data.loan_id) {
                throw new Error('loan_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 🟢 ID ຂອງພະນັກງານທີ່ເຮັດລາຍການ
            const performedBy = data.user_id || data.performed_by || 1;

            let loan_contract = null;

            const existingContract = await db.loan_contract.findOne({
                where: { loan_id: data.loan_id },
                transaction: t,
                lock: t.LOCK.UPDATE // 🔒 Lock ຂໍ້ມູນແລະສະແດງວ່າກຳລັງແກ້ໄຂ
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
                cus_id_pass_date: data.cusIdPassDate || null,
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
                cus_position: data.cusPosition,
                cus_income: data.cusIncome || null,
                cus_payroll_date: data.cusPayrollDate || null,
                cus_company_emp_number: data.cusCompanyEmpNumber,
                cus_income_other: data.cusIncomeOther || null,
                cus_income_other_source: data.cusIncomeOtherSource,
                product_detail: data.productDetail,
                producttype_id: data.producttypeId || null,
                product_brand: data.productBrand,
                product_model: data.productModel,
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
                partner_id: data.partnerId || null,
                shop_branch: data.shopBranch,
                shop_id: data.shopId,
                ref_name: data.refName,
                ref_date_of_birth: data.refDateOfBirth || null,
                ref_phone: data.refPhone,
                ref_sex: data.refSex,
                ref_marital_status: data.refMaritalStatus,
                ref_id_pass_number: data.refIdPassNumber,
                ref_id_pass_date: data.refIdPassDate || null,
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
                
                // 🟢 ອັບເດດ Version (+1) ແລະ ບັນທຶກຜູ້ທີ່ແກ້ໄຂ
                loanContractData.version = (existingContract.version || 1) + 1;
                loanContractData.updated_by = performedBy;

                await existingContract.update(loanContractData, { transaction: t });
                loan_contract = existingContract;

                // (ສົມມຸດວ່າມີການ Import logAudit ມາໃຊ້ງານແລ້ວ)
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
                    lock: t.LOCK.UPDATE // 🔒 Lock ຂໍ້ມູນແລະສະແດງວ່າກຳລັງແກ້ໄຂ
                });

                let contractNumber = 1;
                if (lastloanContract?.loan_contract_number) {
                    const parts = lastloanContract.loan_contract_number.split('-');
                    const lastNum = parseInt(parts[parts.length - 1], 10);
                    if (!isNaN(lastNum)) contractNumber = lastNum + 1;
                }
                const formattedNumber = `LC-${currentYear}-${String(contractNumber).padStart(6, '0')}`;

                loanContractData.loan_contract_number = formattedNumber;

                // 🟢 ບັນທຶກຜູ້ສ້າງ ແລະ ຕັ້ງຄ່າ Version ທຳອິດ
                loanContractData.created_by = performedBy;
                loanContractData.version = 1;

                loan_contract = await db.loan_contract.create(loanContractData, { transaction: t });

                await logAudit('loan_contract', loan_contract.id, 'CREATE', null, loanContractData, performedBy, t);

                // ==========================================
                // 🌟 🟢 ສ້າງຊ່ອງລາຍເຊັນລໍຖ້າໄວ້ (Pending Signatures) ສຳລັບສັນຍາໃໝ່
                // ==========================================
                await generateSignatureSlots(
                    data.loan_id, 
                    'contract', 
                    loan_contract.id, // ໃຊ້ ID ຂອງສັນຍາທີ່ຫາກໍ່ສ້າງສຳເລັດເປັນ Reference
                    t
                );
            }

            await t.commit();
            console.log('✅ Loan Contract created/updated successfully:', loan_contract.id);

            return {
                success: true,
                message: existingContract ? 'Loan Contract updated successfully' : 'Loan Contract created successfully',
                data: loan_contract
            }

        } catch (error: any) {
            await t.rollback();
            logger.error('Create Loan Contract Error:', (error as Error).message);
            logger.error(`Error stack: ${(error as Error).stack}`);
            logger.error(`Error data: ${JSON.stringify(data)}`);
            throw error;
        }
    }

    async getLoanContract(loan_id: number) {
        try {
            const loanContract = await db.loan_contract.findOne({
                where: { loan_id }, include: [ {
                    model: db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                },{
                    model: db.product_types,
                    as: 'producttype',
                    attributes: ['id', 'type_name']
                } ],
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
}

export default new LoanContractService();