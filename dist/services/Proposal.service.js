"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const auditLogger_1 = require("../utils/auditLogger");
class ProposalService {
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
    //     // let changedColumns: object | undefined = undefined;
    //     let changedColumns: any = undefined;
    //     // ຖ້າเป็นการอับเดต ໃຫ້ຫາຄໍລຳທີ່ຖືກປ່ຽນແປງ
    //     if (action === 'UPDATE' && oldValues && newValues) {
    //         const changes: string[] = [];
    //         for (const key in newValues) {
    //             if (newValues[key] !== undefined && oldValues[key] != newValues[key]) {
    //                 changes.push(key);
    //             }
    //         }
    //         // ຖ້າບໍ່ມີຫຍັງປ່ຽນແປງເລີຍ ບໍ່ຕ້ອງບັນທຶກ Log
    //         if (changes.length === 0) return;
    //         // เปลี่ยนจาก: changedColumns = { columns: changes };
    //         changedColumns = changes; // 🟢 ผลลัพธ์ใน DB จะเป็น: ["salary", "position"] (Clean กว่า)
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
    async CreateProposal(data) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            // ✅ ตรวจสอบว่าต้องมี customer_id
            if (!data.customer_id) {
                throw new Error('customer_id ເປັນຂໍ້ມູນບັງຄັບ');
            }
            // ✅ ตรวจสอบว่าต้องมี loan_id
            if (!data.loan_id) {
                throw new Error('loan_id ເປັນຂໍ້ມູນບັງຄັບ');
            }
            // 🟢 ID ຂອງພະນັກງານທີ່ເຮັດລາຍການ (ຮັບມາຈາກ Controller)
            const performedBy = data.user_id || data.performed_by;
            if (!performedBy) {
                throw new Error('ບໍ່ສາມາດບັນທຶກໄດ້: ບໍ່ພົບ ID ຂອງຜູ້ເຮັດລາຍການ (performedBy)');
            }
            let work_info = null;
            let guarantor = null;
            // ============================================
            // ✅ 1. ตรวจสอบและสร้าง/อัปเดต Work Info
            // ============================================
            const mapWorkData = {
                customer_id: data.customer_id,
                company_name: data.company_name,
                province_id: data.province_id || null,
                district_id: data.district_id || null,
                address: data.address || null,
                phone: data.phone || null,
                business_type: data.business_type || null,
                business_detail: data.business_detail || null,
                duration_years: data.duration_years,
                duration_months: data.duration_months,
                department: data.department || null,
                position: data.position,
                salary: data.salary
            };
            const existingWorkInfo = await init_models_1.db.customer_work_info.findOne({
                where: { customer_id: data.customer_id },
                transaction: t
            });
            if (existingWorkInfo) {
                const oldWorkData = existingWorkInfo.toJSON();
                console.log('📝 Work info exists, updating...');
                await existingWorkInfo.update(mapWorkData, { transaction: t });
                work_info = existingWorkInfo;
                // 🟢 ບັນທຶກ Log (UPDATE)
                await (0, auditLogger_1.logAudit)('customer_work_info', existingWorkInfo.id, 'UPDATE', oldWorkData, mapWorkData, performedBy, t);
            }
            else {
                console.log('📝 Creating new work info...');
                work_info = await init_models_1.db.customer_work_info.create(mapWorkData, { transaction: t });
                // 🟢 ບັນທຶກ Log (CREATE)
                await (0, auditLogger_1.logAudit)('customer_work_info', work_info.id, 'CREATE', null, mapWorkData, performedBy, t);
            }
            // ============================================
            // ✅ 2. ตรวจสอบและสร้าง/อัปเดต Guarantor
            // ============================================
            const existingGuarantor = await init_models_1.db.loan_guarantors.findOne({
                where: { application_id: data.loan_id },
                transaction: t
            });
            if (data.name || data.identity_number || data.Guarantorphone) {
                const mapGuarantorData = {
                    application_id: data.loan_id,
                    name: data.name || null,
                    identity_number: data.identity_number || null,
                    date_of_birth: data.GuarantorDOB || null,
                    age: data.GuarantorAGE || null,
                    phone: data.Guarantorphone || null,
                    province_id: data.Guarantorprovince_id || null,
                    district_id: data.Guarantordistrict_id || null,
                    address: data.Guarantoraddress || null,
                    occupation: data.occupation || null,
                    relationship: data.relationship || null,
                    work_company_name: data.work_company_name || null,
                    work_phone: data.work_phone || null,
                    work_location: data.work_location || null,
                    work_province_id: data.work_province_id || null,
                    work_district_id: data.work_district_id || null,
                    work_position: data.work_position || null,
                    work_salary: data.work_salary || null
                };
                if (existingGuarantor) {
                    const oldGuarantorData = existingGuarantor.toJSON();
                    console.log('📝 Guarantor exists, updating...');
                    await existingGuarantor.update(mapGuarantorData, { transaction: t });
                    guarantor = existingGuarantor;
                    // 🟢 ບັນທຶກ Log (UPDATE)
                    await (0, auditLogger_1.logAudit)('loan_guarantors', existingGuarantor.id, 'UPDATE', oldGuarantorData, mapGuarantorData, performedBy, t);
                }
                else {
                    console.log('📝 Creating new guarantor...');
                    guarantor = await init_models_1.db.loan_guarantors.create(mapGuarantorData, { transaction: t });
                    // 🟢 ບັນທຶກ Log (CREATE)
                    await (0, auditLogger_1.logAudit)('loan_guarantors', guarantor.id, 'CREATE', null, mapGuarantorData, performedBy, t);
                }
            }
            else {
                if (existingGuarantor) {
                    const oldGuarantorData = existingGuarantor.toJSON();
                    console.log('📝 No guarantor data, removing existing...');
                    await existingGuarantor.destroy({ transaction: t });
                    // 🟢 ບັນທຶກ Log (DELETE)
                    await (0, auditLogger_1.logAudit)('loan_guarantors', existingGuarantor.id, 'DELETE', oldGuarantorData, null, performedBy, t);
                }
                guarantor = null;
            }
            // ============================================
            // ✅ 3. ສ້າງ Request Form ຖ້າຍັງບໍ່ມີ
            // ============================================
            if (work_info && guarantor) {
                const customer_form = await init_models_1.db.cus_requestform.findOne({ where: { application_id: data.loan_id }, transaction: t });
                if (customer_form) {
                    // ❌ ลบ throw new Error ออก เพื่อไม่ให้ Transaction ถูก Rollback
                    // throw new Error('customer_form ມີຢູ່ແລ້ວ');
                    // ✅ เปลี่ยนเป็นแค่ log บอกว่ามีข้อมูลอยู่แล้ว แล้วข้ามการสร้างใหม่ไป
                    console.log('📝 customer_form ມີຢູ່ແລ້ວ (Skipping creation)');
                }
                else {
                    const newForm = await init_models_1.db.cus_requestform.create({
                        application_id: data.loan_id,
                        customer_id: data.customer_id,
                    }, { transaction: t });
                    // 🟢 ບັນທຶກ Log (CREATE)
                    await (0, auditLogger_1.logAudit)('cus_requestform', newForm.id, 'CREATE', null, { application_id: data.loan_id, customer_id: data.customer_id }, performedBy, t);
                }
            }
            await t.commit();
            console.log('✅ Proposal created successfully');
            return {
                work_info,
                guarantor,
                message: existingWorkInfo || existingGuarantor ? 'Updated' : 'Created'
            };
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error creating Proposal: ${error.message}`);
            logger_1.logger.error(`Error stack: ${error.stack}`);
            logger_1.logger.error(`Error data: ${JSON.stringify(data)}`);
            throw error;
        }
    }
    async UpdateProposal(data) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            if (!data.customer_id) {
                throw new Error('customer_id เป็นข้อมูลบังคับ');
            }
            // 🟢 ID ຂອງພະນັກງານທີ່ເຮັດລາຍການ (ຮັບມາຈາກ Controller)
            const performedBy = data.user_id || data.performed_by || 1;
            const mapWorkData = {
                customer_id: data.customer_id,
                company_name: data.company_name,
                province_id: data.province_id || null,
                district_id: data.district_id || null,
                address: data.address || null,
                phone: data.phone || null,
                business_type: data.business_type || null,
                business_details: data.business_details || null,
                duration_years: data.duration_years,
                duration_months: data.duration_months,
                department: data.department || null,
                position: data.position,
                salary: data.salary
            };
            // 🟢 ປ່ຽນຈາກ .update() ໂດຍກົງມາເປັນ .findOne() -> .update() ເພື່ອເກັບ Old Values
            const existingWorkInfo = await init_models_1.db.customer_work_info.findOne({
                where: { customer_id: data.customer_id },
                transaction: t
            });
            let work_info = null;
            if (existingWorkInfo) {
                const oldWorkData = existingWorkInfo.toJSON();
                work_info = await existingWorkInfo.update(mapWorkData, { transaction: t });
                // 🟢 ບັນທຶກ Log (UPDATE)
                await (0, auditLogger_1.logAudit)('customer_work_info', existingWorkInfo.id, 'UPDATE', oldWorkData, mapWorkData, performedBy, t);
            }
            const mapLoanData = {
                name: data.name,
                identity_number: data.identity_number || null,
                phone: data.Guarantorphone || null,
                province_id: data.Guarantorprovince_id || null,
                district_id: data.Guarantordistrict_id || null,
                address: data.Guarantoraddress || null,
                occupation: data.occupation || null,
                relationship: data.relationship,
                work_company_name: data.work_company_name || null,
                work_position: data.work_position || null,
                work_salary: data.work_salary
            };
            const existingGuarantor = await init_models_1.db.loan_guarantors.findOne({
                where: { application_id: data.loan_id },
                transaction: t
            });
            let Quarantor = null;
            if (existingGuarantor) {
                const oldGuarantorData = existingGuarantor.toJSON();
                Quarantor = await existingGuarantor.update(mapLoanData, { transaction: t });
                // 🟢 ບັນທຶກ Log (UPDATE)
                await (0, auditLogger_1.logAudit)('loan_guarantors', existingGuarantor.id, 'UPDATE', oldGuarantorData, mapLoanData, performedBy, t);
            }
            await t.commit();
            return { work_info, Quarantor };
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error updating Proposal: ${error.message}`);
            throw error;
        }
    }
    async getProposal(loan_id, customer_id) {
        try {
            const work_info = await init_models_1.db.customer_work_info.findOne({
                where: { customer_id: customer_id },
                raw: true
            });
            const loan_quarantor = await init_models_1.db.loan_guarantors.findOne({
                where: { application_id: loan_id },
                raw: true
            });
            return { work_info, loan_quarantor };
        }
        catch (error) {
            logger_1.logger.error(`Error find Proposal: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new ProposalService();
