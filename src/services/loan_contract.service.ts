import { db } from '../models/init-models';
import { logger } from '../utils/logger';

class LoanContractService {
    async createLoanContract(data: any) {
        const t = await db.sequelize.transaction();
        try {
            if (!data.loan_id) {
                throw new Error('loan_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            let loan_contract = null;

            // 1. เช็คก่อนว่ามี Contract นี้อยู่ในระบบหรือยัง
            const existingContract = await db.loan_contract.findOne({
                where: { loan_id: data.loan_id },
                transaction: t
            });

            // 2. เตรียมข้อมูลที่จะใช้ Save / Update (สังเกตว่าจะยังไม่มี loan_contract_number)
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
                cus_census_create: data.cusCensusCreated || null,
                cus_census_authorize_by: data.cusCensusAuthorizeBy,
                cus_house_number: data.cusHouseNumber,
                cus_unit: data.cusUnit,
                cus_address: data.cusAddress,
                cus_lived_year: data.cusLivedYear,
                cus_lived_with: data.cusLivedWith,
                cus_lived_situation: data.cusLivedSituation,
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
                ref_address: data.refAddress,
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
            };

            if (existingContract) {
                // ✅ CASE: UPDATE (มีข้อมูลอยู่แล้ว จะไม่อัปเดต loan_contract_number)
                console.log('📝 Loan Contract info exists, updating...');
                await db.loan_contract.update(loanContractData, {
                    where: { loan_id: data.loan_id },
                    transaction: t
                });

                // ดึงข้อมูลที่เพิ่งอัปเดตเสร็จมาเพื่อส่งกลับไปให้ Frontend
                loan_contract = await db.loan_contract.findOne({
                    where: { loan_id: data.loan_id },
                    transaction: t
                });

            } else {
                // ✅ CASE: CREATE (ยังไม่มีข้อมูล ต้อง Gen เลขที่สัญญาใหม่)
                console.log('📝 Loan Contract info does not exist, creating new...');

                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();

                const lastloanContract = await db.loan_contract.findOne({
                    order: [['id', 'DESC']],
                    attributes: ['loan_contract_number'],
                    transaction: t
                });

                let contractNumber = 1;
                if (lastloanContract?.loan_contract_number) {
                    const parts = lastloanContract.loan_contract_number.split('-');
                    const lastNum = parseInt(parts[parts.length - 1], 10);
                    if (!isNaN(lastNum)) contractNumber = lastNum + 1;
                }
                const formattedNumber = `LC-${currentYear}-${String(contractNumber).padStart(6, '0')}`;

                // เพิ่มเลขที่สัญญาเข้าไปใน Object ก่อน Save
                loanContractData.loan_contract_number = formattedNumber;

                loan_contract = await db.loan_contract.create(loanContractData, { transaction: t });
            }

            await t.commit();
            console.log('✅ Loan Contract created/updated successfully:', loan_contract);

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
                where: { loan_id },
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