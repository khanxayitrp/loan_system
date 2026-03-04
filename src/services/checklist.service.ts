
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

class CheckListService {
    async CreateBasicVerification(data: any) {
        const t = await db.sequelize.transaction();
        try {
            // 1. ກວດສອບ loan_id (application_id)
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 2. ຈັດການຂໍ້ມູນໃຫ້ເປັນ Array ສະເໝີ (ຮອງຮັບທັງການສົ່ງມາດຽວໆ ແລະ ສົ່ງມາເປັນ Array)
            let basic_verification = null;
            let customer_info = null;

            // ============================================
            // ✅ 1. ตรวจสอบและสร้าง/อัปเดต Basic Verification
            // ============================================

            const checkLoanApp = await db.loan_applications.findByPk(loan_id, { transaction: t });

            if (!checkLoanApp) {
                throw new Error('Loan application not found');
            }
            const existingCustomer = await db.customers.findByPk(checkLoanApp.customer_id, { transaction: t });
            

            const existingBasicVerification = await db.loan_basic_verifications.findOne({
                where: { application_id: loan_id },
                transaction: t
            });

            const basicVerificationData: any = {
                application_id: loan_id,
                cus_contact_method: data.cusContactMethod || data.cus_contact_method || null,
                verified_first_name: data.verifiedFirstName || data.verified_first_name || null,
                verified_last_name: data.verifiedLastName || data.verified_last_name || null,
                verified_dob: data.verifiedDob || data.verified_dob || null,
                verified_address: data.verifiedAddress || data.verified_address || null,
                verified_product_type: data.verifiedProductType || data.verified_product_type || null,
                verified_price: data.verifiedPrice || data.verified_price || null,
                verified_down_payment: data.verifiedDownPayment || data.verified_down_payment || null,
                verified_monthly_pay: data.verifiedMonthlyPay || data.verified_monthly_pay || null,
                has_id_card: data.hasIdCard || data.has_id_card || null,
                has_census_book: data.hasCensusBook || data.has_census_book || null,
                has_income_doc: data.hasIncomeDoc || data.has_income_doc || null,
                has_other_doc: data.hasOtherDoc || data.has_other_doc || null,
                other_doc_detail: data.otherDocDetail || data.other_doc_detail || null,
                cus_credibility_assessment: data.cusCredibilityAssessment || data.cus_credibility_assessment || null,
                work_company_name: data.workCompanyName || data.work_company_name || null,
                work_position: data.workPosition || data.work_position || null,
                work_salary: data.workSalary || data.work_salary || null,
                work_years: data.workYears || data.work_years || null,
                workplace_assessment: data.workplaceAssessment || data.workplace_assessment || null,
                status: data.status || null,
                verified_by: data.verifiedBy || data.verified_by || null
            }

            if (existingBasicVerification) {
                console.log('📝 Basic verification exists, updating...');
                await existingBasicVerification.update(basicVerificationData, { transaction: t });
                basic_verification = existingBasicVerification;
            } else {
                console.log('📝 Creating new basic verification...');
                basic_verification = await db.loan_basic_verifications.create(basicVerificationData, { transaction: t });
            }

            if (existingCustomer) {
                customer_info = await existingCustomer.update({
                    first_name: data.verifiedFirstName || data.verified_first_name,
                    last_name: data.verifiedLastName || data.verified_last_name,
                    date_of_birth: data.verifiedDob || data.verified_dob || null,
                    address: data.verifiedAddress || data.verified_address || null
                }, { transaction: t });

                const existingCustomerWorkInfo = await db.customer_work_info.findOne({
                    where: { customer_id: existingCustomer.id },
                    transaction: t
                });
                if (existingCustomerWorkInfo) {
                    await existingCustomerWorkInfo.update({
                        company_name: data.workCompanyName || data.work_company_name,
                        position: data.workPosition || data.work_position,
                        salary: data.workSalary || data.work_salary,
                        duration_years: data.workYears || data.work_years
                    }, { transaction: t });
                }
            }

            // 5. ຈົບ Transaction
            await t.commit();
            console.log('✅ Basic verifications saved successfully!');
            return {
                success: true,
                message: 'Basic verification saved successfully',
                data: basic_verification
            }

        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error saving basic verification:', error);
            return {
                success: false,
                message: error.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການຢືມເງິນ',
                data: null
            };
        }
    }
    async GetBasicVerificationByLoanId(loan_id: number) {
        try {
            const basic_verification = await db.loan_basic_verifications.findOne({
                where: { application_id: loan_id },
                raw: true
            });
            return {
                success: true,
                message: 'Basic verification retrieved successfully',
                data: basic_verification
            };
        } catch (error: any) {
            console.error('❌ Error retrieving basic verification:', error);
            return {
                success: false,
                message: 'Error retrieving basic verification',
                data: null
            };
        }
    }
    async CreateCallVerification(data: any) {
        const t = await db.sequelize.transaction();
        try {
            // 1. ກວດສອບ loan_id (application_id)
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 2. ຈັດການຂໍ້ມູນໃຫ້ເປັນ Array ສະເໝີ (ຮອງຮັບທັງການສົ່ງມາດຽວໆ ແລະ ສົ່ງມາເປັນ Array)
            let callsData = [];
            if (data.calls && Array.isArray(data.calls)) {
                callsData = data.calls;
            } else if (Array.isArray(data)) {
                callsData = data;
            } else {
                callsData = [data]; // ຖ້າສົ່ງມາເປັນ Object ດຽວ ໃຫ້ຈັບໃສ່ Array
            }

            const processedCalls = [];
            const incomingIds = []; // ເກັບ ID ທີ່ສົ່ງມາເພື່ອເອົາໄປທຽບລຶບອັນທີ່ຖືກລຶບອອກ

            // 3. Loop ບັນທຶກ ຫຼື ອັບເດດຂໍ້ມູນແຕ່ລະແຖວ
            for (const call of callsData) {
                // Map ຂໍ້ມູນໃຫ້ກົງກັບ Database (ຮອງຮັບທັງ camelCase ແລະ snake_case ຈາກ Frontend)
                const payload = {
                    application_id: loan_id,
                    call_target: call.call_target || call.callTarget,
                    contact_name: call.contact_name || call.contactName || null,
                    contact_phone: call.contact_phone || call.contactPhone || null,
                    relationship: call.relationship || null,
                    is_info_matching: call.is_info_matching !== undefined ? call.is_info_matching : (call.isInfoMatching || null),
                    has_debt_history_known: call.has_debt_history_known !== undefined ? call.has_debt_history_known : (call.hasDebtHistoryKnown || null),
                    remark: call.remark || null,
                    call_status: call.call_status || call.callStatus || 'completed',
                    called_by: data.called_by || call.called_by || data.calledBy // ໄອດີພະນັກງານທີ່ກົດບັນທຶກ
                };

                if (call.id) {
                    // ✅ CASE: UPDATE (ມີ ID ຢູ່ແລ້ວ)
                    await db.loan_call_verifications.update(payload, {
                        where: { id: call.id },
                        transaction: t
                    });
                    incomingIds.push(call.id); // ເກັບ ID ໄວ້

                    const updatedCall = await db.loan_call_verifications.findByPk(call.id, { transaction: t });
                    processedCalls.push(updatedCall);
                } else {
                    // ✅ CASE: CREATE (ຍັງບໍ່ມີ ID ໝາຍຄວາມວ່າພະນັກງານກົດເພີ່ມແຖວໃໝ່)
                    const newCall = await db.loan_call_verifications.create(payload, { transaction: t });
                    incomingIds.push(newCall.id); // ເກັບ ID ໃໝ່ໄວ້
                    processedCalls.push(newCall);
                }
            }

            // 4. ລຶບຂໍ້ມູນເກົ່າທີ່ບໍ່ໄດ້ສົ່ງມາໃນ Array ແລ້ວ (ພະນັກງານກົດລຶບແຖວຖິ້ມໃນ Frontend)
            if (incomingIds.length > 0) {
                await db.loan_call_verifications.destroy({
                    where: {
                        application_id: loan_id,
                        id: { [Op.notIn]: incomingIds } // ລຶບ ID ທີ່ບໍ່ຢູ່ໃນລາຍການທີ່ສົ່ງມາ
                    },
                    transaction: t
                });
            } else {
                // ຖ້າສົ່ງ Array ວ່າງໆມາ ແປວ່າລຶບອອກໝົດທຸກແຖວ
                await db.loan_call_verifications.destroy({
                    where: { application_id: loan_id },
                    transaction: t
                });
            }
            // 5. ຈົບ Transaction
            await t.commit();
            console.log('✅ Call verifications saved successfully! Total records:', processedCalls.length);
            return {
                success: true,
                message: 'Basic verification saved successfully',
                data: processedCalls
            }

        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error saving call verification:', error);
            return {
                success: false,
                message: error.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການໂທ',
                data: null
            };
        }
    }
    async CreateCIBVerification(data: any) {
        const t = await db.sequelize.transaction();
        try {
            if (!data.loan_id) {
                throw new Error('loan_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            let cib_verification = null;

            const existingCIBVerification = await db.loan_cib_checks.findOne({
                where: { application_id: data.loan_id },
                transaction: t
            })

            const cibVerificationData: any = {
                application_id: data.loan_id,
                good_history_count: data.goodHistoryCount || null,
                good_history_institutions: data.goodHistoryInstitutions || null,
                bad_history_count: data.badHistoryCount || null,
                bad_history_institutions: data.badHistoryInstitutions || null,
                is_existing_customer: data.isExistingCustomer || null,
                existing_customer_status: data.existingCustomerStatus || null,
                cib_report_file: data.cibReportFile || null,
                remark: data.remark || null,
                checked_by: data.checkedBy || data.checked_by || null
            }

            if (existingCIBVerification) {
                console.log('📝 CIB verification exists, updating...');
                await existingCIBVerification.update(cibVerificationData, { transaction: t });
                cib_verification = existingCIBVerification;
            } else {
                console.log('📝 Creating new CIB verification...');
                cib_verification = await db.loan_cib_checks.create(cibVerificationData, { transaction: t });
            }

            await t.commit();
            console.log('✅ CIB verification saved successfully!');
            return {
                success: true,
                message: 'CIB verification saved successfully',
                data: cib_verification
            }
        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error saving CIB verification:', error);
            return {
                success: false,
                message: 'Error saving CIB verification',
                data: null
            }
        }
    }
    async CreateFieldVisits(data: any) {
        const t = await db.sequelize.transaction();
        try {
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            let field_visit = [];
            if (data.visits && Array.isArray(data.visits)) {
                field_visit = data.visits;
            } else if (Array.isArray(data)) {
                field_visit = data;
            } else {
                field_visit = [data]; // ຖ້າສົ່ງມາເປັນ Object ດຽວ ໃຫ້ຈັບໃສ່ Array
            }

            const processedFieldVisits = [];
            const incomingIds = []; // ເກັບ ID ທີ່ສົ່ງມາເພື່ອເອົາໄປທຽບລຶບອັນທີ່ຖືກລຶບອອກ

            // 3. Loop ບັນທຶກ ຫຼື ອັບເດດຂໍ້ມູນແຕ່ລະແຖວ
            for (const field of field_visit) {
                // Map ຂໍ້ມູນໃຫ້ກົງກັບ Database (ຮອງຮັບທັງ camelCase ແລະ snake_case ຈາກ Frontend)
                const payload = {
                    application_id: loan_id,
                    visit_type: field.visit_type || field.visitType,
                    visit_date: field.visit_date || field.visitDate,
                    latitude: field.latitude || null,
                    longitude: field.longitude || null,
                    living_condition: field.living_condition || field.livingCondition || null,
                    is_address_correct: field.is_address_correct || field.isAddressCorrect || null,
                    photo_url_1: field.photo_url_1 || field.photoUrl1 || null,
                    photo_url_2: field.photo_url_2 || field.photoUrl2 || null,
                    remarks: field.remarks || field.remarks || null,
                    visited_by: data.visited_by || field.visited_by || data.visitedBy // ໄອດີພະນັກງານທີ່ກົດບັນທຶກ
                };

                if (field.id) {
                    // ✅ CASE: UPDATE (ມີ ID ຢູ່ແລ້ວ)
                    await db.loan_field_visits.update(payload, {
                        where: { id: field.id },
                        transaction: t
                    });
                    incomingIds.push(field.id); // ເກັບ ID ໄວ້

                    const updatedFieldVisit = await db.loan_field_visits.findByPk(field.id, { transaction: t });
                    processedFieldVisits.push(updatedFieldVisit);
                } else {
                    // ✅ CASE: CREATE (ຍັງບໍ່ມີ ID ໝາຍຄວາມວ່າພະນັກງານກົດເພີ່ມແຖວໃໝ່)
                    const newFieldVisit = await db.loan_field_visits.create(payload, { transaction: t });
                    incomingIds.push(newFieldVisit.id); // ເກັບ ID ໃໝ່ໄວ້
                    processedFieldVisits.push(newFieldVisit);
                }
            }

            // 4. ລຶບຂໍ້ມູນເກົ່າທີ່ບໍ່ໄດ້ສົ່ງມາໃນ Array ແລ້ວ (ພະນັກງານກົດລຶບແຖວຖິ້ມໃນ Frontend)
            if (incomingIds.length > 0) {
                await db.loan_field_visits.destroy({
                    where: {
                        application_id: loan_id,
                        id: { [Op.notIn]: incomingIds } // ລຶບ ID ທີ່ບໍ່ຢູ່ໃນລາຍການທີ່ສົ່ງມາ
                    },
                    transaction: t
                });
            } else {
                // ຖ້າສົ່ງ Array ວ່າງໆມາ ແປວ່າລຶບອອກໝົດທຸກແຖວ
                await db.loan_field_visits.destroy({
                    where: { application_id: loan_id },
                    transaction: t
                });
            }

            // 5. ຈົບ Transaction
            await t.commit();
            console.log('✅ Field visits saved successfully! Total records:', processedFieldVisits.length);

            return {
                success: true,
                message: 'Field visits saved successfully',
                data: processedFieldVisits
            };
        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error saving Field Visit:', error);
            return {
                success: false,
                message: 'Error saving Field Visit',
                data: null
            }
        }
    }

    async CreateIncomeAssessment(data: any) {
        const t = await db.sequelize.transaction();
        try {
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            let income_assessment = null;

            const existingIncomeAssessment = await db.loan_income_assessments.findOne({
                where: { application_id: loan_id },
                transaction: t
            })
            const incomeAssessmentData: any = {
                application_id: loan_id,
                assessed_date: data.assessed_date || new Date(),
                average_monthly_income: data.average_monthly_income,
                other_verified_income: data.other_verified_income || 0.00,
                total_verified_income: data.total_verified_income,
                estimated_living_expenses: data.estimated_living_expenses || 0.00,
                existing_debt_payments: data.existing_debt_payments || 0.00,
                proposed_installment: data.proposed_installment,
                dsr_percentage: data.dsr_percentage,
                max_approved_amount: data.max_approved_amount || 0.00,
                remarks: data.remarks || '',
                assessed_by: data.assessed_by
            }

            if (existingIncomeAssessment) {
                console.log('📝 Income assessment exists, updating...');
                await existingIncomeAssessment.update(incomeAssessmentData, { transaction: t });
                income_assessment = existingIncomeAssessment;
            } else {
                console.log('📝 Creating new income assessment...')
                income_assessment = await db.loan_income_assessments.create(incomeAssessmentData, { transaction: t });
            }

            await t.commit();
            console.log('✅ Income assessment saved successfully!');
            return {
                success: true,
                message: 'Income assessment saved successfully',
                data: income_assessment
            }
        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error creating Income Assessment:', error);
            return {
                success: false,
                message: 'Error creating Income Assessment',
                data: null
            }
        }
    }

    async GetIncomeAssessmentByLoanId(loan_id: number) {
        try {
            const income_assessment = await db.loan_income_assessments.findOne({
                where: { application_id: loan_id },
                raw: true
            }); 
            return {
                success: true,
                message: 'Income assessment retrieved successfully',
                data: income_assessment
            }
        } catch (error: any) {
            console.error('❌ Error retrieving Income Assessment:', error);
            return {
                success: false,
                message: 'Error retrieving Income Assessment',
                data: null
            }
        }
    }
    async GetCallVerificationsByLoanId(loan_id: number) {
        try {
            const call_verifications = await db.loan_call_verifications.findAll({
                where: { application_id: loan_id },
                raw: true
            });
            return {
                success: true,
                message: 'Call verifications retrieved successfully',
                data: call_verifications
            }
        } catch (error: any) {
            console.error('❌ Error retrieving Call Verifications:', error);
            return {
                success: false,
                message: 'Error retrieving Call Verifications',
                data: null
            }
        }
    }
    async GetCIBCheckByLoanId(loan_id: number) {
        try {
            const cib_check = await db.loan_cib_checks.findOne({
                where: { application_id: loan_id },
                raw: true
            });
            return {
                success: true,
                message: 'CIB check retrieved successfully',
                data: cib_check
            }
        } catch (error: any) {
            console.error('❌ Error retrieving CIB Check:', error);
            return {
                success: false,
                message: 'Error retrieving CIB Check',
                data: null
            }
        }
    }
    async GetFieldVisitsByLoanId(loan_id: number) {
        try {
            const field_visits = await db.loan_field_visits.findAll({
                where: { application_id: loan_id },
                raw: true
            });
            return {
                success: true,
                message: 'Field visits retrieved successfully',
                data: field_visits
            }
        } catch (error: any) {
            console.error('❌ Error retrieving Field Visits:', error);
            return {
                success: false,
                message: 'Error retrieving Field Visits',
                data: null
            }
        }
    }
    async GetAllChecklistByLoanId(loan_id: number) {
        try {
            let basic_verification = await db.loan_basic_verifications.findOne({
                where: { application_id: loan_id },
                raw: true
            });
            let income_assessment = await db.loan_income_assessments.findOne({
                where: { application_id: loan_id },
                raw: true
            });
            let call_verifications = await db.loan_call_verifications.findAll({
                where: { application_id: loan_id },
                raw: true
            });
            let cib_check = await db.loan_cib_checks.findOne({
                where: { application_id: loan_id },
                raw: true
            });
            let field_visits = await db.loan_field_visits.findAll({
                where: { application_id: loan_id },
                raw: true
            });
            if (!basic_verification) basic_verification = null;
            if (!income_assessment) income_assessment = null;
            if (!call_verifications) call_verifications = [];
            if (!cib_check) cib_check = null;
            if (!field_visits) field_visits = [];

            return {
                success: true,
                message: 'All checklists retrieved successfully',
                data: {
                    basic_verification,
                    income_assessment,
                    call_verifications,
                    cib_check,
                    field_visits
                }
            }
        } catch (error: any) {
            console.error('❌ Error retrieving all checklists:', error);
            return {
                success: false,
                message: 'Error retrieving all checklists',
                data: null
            }
        }
    }
}

export default new CheckListService();