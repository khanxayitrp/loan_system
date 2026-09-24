import { db } from '../models/init-models';
import { Transaction, Op } from 'sequelize';
import redisService from './redis.service'; //[cite: 10]
import { formatStandardPhoneNumber } from '../utils/formatters';

export class MembershipOriginationService {

    async submitApplication(params: {
        customerId?: number, // สำหรับ Super App หรือ Staff ที่ระบุ ID มา
        customerData: any,
        workData: any,
        creditRequestData: any,
        profileImageUrl: string | null,
        performedBy: number,
        source: 'STAFF' | 'PUBLIC_WEB' | 'SUPER_APP'
    }) {
        const transaction = await db.sequelize.transaction();

        try {
            const phone = formatStandardPhoneNumber(params.customerData.phone);
            let customerId = params.customerId;
            let customer;

            // ==========================================
            // 1. Manage Customer Master Data
            // ==========================================
            const custPayload = {
                first_name: params.customerData.first_name,
                last_name: params.customerData.last_name,
                phone: phone,
                gender: params.customerData.gender,
                date_of_birth: params.customerData.date_of_birth,
                // 🌟 ເພີ່ມ 2 Fields ນີ້ ເພື່ອໃຫ້ບັນທຶກລົງຕາຕະລາງ customers
                age: params.customerData.age ? Number(params.customerData.age) : undefined,
                occupation: params.workData.occupation || params.customerData.occupation,
                identity_number: params.customerData.identity_number,
                account_number: params.customerData.account_number,
                province_id: params.customerData.province_id,
                district_id: params.customerData.district_id,
                address: params.customerData.address,
                profile_image_url: params.profileImageUrl || undefined
            };

            if (customerId) {
                customer = await db.customers.findByPk(customerId, { transaction, lock: transaction.LOCK.UPDATE });
                if (customer) {
                    await customer.update(custPayload, { transaction });
                } else {
                    throw new Error('Customer not found');
                }
            } else {
                // กรณี Public Web หรือ Staff สร้างลูกค้าใหม่ ให้หาจากเบอร์โทรก่อน
                customer = await db.customers.findOne({ where: { phone }, transaction, lock: transaction.LOCK.UPDATE });
                if (customer) {
                    await customer.update(custPayload, { transaction });
                } else {
                    customer = await db.customers.create({ ...custPayload, kyc_status: 'unverified' }, { transaction });
                }
            }

            customerId = customer.id;

            // ==========================================
            // 2. Duplicate Application Check
            // ==========================================
            const existingApp = await db.membership_applications.findOne({
                where: {
                    customer_id: customerId,
                    status: { [Op.in]: ['DRAFT', 'SUBMITTED', 'ASSESSING', 'PENDING_MANAGER_REVIEW', 'VERIFIED'] }
                },
                transaction
            });

            if (existingApp) {
                throw new Error('ລູກຄ້າທ່ານນີ້ມີຄຳຮ້ອງຂໍສິນເຊື່ອທີ່ກຳລັງລໍຖ້າການພິຈາລະນາຢູ່ແລ້ວ (Duplicate active application)');
            }

            // ==========================================
            // 3. Manage Work Info
            // ==========================================
            let workInfo = await db.customer_work_info.findOne({ where: { customer_id: customerId }, transaction });
            const workPayload = {
                customer_id: customerId,
                employment_type: params.workData.employment_type, // 🌟 ຖ້າເພີ່ມຖັນແລ້ວໃຫ້ເປີດໃຊ້ແຖວນີ້
                business_type: params.workData.business_type,        // 🌟 ຮັບຄ່າ ປະເພດທຸລະກິດ
                business_detail: params.workData.business_detail,    // 🌟 ຮັບຄ່າ ລາຍລະອຽດທຸລະກິດ
                phone: params.workData.work_phone,                   // 🌟 ຮັບຄ່າ ເບີໂທບ່ອນເຮັດວຽກ (ລົງຖັນ phone)
                department: params.workData.department,              // 🌟 ຮັບຄ່າ ພະແນກ
                occupation: params.workData.occupation,
                company_name: params.workData.company_name,
                position: params.workData.job_position,
                duration_years: Number(params.workData.work_duration_years) || 0,
                duration_months: Number(params.workData.work_duration_months) || 0,
                province_id: params.workData.work_province_id,
                district_id: params.workData.work_district_id,
                address: params.workData.work_address,
                salary: Number(params.workData.income_per_month) || 0
            };

            if (workInfo) {
                await workInfo.update(workPayload, { transaction });
            } else {
                workInfo = await db.customer_work_info.create(workPayload, { transaction });
            }

            // อัปเดตรายได้ในตารางหลักลูกค้าด้วยเพื่อ Backward Compatibility
            await customer.update({
                income_per_month: Number(params.workData.income_per_month) || 0,
                other_debt: Number(params.workData.other_debt) || 0
            }, { transaction });

            // ==========================================
            // 4. Create Membership Application
            // ==========================================
            const appNo = `MA${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;

            const application = await db.membership_applications.create({
                application_no: appNo,
                customer_id: customerId,
                requested_credit_limit: Number(params.creditRequestData.requested_credit_limit) || 0,

                // 🌟 ແກ້ໄຂ TS Error: ປ່ຽນຈາກ null ເປັນ undefined
                purpose_id: params.creditRequestData.purpose_id ? Number(params.creditRequestData.purpose_id) : undefined,

                // 🌟 ນຳໃຊ້ undefined ສຳລັບ Optional String Fields ເພື່ອຄວາມປອດໄພຂອງ TypeScript
                usage_goal: params.creditRequestData.usage_goal || undefined,
                requested_product_type: params.creditRequestData.requested_product_type || undefined,
                remarks: params.creditRequestData.remarks || undefined,

                status: 'SUBMITTED', // ເລີ່ມຕົ້ນທີ່ SUBMITTED ສະເໝີ
                version: 1,
                submitted_at: new Date(),

                // 🌟 ປ່ຽນຈາກ null ເປັນ undefined ເຊັ່ນກັນ
                created_by: params.performedBy || undefined
            }, { transaction });

            // ==========================================
            // 5. Create Snapshot Version[cite: 9]
            // ==========================================
            const customerSnapshot = { ...customer.toJSON() };
            const employmentSnapshot = { ...workInfo.toJSON() };
            const financialSnapshot = {
                monthly_income: Number(params.workData.income_per_month) || 0,
                other_debts: Number(params.workData.other_debt) || 0,
                monthly_debt_payment: Number(params.workData.monthly_debt_payment) || 0
            };

            await db.membership_application_versions.create({
                membership_application_id: application.id,
                version_no: 1,
                customer_snapshot_json: customerSnapshot,
                employment_snapshot_json: employmentSnapshot,
                financial_snapshot_json: financialSnapshot,
                credit_request_snapshot_json: params.creditRequestData,
                created_by: params.performedBy
            }, { transaction });

            await transaction.commit();

            // ==========================================
            // 6. Cache Invalidation[cite: 10]
            // ==========================================
            await redisService.delByPattern(`customers_list:*`);
            await redisService.delByPattern(`customer:${customerId}:*`);
            await redisService.delByPattern(`membership_applications:*`);

            return {
                application_id: application.id,
                application_no: application.application_no,
                customer_id: customerId,
                status: application.status
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // 🟢 2. ຟັງຊັນສຳລັບອັບເດດຂໍ້ມູນໃບຄຳຂໍ ແລະ ຂໍ້ມູນລູກຄ້າ
    async updateApplication(customerId: number, params: { // 🌟 ປ່ຽນຊື່ Parameter ເປັນ customerId ໃຫ້ຊັດເຈນ
        customerData: any,
        workData: any,
        creditRequestData: any,
        profileImageUrl: string | null,
        performedBy: number,
        source: 'STAFF' | 'PUBLIC_WEB' | 'SUPER_APP'
    }) {
        const transaction = await db.sequelize.transaction();

        try {
            // 🌟 1. ຄົ້ນຫາໃບຄຳຂໍເດີມ ຈາກ "customer_id" (ດຶງເອົາໃບຫຼ້າສຸດ)
            const application = await db.membership_applications.findOne({
                where: { customer_id: customerId },
                order: [['created_at', 'DESC']], // ເອົາໃບຫຼ້າສຸດສະເໝີ
                include: [{ model: db.customers, as: 'customer' }],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!application) {
                throw new Error('ບໍ່ພົບຂໍ້ມູນຄຳຮ້ອງຂໍສິນເຊື່ອສຳລັບລູກຄ້າຄົນນີ້ (Application not found for this customer)');
            }

            const customer = application.customer;
            if (!customer) {
                throw new Error('ບໍ່ພົບຂໍ້ມູນລູກຄ້າທີ່ຜູກກັບໃບຄຳຂໍນີ້');
            }

            // 🛡️ [Security Check]: ຖ້າເປັນລູກຄ້າແກ້ໄຂເອງ ຕ້ອງກວດສອບວ່າເປັນໃບຄຳຂໍຂອງຕົນເອງແທ້ຫຼືບໍ່
            if (params.source === 'SUPER_APP' && customer.id !== params.performedBy) {
                throw new Error('ທ່ານບໍ່ມີສິດແກ້ໄຂໃບຄຳຂໍນີ້ (Unauthorized access)');
            }

            const phone = formatStandardPhoneNumber(params.customerData.phone);

            // 2. ອັບເດດຂໍ້ມູນລູກຄ້າ (Customer Master)
            const custPayload = {
                first_name: params.customerData.first_name,
                last_name: params.customerData.last_name,
                phone: phone,
                gender: params.customerData.gender,
                date_of_birth: params.customerData.date_of_birth,

                // 🌟 ເພີ່ມ 2 Fields ນີ້ ເພື່ອໃຫ້ບັນທຶກລົງຕາຕະລາງ customers
                age: params.customerData.age ? Number(params.customerData.age) : undefined,
                occupation: params.workData.occupation || params.customerData.occupation,

                identity_number: params.customerData.identity_number,
                account_number: params.customerData.account_number,
                province_id: params.customerData.province_id,
                district_id: params.customerData.district_id,
                address: params.customerData.address,
                profile_image_url: params.profileImageUrl || customer.profile_image_url
            };

            await customer.update(custPayload, { transaction });

            // 3. ອັບເດດຂໍ້ມູນການເຮັດວຽກ (Work Info)
            let workInfo = await db.customer_work_info.findOne({ where: { customer_id: customer.id }, transaction });
            const workPayload = {
                customer_id: customer.id,
                employment_type: params.workData.employment_type, // 🌟 ຖ້າເພີ່ມຖັນແລ້ວໃຫ້ເປີດໃຊ້ແຖວນີ້
                business_type: params.workData.business_type,        // 🌟 ຮັບຄ່າ ປະເພດທຸລະກິດ
                business_detail: params.workData.business_detail,    // 🌟 ຮັບຄ່າ ລາຍລະອຽດທຸລະກິດ
                phone: params.workData.work_phone,                   // 🌟 ຮັບຄ່າ ເບີໂທບ່ອນເຮັດວຽກ (ລົງຖັນ phone)
                department: params.workData.department,              // 🌟 ຮັບຄ່າ ພະແນກ
                occupation: params.workData.occupation,
                company_name: params.workData.company_name,
                position: params.workData.job_position,
                duration_years: Number(params.workData.work_duration_years) || 0,
                duration_months: Number(params.workData.work_duration_months) || 0,
                province_id: params.workData.work_province_id,
                district_id: params.workData.work_district_id,
                address: params.workData.work_address,
                salary: Number(params.workData.income_per_month) || 0
            };

            if (workInfo) {
                await workInfo.update(workPayload, { transaction });
            } else {
                workInfo = await db.customer_work_info.create(workPayload, { transaction });
            }

            await customer.update({
                income_per_month: Number(params.workData.income_per_month) || 0,
                other_debt: Number(params.workData.other_debt) || 0
            }, { transaction });

            // 4. ອັບເດດໃບຄຳຂໍຫຼັກ (Membership Application)
            await application.update({
                requested_credit_limit: Number(params.creditRequestData.requested_credit_limit) || application.requested_credit_limit,
                purpose_id: params.creditRequestData.purpose_id ? Number(params.creditRequestData.purpose_id) : application.purpose_id,
                usage_goal: params.creditRequestData.usage_goal || application.usage_goal,
                requested_product_type: params.creditRequestData.requested_product_type || application.requested_product_type,
                remarks: params.creditRequestData.remarks || application.remarks,
                updated_by: params.source === 'STAFF' ? params.performedBy : undefined,
                version: application.version + 1
            }, { transaction });

            // 5. ສ້າງ Snapshot ໃໝ່ (New Version)[cite: 1]
            const customerSnapshot = { ...customer.toJSON() };
            const employmentSnapshot = { ...workInfo.toJSON() };
            const financialSnapshot = {
                monthly_income: Number(params.workData.income_per_month) || 0,
                other_debts: Number(params.workData.other_debt) || 0,
                monthly_debt_payment: Number(params.workData.monthly_debt_payment) || 0
            };

            await db.membership_application_versions.create({
                membership_application_id: application.id,
                version_no: application.version,
                customer_snapshot_json: customerSnapshot,
                employment_snapshot_json: employmentSnapshot,
                financial_snapshot_json: financialSnapshot,
                credit_request_snapshot_json: params.creditRequestData,
                created_by: params.source === 'STAFF' ? params.performedBy : undefined
            }, { transaction });

            await transaction.commit();

            // 6. ລ້າງ Redis Cache
            await redisService.delByPattern(`customers_list:*`);
            await redisService.delByPattern(`customer:${customer.id}:*`);
            await redisService.delByPattern(`membership_applications:*`);

            return application;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

export const membershipOriginationService = new MembershipOriginationService();