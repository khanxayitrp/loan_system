import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs/promises';
import fileUploadService from './fileUpload.service'; // Adjust path
import { Transaction } from 'sequelize';

// 🟢 1. Import Helper ของเราเข้ามา
import { logAudit } from '../utils/auditLogger';

const CIB_SEVERITY = {
    'no_delay': 1,
    'delay_30_days': 2,
    'delay_60_days': 3,
    'delay_90_days': 4,
    'blacklist': 5
};

class CheckListService {

    async CreateBasicVerification(data: any) {
        const t = await db.sequelize.transaction();
        try {
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 🟢 กำหนด ID คนทำรายการ
            const performedBy = data.verifiedBy || data.verified_by || data.user_id || 1;

            let basic_verification = null;
            let customer_info = null;

            const checkLoanApp = await db.loan_applications.findByPk(loan_id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!checkLoanApp) {
                throw new Error('Loan application not found');
            }
            const existingCustomer = await db.customers.findByPk(checkLoanApp.customer_id, { transaction: t, lock: t.LOCK.UPDATE });

            const existingBasicVerification = await db.loan_basic_verifications.findOne({
                where: { application_id: loan_id },
                transaction: t,
                lock: t.LOCK.UPDATE
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
                verified_by: performedBy
            }

            let logRemark = 'ບັນທຶກຂໍ້ມູນການກວດສອບພື້ນຖານ (Basic Verification)';

            if (existingBasicVerification) {
                const oldBasicData = existingBasicVerification.toJSON();
                console.log('📝 Basic verification exists, updating...');
                await existingBasicVerification.update(basicVerificationData, { transaction: t });
                basic_verification = existingBasicVerification;

                // 🟢 Audit Log (UPDATE)
                await logAudit('loan_basic_verifications', existingBasicVerification.id, 'UPDATE', oldBasicData, basicVerificationData, performedBy, t);
                logRemark = 'ແກ້ໄຂຂໍ້ມູນການກວດສອບພື້ນຖານ (Updated Basic Verification)';
            } else {
                console.log('📝 Creating new basic verification...');
                basic_verification = await db.loan_basic_verifications.create(basicVerificationData, { transaction: t });
                
                // 🟢 Audit Log (CREATE)
                await logAudit('loan_basic_verifications', basic_verification.id, 'CREATE', null, basicVerificationData, performedBy, t);
                logRemark = 'ສ້າງຂໍ້ມູນການກວດສອບພື້ນຖານ (Created Basic Verification)';
            }

            if (existingCustomer) {
                const oldCustomerData = existingCustomer.toJSON();
                const updateCustomerPayload = {
                    first_name: data.verifiedFirstName || data.verified_first_name,
                    last_name: data.verifiedLastName || data.verified_last_name,
                    date_of_birth: data.verifiedDob || data.verified_dob || null,
                    address: data.verifiedAddress || data.verified_address || null
                };
                customer_info = await existingCustomer.update(updateCustomerPayload, { transaction: t });
                
                // 🟢 Audit Log (UPDATE Customer)
                await logAudit('customers', existingCustomer.id, 'UPDATE', oldCustomerData, updateCustomerPayload, performedBy, t);

                const existingCustomerWorkInfo = await db.customer_work_info.findOne({
                    where: { customer_id: existingCustomer.id },
                    transaction: t
                });
                
                if (existingCustomerWorkInfo) {
                    const oldWorkData = existingCustomerWorkInfo.toJSON();
                    const updateWorkPayload = {
                        company_name: data.workCompanyName || data.work_company_name,
                        position: data.workPosition || data.work_position,
                        salary: data.workSalary || data.work_salary,
                        duration_years: data.workYears || data.work_years
                    };
                    await existingCustomerWorkInfo.update(updateWorkPayload, { transaction: t });
                    
                    // 🟢 Audit Log (UPDATE Work Info)
                    await logAudit('customer_work_info', existingCustomerWorkInfo.id, 'UPDATE', oldWorkData, updateWorkPayload, performedBy, t);
                }
            }

            // Timeline Log
            await db.loan_approval_logs.create({
                application_id: loan_id,
                action: 'verified_basic',
                remarks: logRemark,
                performed_by: performedBy 
            }, { transaction: t });

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
            return { success: false, message: error.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການຢືມເງິນ', data: null };
        }
    }

    async CreateCallVerification(data: any) {
        const t = await db.sequelize.transaction();
        try {
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 🟢 กำหนด ID คนทำรายการ
            const performedBy = data.called_by || data.calledBy || data.user_id || 1;

            await db.loan_applications.findByPk(loan_id, { transaction: t, lock: t.LOCK.UPDATE });

            let callsData = [];
            if (data.calls && Array.isArray(data.calls)) {
                callsData = data.calls;
            } else if (Array.isArray(data)) {
                callsData = data;
            } else {
                callsData = [data]; 
            }

            const processedCalls = [];
            const incomingIds = []; 

            const existingCount = await db.loan_call_verifications.count({
                where: { application_id: loan_id },
                transaction: t
            });

            for (const call of callsData) {
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
                    called_by: performedBy
                };

                if (call.id) {
                    const existingCall = await db.loan_call_verifications.findByPk(call.id, { transaction: t, lock: t.LOCK.UPDATE });
                    if(existingCall){
                        const oldCallData = existingCall.toJSON();
                        await existingCall.update(payload, { transaction: t });
                        incomingIds.push(existingCall.id); 
                        processedCalls.push(existingCall);
                        
                        // 🟢 Audit Log (UPDATE)
                        await logAudit('loan_call_verifications', existingCall.id, 'UPDATE', oldCallData, payload, performedBy, t);
                    }
                } else {
                    const newCall = await db.loan_call_verifications.create(payload, { transaction: t });
                    incomingIds.push(newCall.id); 
                    processedCalls.push(newCall);
                    
                    // 🟢 Audit Log (CREATE)
                    await logAudit('loan_call_verifications', newCall.id, 'CREATE', null, payload, performedBy, t);
                }
            }

            // ลบข้อมูลเก่าที่ไม่ได้ส่งมา + 🟢 Audit Log (DELETE)
            let deleteCondition: any = { application_id: loan_id };
            if (incomingIds.length > 0) {
                deleteCondition.id = { [Op.notIn]: incomingIds };
            }
            
            const callsToDelete = await db.loan_call_verifications.findAll({ where: deleteCondition, transaction: t });
            for(const item of callsToDelete) {
                await logAudit('loan_call_verifications', item.id, 'DELETE', item.toJSON(), null, performedBy, t);
            }
            await db.loan_call_verifications.destroy({ where: deleteCondition, transaction: t });

            const logRemark = existingCount > 0 
                ? `ແກ້ໄຂຂໍ້ມູນການໂທກວດສອບ (ອັບເດດເປັນ ${processedCalls.length} ລາຍການ)` 
                : `ສ້າງຂໍ້ມູນການໂທກວດສອບ (ບັນທຶກ ${processedCalls.length} ລາຍການ)`;

            await db.loan_approval_logs.create({
                application_id: loan_id,
                action: 'verified_call',
                remarks: logRemark, 
                performed_by: performedBy
            }, { transaction: t });

            await t.commit();
            console.log('✅ Call verifications saved successfully! Total records:', processedCalls.length);
            return { success: true, message: 'Call verification saved successfully', data: processedCalls };

        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error saving call verification:', error);
            return { success: false, message: error.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການໂທ', data: null };
        }
    }

    async CreateCIBVerification(data: any) {
        const t = await db.sequelize.transaction();
        try {
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 🟢 กำหนด ID คนทำรายการ
            const performedBy = data.checked_by || data.checkedBy || data.user_id || 1;

            await db.loan_applications.findByPk(loan_id, { transaction: t, lock: t.LOCK.UPDATE });

            let cibDetails = [];
            if (data.cib_details && Array.isArray(data.cib_details)) {
                cibDetails = data.cib_details;
            } else if (data.cibDetails && Array.isArray(data.cibDetails)) {
                cibDetails = data.cibDetails;
            }

            const processedDetails = [];
            const incomingIds = []; 
            let worstStatus = 'no_delay';
            let maxSeverity = 1;

            for (const detail of cibDetails) {
                const status = detail.history_status || detail.historyStatus || 'no_delay';
                const currentSeverity = CIB_SEVERITY[status as keyof typeof CIB_SEVERITY] || 1;
                if (currentSeverity > maxSeverity) {
                    maxSeverity = currentSeverity;
                    worstStatus = status;
                }

                const payloadDetail = {
                    application_id: loan_id,
                    institution_name: detail.institution_name || detail.institutionName,
                    account_type: detail.account_type || detail.accountType || null,
                    history_status: status,
                    outstanding_balance: detail.outstanding_balance || detail.outstandingBalance || 0
                };

                if (detail.id) {
                    const existingRecord = await db.loan_cib_history_details.findByPk(detail.id, { transaction: t, lock: t.LOCK.UPDATE });
                    if (existingRecord) {
                        const oldDetailData = existingRecord.toJSON();
                        await existingRecord.update(payloadDetail, { transaction: t });
                        incomingIds.push(existingRecord.id);
                        processedDetails.push(existingRecord);
                        
                        // 🟢 Audit Log (UPDATE)
                        await logAudit('loan_cib_history_details', existingRecord.id, 'UPDATE', oldDetailData, payloadDetail, performedBy, t);
                    }
                } else {
                    const newRecord = await db.loan_cib_history_details.create(payloadDetail, { transaction: t });
                    incomingIds.push(newRecord.id);
                    processedDetails.push(newRecord);
                    
                    // 🟢 Audit Log (CREATE)
                    await logAudit('loan_cib_history_details', newRecord.id, 'CREATE', null, payloadDetail, performedBy, t);
                }
            }

            // ลบข้อมูลเก่าที่ไม่ได้ส่งมา + 🟢 Audit Log (DELETE)
            let deleteCondition: any = { application_id: loan_id };
            if (incomingIds.length > 0) {
                deleteCondition.id = { [Op.notIn]: incomingIds };
            } else {
                worstStatus = data.cib_status || data.cibStatus || 'no_delay';
            }
            
            const detailsToDelete = await db.loan_cib_history_details.findAll({ where: deleteCondition, transaction: t });
            for(const item of detailsToDelete) {
                await logAudit('loan_cib_history_details', item.id, 'DELETE', item.toJSON(), null, performedBy, t);
            }
            await db.loan_cib_history_details.destroy({ where: deleteCondition, transaction: t });

            // ตารางหลัก (loan_cib_checks)
            const cibMainPayload: any = {
                application_id: loan_id,
                cib_status: worstStatus, 
                is_existing_customer: data.is_existing_customer ?? data.isExistingCustomer ?? 0,
                existing_customer_status: data.existing_customer_status || data.existingCustomerStatus || null,
                cib_report_file: data.cib_report_file || data.cibReportFile || null,
                remark: data.remark || null,
                checked_by: performedBy
            };

            let cibMain = null;
            const existingMain = await db.loan_cib_checks.findOne({
                where: { application_id: loan_id },
                transaction: t,
                lock: t.LOCK.UPDATE // 🔒 Lock ข้อมูลเพื่อป้องกันการแก้ไขพร้อมกันจากหลาย Transaction
            });

            if (existingMain) {
                const oldMainData = existingMain.toJSON();
                console.log('📝 CIB Main exists, updating status to:', worstStatus);
                await existingMain.update(cibMainPayload, { transaction: t });
                cibMain = existingMain;
                
                // 🟢 Audit Log (UPDATE)
                await logAudit('loan_cib_checks', existingMain.id, 'UPDATE', oldMainData, cibMainPayload, performedBy, t);
            } else {
                console.log('📝 Creating new CIB Main with status:', worstStatus);
                cibMain = await db.loan_cib_checks.create(cibMainPayload, { transaction: t });
                
                // 🟢 Audit Log (CREATE)
                await logAudit('loan_cib_checks', cibMain.id, 'CREATE', null, cibMainPayload, performedBy, t);
            }

            const logRemark = existingMain ? `ແກ້ໄຂຂໍ້ມູນການກວດສອບ CIB (ອັບເດດເປັນ ${processedDetails.length} ລາຍການ)` : `ສ້າງຂໍ້ມູນການກວດສອບ CIB (ບັນທຶກ ${processedDetails.length} ລາຍການ)`;
            
            // Timeline Log
            await db.loan_approval_logs.create({
                application_id: loan_id,
                action: 'verified_cib',
                remarks: logRemark,
                performed_by: performedBy
            }, { transaction: t });

            await t.commit();
            console.log('✅ CIB Verification saved perfectly!');

            return {
                success: true,
                message: 'CIB verification saved successfully',
                data: { ...cibMain.toJSON(), cib_details: processedDetails }
            };

        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error saving CIB verification:', error);
            return { success: false, message: error.message || 'Error saving CIB verification', data: null };
        }
    }


    /** Location Cleanup Helpers **/
    private async findLocationUploadsDirectory(): Promise<string | null> {
        const possiblePaths = [
            path.resolve(process.cwd(), 'public', 'uploads', 'locations'),
            path.resolve(process.cwd(), 'uploads', 'locations'),
            path.resolve(process.cwd(), 'src', 'public', 'uploads', 'locations'),
            path.resolve(process.cwd(), '..', 'public', 'uploads', 'locations'),
        ];
        for (const testPath of possiblePaths) {
            try {
                await fs.access(testPath);
                return testPath;
            } catch { }
        }
        return null;
    }

    private async cleanupOrphanedLocationFiles(loanId: number): Promise<number> {
        // (ส่วนนี้ไม่เกี่ยวกับ DB Insert/Update ข้าม logAudit ได้ครับ)
        try {
            const dbRecords = await db.loan_field_visits.findAll({
                where: { application_id: loanId },
                attributes: ['photo_url_1', 'photo_url_2'],
                raw: true
            });

            const dbFileUrls = new Set<string>();
            dbRecords.forEach((r: any) => {
                if (r.photo_url_1) dbFileUrls.add(r.photo_url_1.trim());
                if (r.photo_url_2) dbFileUrls.add(r.photo_url_2.trim());
            });

            const loan = await db.loan_applications.findByPk(loanId, { attributes: ['customer_id'] });
            if (!loan) return 0;

            const customerId = loan.customer_id;
            const baseUploadDir = await this.findLocationUploadsDirectory();
            if (!baseUploadDir) return 0;

            const pattern = `customer_${customerId}_location`;
            const allFilePaths: string[] = [];

            const searchDirectory = async (dir: string) => {
                try {
                    const entries = await fs.readdir(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory()) {
                            await searchDirectory(fullPath);
                        } else if (entry.isFile() && entry.name.includes(pattern)) {
                            allFilePaths.push(fullPath);
                        }
                    }
                } catch (err) { }
            };
            await searchDirectory(baseUploadDir);

            if (allFilePaths.length === 0) return 0;

            const orphanedFiles: string[] = [];
            for (const filePath of allFilePaths) {
                const normalizedPath = filePath.replace(/\\/g, '/');
                const match = normalizedPath.match(/uploads\/locations\/(.+)$/);
                if (match) {
                    const dbUrl = `/uploads/locations/${match[1]}`;
                    if (!dbFileUrls.has(dbUrl)) {
                        orphanedFiles.push(filePath); 
                    }
                }
            }

            if (orphanedFiles.length > 0) {
                try {
                    await fileUploadService.deleteFiles(orphanedFiles);
                    return orphanedFiles.length;
                } catch (deleteError) {
                    let deletedCount = 0;
                    for (const filePath of orphanedFiles) {
                        try {
                            await fs.unlink(filePath);
                            deletedCount++;
                        } catch (e) { }
                    }
                    return deletedCount;
                }
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    async CreateFieldVisits(data: any) {
        const t = await db.sequelize.transaction();
        try {
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 🟢 กำหนด ID คนทำรายการ
            const performedBy = data.visited_by || data.visitedBy || data.user_id || 1;

            await db.loan_applications.findByPk(loan_id, { transaction: t, lock: t.LOCK.UPDATE });

            let field_visit = [];
            if (data.visits && Array.isArray(data.visits)) {
                field_visit = data.visits;
            } else if (Array.isArray(data)) {
                field_visit = data;
            } else {
                field_visit = [data]; 
            }

            const processedFieldVisits = [];
            const incomingIds = []; 

            for (const field of field_visit) {
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
                    remarks: field.remarks || null,
                    visited_by: performedBy
                };

                let existingRecord = null;
                if (field.id) {
                    existingRecord = await db.loan_field_visits.findByPk(field.id, { transaction: t, lock: t.LOCK.UPDATE });
                } else {
                    existingRecord = await db.loan_field_visits.findOne({
                        where: { application_id: loan_id, visit_type: payload.visit_type },
                        transaction: t,
                        lock: t.LOCK.UPDATE
                    });
                }

                if (existingRecord) {
                    const oldFieldData = existingRecord.toJSON();
                    await existingRecord.update(payload, { transaction: t });
                    incomingIds.push(existingRecord.id);
                    processedFieldVisits.push(existingRecord);
                    
                    // 🟢 Audit Log (UPDATE)
                    await logAudit('loan_field_visits', existingRecord.id, 'UPDATE', oldFieldData, payload, performedBy, t);
                } else {
                    const newFieldVisit = await db.loan_field_visits.create(payload, { transaction: t });
                    incomingIds.push(newFieldVisit.id);
                    processedFieldVisits.push(newFieldVisit);
                    
                    // 🟢 Audit Log (CREATE)
                    await logAudit('loan_field_visits', newFieldVisit.id, 'CREATE', null, payload, performedBy, t);
                }
            }

            // ลบข้อมูลเก่า + 🟢 Audit Log (DELETE)
            let deleteCondition: any = { application_id: loan_id };
            if (incomingIds.length > 0) {
                deleteCondition.id = { [Op.notIn]: incomingIds };
            }
            
            const visitsToDelete = await db.loan_field_visits.findAll({ where: deleteCondition, transaction: t });
            for(const item of visitsToDelete) {
                await logAudit('loan_field_visits', item.id, 'DELETE', item.toJSON(), null, performedBy, t);
            }
            await db.loan_field_visits.destroy({ where: deleteCondition, transaction: t });

            const existingCount = await db.loan_field_visits.count({ where: { application_id: loan_id }, transaction: t });
            const logRemark = existingCount > 0
                ? `ແກ້ໄຂຂໍ້ມູນການຢືມເງິນ (Field Visits) - ອັບເດດເປັນ ${processedFieldVisits.length} ລາຍການ`
                : `ສ້າງຂໍ້ມູນການຢືມເງິນ (Field Visits) - ບັນທຶກ ${processedFieldVisits.length} ລາຍການ`;

            await db.loan_approval_logs.create({
                application_id: loan_id,
                action: 'verified_field',
                remarks: logRemark,
                performed_by: performedBy
            }, { transaction: t });

            await t.commit();
            logger.info(`✅ Field visits DB saved successfully! Total records: ${processedFieldVisits.length}`);

            this.cleanupOrphanedLocationFiles(loan_id).catch(e => {
                logger.error('Failed to cleanup location images in background', e);
            });

            return { success: true, message: 'Field visits saved successfully', data: processedFieldVisits };
        } catch (error: any) {
            await t.rollback();
            logger.error('❌ Error saving Field Visit:', error);
            return { success: false, message: error.message || 'Error saving Field Visit', data: null };
        }
    }

    async CreateIncomeAssessment(data: any) {
        const t = await db.sequelize.transaction();
        try {
            const loan_id = data.loan_id || data.application_id;
            if (!loan_id) {
                throw new Error('loan_id ຫຼື application_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // 🟢 กำหนด ID คนทำรายการ
            const performedBy = data.assessed_by || data.user_id || 1;

            await db.loan_applications.findByPk(loan_id, { transaction: t, lock: t.LOCK.UPDATE });

            let income_assessment = null;

            const existingIncomeAssessment = await db.loan_income_assessments.findOne({
                where: { application_id: loan_id },
                transaction: t,
                lock: t.LOCK.UPDATE
            });
            
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
                assessed_by: performedBy
            };

            if (existingIncomeAssessment) {
                const oldIncomeData = existingIncomeAssessment.toJSON();
                console.log('📝 Income assessment exists, updating...');
                await existingIncomeAssessment.update(incomeAssessmentData, { transaction: t });
                income_assessment = existingIncomeAssessment;
                
                // 🟢 Audit Log (UPDATE)
                await logAudit('loan_income_assessments', existingIncomeAssessment.id, 'UPDATE', oldIncomeData, incomeAssessmentData, performedBy, t);
            } else {
                console.log('📝 Creating new income assessment...')
                income_assessment = await db.loan_income_assessments.create(incomeAssessmentData, { transaction: t });
                
                // 🟢 Audit Log (CREATE)
                await logAudit('loan_income_assessments', income_assessment.id, 'CREATE', null, incomeAssessmentData, performedBy, t);
            }

            const remarks = existingIncomeAssessment ? 'ແກ້ໄຂຂໍ້ມູນການປະເມີນລາຍໄດ້ (Income Assessment) - ອັບເດດ' : 'ສ້າງຂໍ້ມູນການປະເມີນລາຍໄດ້ (Income Assessment) - ບັນທຶກ';

            await db.loan_approval_logs.create({
                application_id: loan_id,
                action: 'assessed_income',
                remarks,
                performed_by: performedBy
            }, { transaction: t });

            await t.commit();
            console.log('✅ Income assessment saved successfully!');
            return { success: true, message: 'Income assessment saved successfully', data: income_assessment };
        } catch (error: any) {
            await t.rollback();
            console.error('❌ Error creating Income Assessment:', error);
            return { success: false, message: 'Error creating Income Assessment', data: null };
        }
    }

    // ==========================================
    // GET METHODS (ไม่เปลี่ยนแปลง)
    // ==========================================

    async GetBasicVerificationByLoanId(loan_id: number) {
        try {
            const basic_verification = await db.loan_basic_verifications.findOne({ where: { application_id: loan_id }, raw: true });
            return { success: true, message: 'Basic verification retrieved successfully', data: basic_verification };
        } catch (error: any) {
            return { success: false, message: 'Error retrieving basic verification', data: null };
        }
    }
    async GetCallVerificationsByLoanId(loan_id: number) {
        try {
            const call_verifications = await db.loan_call_verifications.findAll({ where: { application_id: loan_id }, raw: true });
            return { success: true, message: 'Call verifications retrieved successfully', data: call_verifications };
        } catch (error: any) {
            return { success: false, message: 'Error retrieving Call Verifications', data: null };
        }
    }
    async GetCIBCheckByLoanId(loan_id: number) {
        try {
            const mainData = await db.loan_cib_checks.findOne({ where: { application_id: loan_id }, raw: true });
            const historyDetails = await db.loan_cib_history_details.findAll({ where: { application_id: loan_id }, raw: true });
            return { success: true, message: 'CIB check retrieved successfully', data: { ...mainData, cib_details: historyDetails } };
        } catch (error: any) {
            return { success: false, message: 'Error retrieving CIB Check', data: null };
        }
    }
    async GetFieldVisitsByLoanId(loan_id: number) {
        try {
            const field_visits = await db.loan_field_visits.findAll({ where: { application_id: loan_id }, raw: true });
            return { success: true, message: 'Field visits retrieved successfully', data: field_visits };
        } catch (error: any) {
            return { success: false, message: 'Error retrieving Field Visits', data: null };
        }
    }
    async GetIncomeAssessmentByLoanId(loan_id: number) {
        try {
            const income_assessment = await db.loan_income_assessments.findOne({ where: { application_id: loan_id }, raw: true });
            return { success: true, message: 'Income assessment retrieved successfully', data: income_assessment };
        } catch (error: any) {
            return { success: false, message: 'Error retrieving Income Assessment', data: null };
        }
    }
    async GetAllChecklistByLoanId(loan_id: number) {
        try {
            const basic_verification = await db.loan_basic_verifications.findOne({ where: { application_id: loan_id }, raw: true }) || null;
            const income_assessment = await db.loan_income_assessments.findOne({ where: { application_id: loan_id }, raw: true }) || null;
            const call_verifications = await db.loan_call_verifications.findAll({ where: { application_id: loan_id }, raw: true }) || [];
            
            const mainData = await db.loan_cib_checks.findOne({ where: { application_id: loan_id }, raw: true });
            const historyDetails = await db.loan_cib_history_details.findAll({ where: { application_id: loan_id }, raw: true });
            const cib_check = mainData ? { ...mainData, cib_details: historyDetails || [] } : null;

            const field_visits = await db.loan_field_visits.findAll({ where: { application_id: loan_id }, raw: true }) || [];

            return {
                success: true, message: 'All checklists retrieved successfully',
                data: { basic_verification, income_assessment, call_verifications, cib_check, field_visits }
            }
        } catch (error: any) {
            return { success: false, message: 'Error retrieving all checklists', data: null };
        }
    }
}

export default new CheckListService();