import { db, loan_guarantors } from "../models/init-models";
import { Transaction } from "sequelize";
import { logger } from "../utils/logger";
import { formatPhoneNumber } from "@/utils/otp";

class ProposalService {
    async CreateProposal(data: any) {
        const t = await db.sequelize.transaction();
        try {
            // ✅ ตรวจสอบว่าต้องมี customer_id
            if (!data.customer_id) {
                throw new Error('customer_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            // ✅ ตรวจสอบว่าต้องมี loan_id
            if (!data.loan_id) {
                throw new Error('loan_id ເປັນຂໍ້ມູນບັງຄັບ');
            }

            let work_info = null;
            let guarantor = null;

            // ============================================
            // ✅ 1. ตรวจสอบและสร้าง/อัปเดต Work Info
            // ============================================
            const mapWorkData = {
                customer_id: data.customer_id,
                company_name: data.company_name,
                address: data.address || null,
                phone: data.phone || null,
                business_type: data.business_type || null,
                business_detail: data.business_details || null,
                duration_years: data.duration_years,
                duration_months: data.duration_months,
                department: data.department || null,
                position: data.position,
                salary: data.salary
            };

            // ✅ ตรวจสอบว่ามี work_info สำหรับ customer นี้แล้วหรือไม่
            const existingWorkInfo = await db.customer_work_info.findOne({
                where: { customer_id: data.customer_id },
                transaction: t
            });

            if (existingWorkInfo) {
                // ✅ มีอยู่แล้ว -> อัปเดต
                console.log('📝 Work info exists, updating...');
                await existingWorkInfo.update(mapWorkData, { transaction: t });
                work_info = existingWorkInfo;
            } else {
                // ✅ ยังไม่มี -> สร้างใหม่
                console.log('📝 Creating new work info...');
                work_info = await db.customer_work_info.create(mapWorkData, { transaction: t });
            }

            // ============================================
            // ✅ 2. ตรวจสอบและสร้าง/อัปเดต Guarantor
            // ============================================

            // ✅ ตรวจสอบว่ามี guarantor สำหรับ loan application นี้แล้วหรือไม่
            const existingGuarantor = await db.loan_guarantors.findOne({
                where: { application_id: data.loan_id },
                transaction: t
            });

            // ✅ เตรียมข้อมูล Guarantor (เฉพาะถ้ามีข้อมูล)
            if (data.name || data.identity_number || data.Guarantorphone) {
                const mapGuarantorData = {
                    application_id: data.loan_id,
                    name: data.name || null,
                    identity_number: data.identity_number || null,
                    date_of_birth: data.GuarantorDOB || null,
                    age: data.GuatantorAGE || null,
                    phone: data.Guarantorphone || null,
                    address: data.Guarantoraddress || null,
                    occupation: data.occupation || null,
                    relationship: data.relationship || null,
                    work_company_name: data.work_company_name || null,
                    work_phone: data.work_phone || null,
                    work_location: data.work_location || null,
                    work_position: data.work_position || null,
                    work_salary: data.work_salary || null
                };

                if (existingGuarantor) {
                    // ✅ มีอยู่แล้ว -> อัปเดต
                    console.log('📝 Guarantor exists, updating...');
                    await existingGuarantor.update(mapGuarantorData, { transaction: t });
                    guarantor = existingGuarantor;
                } else {
                    // ✅ ยังไม่มี -> สร้างใหม่
                    console.log('📝 Creating new guarantor...');
                    guarantor = await db.loan_guarantors.create(mapGuarantorData, { transaction: t });
                }
            } else {
                // ✅ ไม่มีข้อมูลผู้ค้ำ -> ลบ existing ถ้ามี
                if (existingGuarantor) {
                    console.log('📝 No guarantor data, removing existing...');
                    await existingGuarantor.destroy({ transaction: t });
                }
                guarantor = null;
            }

            await t.commit();

            console.log('✅ Proposal created successfully');
            return {
                work_info,
                guarantor,
                message: existingWorkInfo || existingGuarantor ? 'Updated' : 'Created'
            };

        } catch (error: any) {
            await t.rollback();
            logger.error(`Error creating Proposal: ${(error as Error).message}`);
            logger.error(`Error stack: ${(error as Error).stack}`);
            logger.error(`Error data: ${JSON.stringify(data)}`);
            throw error;
        }
    }

    async UpdateProposal(data: any) {
        const t = await db.sequelize.transaction()
        try {
            // ✅ ตรวจสอบว่าต้องมี customer_id
            if (!data.customer_id) {
                throw new Error('customer_id เป็นข้อมูลบังคับ');
            }
            const mapWorkData = {
                customer_id: data.customer_id,
                company_name: data.company_name,
                address: data.address || null,
                phone: data.phone || null,
                business_type: data.business_type || null,
                business_details: data.business_details || null,
                duration_years: data.duration_years,
                duration_months: data.duration_months,
                department: data.department || null,
                position: data.position,
                salary: data.salary
            }
            const work_info = await db.customer_work_info.update(mapWorkData,
                {
                    where: {
                        customer_id: data.customer_id
                    },
                    transaction: t
                })

            const mapLoanData = {

                name: data.name,
                identity_number: data.identity_number || null,
                formatPhoneNumber: data.Guarantorphone || null,
                address: data.Guarantoraddress || null,
                occupation: data.occupation || null,
                relationship: data.relationship,
                work_company_name: data.work_company_name || null,
                work_position: data.work_position || null,
                work_salary: data.work_salary
            }

            const Quarantor = await db.loan_guarantors.update(mapLoanData,
                {
                    where: {
                        application_id: data.loan_id
                    },
                    transaction: t
                }
            )

            await t.commit();

            return { work_info, Quarantor }
        } catch (error: any) {
            await t.rollback();
            logger.error(`Error updating Proposal: ${(error as Error).message}`);
            throw error;
        }
    }
    async getProposal(loan_id: number, customer_id: number) {
        try {
            const work_info = await db.customer_work_info.findOne({
                where: { customer_id: customer_id },
                raw: true
            })

            const loan_quarantor = await db.loan_guarantors.findOne({
                where: { application_id: loan_id },
                raw: true
            })

            return { work_info, loan_quarantor }
        } catch (error: any) {
            logger.error(`Error find Proposal: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new ProposalService()