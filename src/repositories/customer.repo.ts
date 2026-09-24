import { customers, customersAttributes, customersCreationAttributes } from '../models/customers';
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op, Sequelize, Transaction } from 'sequelize';
import { KycStatus } from '../types/customer.types';

// 🟢 1. Import Helper ของเราเข้ามา
import { logAudit } from '../utils/auditLogger';
import { formatStandardPhoneNumber } from '../utils/formatters';
import { ValidationError, BadRequestError, ConflictError } from '../utils/errors';

class CustomerRepository {
    async createCustomer(data: customersCreationAttributes, options: { transaction?: any } = {}): Promise<customers> {
        try {
            const cleanCustomer = { ...data };
            const { transaction } = options;

            // ==========================================
            // 🟢 1. ຈັດລະບຽບຂໍ້ມູນກ່ອນ (Data Normalization)
            // ==========================================
            if (cleanCustomer.phone) {
                cleanCustomer.phone = formatStandardPhoneNumber(cleanCustomer.phone);
            }

            let identityNumberToSave: string | null = cleanCustomer.identity_number || null;
            if (identityNumberToSave && (identityNumberToSave.trim() === '' || identityNumberToSave === 'ບໍ່ມີ')) {
                identityNumberToSave = null;
            }

            // ==========================================
            // 🟢 2. ກວດສອບຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ (Validation)
            // ==========================================
            if (!cleanCustomer.first_name || String(cleanCustomer.first_name).trim() === '') {
                throw new BadRequestError('ກະລຸນາປ້ອນຊື່ແທ້ (First name is required)');
            }
            if (!cleanCustomer.phone || String(cleanCustomer.phone).trim() === '') {
                throw new Error('ກະລຸນາປ້ອນເບີໂທລະສັບ (Phone number is required)');
            }
            if (!cleanCustomer.province_id || String(cleanCustomer.province_id).trim() === '') {
                throw new BadRequestError('ກະລຸນາເລືອກແຂວງ (Province ID is required)');
            }
            if (!cleanCustomer.district_id || String(cleanCustomer.district_id).trim() === '') {
                throw new Error('ກະລຸນາເລືອກເມືອງ (District ID is required)');
            }
            if (!cleanCustomer.address || String(cleanCustomer.address).trim() === '') {
                throw new BadRequestError('ກະລຸນາປ້ອນທີ່ຢູ່ (Address is required)');
            }
            if (!cleanCustomer.occupation || String(cleanCustomer.occupation).trim() === '') {
                throw new BadRequestError('ກະລຸນາປ້ອນອາຊີບ (Occupation is required)');
            }

            const income = Number(cleanCustomer.income_per_month);
            if (isNaN(income) || income <= 0) {
                throw new BadRequestError('ລາຍຮັບຕໍ່ເດືອນຕ້ອງຫຼາຍກວ່າ 0 (Income per month must be greater than 0)');
            }
            cleanCustomer.income_per_month = income;

            // ==========================================
            // 🟢 3. ກວດສອບຂໍ້ມູນຊ້ຳກັນ (Duplicate Checks)
            // ==========================================
            const existPhone = await db.customers.findOne({
                where: { phone: cleanCustomer.phone },
                transaction,
                lock: transaction?.LOCK.UPDATE
            });

            if (existPhone) {
                logger.error(`Phone number already exists: ${cleanCustomer.phone}`);
                throw new ConflictError('ເບີໂທລະສັບນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາກວດສອບຄືນໃໝ່');
            }

            if (identityNumberToSave !== null) {
                const existCustomer = await db.customers.findOne({
                    where: { identity_number: identityNumberToSave },
                    transaction,
                    lock: transaction?.LOCK.UPDATE
                });

                if (existCustomer) {
                    logger.error(`Identity number already exists: ${identityNumberToSave}`);
                    throw new ConflictError('ເລກບັດປະຈຳຕົວນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາກວດສອບຄືນໃໝ່');
                }
            }

            // ==========================================
            // 🟢 4. ບັນທຶກຂໍ້ມູນ (Map Data & Create)
            // ==========================================
            const mapData: any = {
                identity_number: identityNumberToSave,
                first_name: cleanCustomer.first_name,
                last_name: cleanCustomer.last_name || '',
                phone: cleanCustomer.phone,
                // 🌟 ເພີ່ມການ Mapping ວັນເດືອນປີເກີດ ແລະ ເພດ 🌟
                date_of_birth: cleanCustomer.date_of_birth || null,
                gender: cleanCustomer.gender || null,
                province_id: cleanCustomer.province_id,
                district_id: cleanCustomer.district_id,
                address: cleanCustomer.address,
                age: cleanCustomer.age || 0,
                occupation: cleanCustomer.occupation,
                income_per_month: cleanCustomer.income_per_month,
                other_debt: cleanCustomer.other_debt || 0,
                // ເອົາ as any ອອກໄດ້ແລ້ວ ເພາະເຮົາເພີ່ມເຂົ້າໃນ Model ໄປກ່ອນໜ້ານີ້ແລ້ວ
                profile_image_url: cleanCustomer.profile_image_url || null,
                account_number: cleanCustomer.account_number || null,
                membership_tier_id: cleanCustomer.membership_tier_id || null,
                membership_score: cleanCustomer.membership_score || 0,
                kyc_status: cleanCustomer.kyc_status || 'unverified'
            };

            const newCustomer = await db.customers.create(mapData, { transaction });

            // 🟢 5. ບັນທຶກ Audit Log (CREATE)
            const performedBy = (data as any).user_id || (data as any).performed_by || 1;
            await logAudit('customers', newCustomer.id, 'CREATE', null, newCustomer.toJSON(), performedBy, transaction);

            logger.info(`Customer created with ID: ${newCustomer.id}`);
            return newCustomer;

        } catch (error) {
            logger.error(`Error creating customer: ${(error as Error).message}`);
            throw error;
        }
    }

    // 🟢 ດຶງຂໍ້ມູນລູກຄ້າທັງໝົດດ້ວຍ Cursor-based Pagination
    async findAllCustomers(
        filters: { search?: string, status?: string, startDate?: string, endDate?: string },
        options: { limit?: number, cursor?: number, transaction?: any } = {}
    ): Promise<{ rows: customers[], count: number }> {

        const whereClause: any = {};

        // 🌟 Cursor Logic: ຖ້າມີ cursor ສົ່ງມາ, ໃຫ້ດຶງຂໍ້ມູນທີ່ id ນ້ອຍກວ່າ cursor (ເພາະລຽງ DESC)
        if (options.cursor) {
            whereClause.id = { [Op.lt]: options.cursor };
        }

        // ກັ່ນຕອງຕາມສະຖານະ KYC
        if (filters.status) {
            whereClause.kyc_status = filters.status;
        }

        // ກັ່ນຕອງຕາມວັນທີລົງທະບຽນ
        if (filters.startDate && filters.endDate) {
            whereClause.created_at = {
                [Op.between]: [`${filters.startDate} 00:00:00`, `${filters.endDate} 23:59:59`]
            };
        }

        // ຄົ້ນຫາຕາມຊື່, ນາມສະກຸນ, ເບີໂທ ຫຼື ບັດປະຈຳຕົວ
        if (filters.search) {
            whereClause[Op.or] = [
                { first_name: { [Op.like]: `%${filters.search}%` } },
                { last_name: { [Op.like]: `%${filters.search}%` } },
                { phone: { [Op.like]: `%${filters.search}%` } },
                { identity_number: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await db.customers.findAndCountAll({
            where: whereClause,
            limit: options.limit || 50,
            order: [['id', 'DESC']], // 🌟 ລຽງຕາມ ID ຫຼ້າສຸດສະເໝີ
            transaction: options.transaction
        });
    }

    async findCustomerById(customerId: number, options: { transaction?: any, lock?: any } = {}): Promise<customers | null> {
        return await db.customers.findByPk(customerId, { transaction: options.transaction, lock: options.lock });
    }

    async findCustomerByIdentityNumber(identityNumber: string): Promise<customers | null> {
        return await db.customers.findOne({ where: { identity_number: identityNumber } });
    }

    // 🟢 ຟັງຊັນໃໝ່: ຄົ້ນຫາລູກຄ້າດ້ວຍເລກບັນຊີທະນາຄານ
    async findCustomerByAccountNumber(accountNumber: string, options: { transaction?: any } = {}): Promise<customers | null> {
        if (!accountNumber || accountNumber.trim() === '') return null;
        return await db.customers.findOne({
            where: { account_number: accountNumber.trim() },
            transaction: options.transaction
        });
    }

    async findCustomersByName(name: string, options: { transaction?: any } = {}): Promise<customers | null> {
        return await db.customers.findOne({
            where: Sequelize.where(
                Sequelize.fn('CONCAT', Sequelize.col('first_name'), ' ', Sequelize.col('last_name')),
                {
                    [Op.like]: `%${name}%`
                }
            ),
            transaction: options.transaction
        });
    }

    async findCustomersByPhone(phone: string, options: { transaction?: any } = {}): Promise<customers | null> {
        if (!phone) return null;

        const standardPhone = formatStandardPhoneNumber(phone);
        return await db.customers.findOne({ where: { phone: standardPhone }, transaction: options.transaction });
    }

    // 🌟 เพิ่มฟังก์ชันใหม่: สำหรับดึงข้อมูลลูกค้าพร้อมรายละเอียด Membership และวงเงิน (ใช้ตอน Login)
    async findCustomerWithDetailsByPhone(phone: string, options: { transaction?: any } = {}): Promise<customers | null> {
        if (!phone) return null;

        const standardPhone = formatStandardPhoneNumber(phone);
        return await db.customers.findOne({
            where: { phone: standardPhone },
            include: [
                { model: db.membership_tiers, as: 'membership_tier' },
                { model: db.customer_credits, as: 'customer_credit' }
            ],
            transaction: options.transaction
        });
    }

    async findCustomersByIncomeRange(minIncome: number, maxIncome: number): Promise<customers[]> {
        return await db.customers.findAll({
            where: {
                income_per_month: {
                    [Op.between]: [minIncome, maxIncome]
                }
            }
        });
    }

    async updateCustomer(customerId: number, data: Partial<customersAttributes>, options: { transaction?: any } = {}): Promise<customers | null> {
        try {
            const { transaction } = options;
            const customer = await this.findCustomerById(customerId, { transaction, lock: transaction?.LOCK.UPDATE });
            if (!customer) {
                logger.error(`Customer with ID: ${customerId} not found`);
                return null;
            }

            const oldData = customer.toJSON();

            // ==========================================
            // 🟢 1. ຈັດລະບຽບຂໍ້ມູນກ່ອນ (Data Normalization)
            // ==========================================
            let newPhone = data.phone;
            if (newPhone !== undefined) {
                newPhone = formatStandardPhoneNumber(newPhone);
            }

            let newIdentityNumber = data.identity_number;
            if (newIdentityNumber === '' || newIdentityNumber === 'ບໍ່ມີ') {
                newIdentityNumber = null as any;
            }

            const mapData: any = {
                identity_number: newIdentityNumber !== undefined ? newIdentityNumber : customer.identity_number,
                first_name: data.first_name !== undefined ? data.first_name : customer.first_name,
                last_name: data.last_name !== undefined ? (data.last_name || '') : customer.last_name,
                phone: newPhone !== undefined ? newPhone : customer.phone,

                // 🌟 ເພີ່ມ Field ໃໝ່ທີ່ຕ້ອງການອັບເດດ 🌟
                date_of_birth: data.date_of_birth !== undefined ? data.date_of_birth : customer.date_of_birth,
                gender: data.gender !== undefined ? data.gender : customer.gender,
                kyc_status: data.kyc_status !== undefined ? data.kyc_status : customer.kyc_status,

                age: data.age !== undefined ? data.age : customer.age,
                province_id: data.province_id !== undefined ? data.province_id : customer.province_id,
                district_id: data.district_id !== undefined ? data.district_id : customer.district_id,
                address: data.address !== undefined ? data.address : customer.address,
                occupation: data.occupation !== undefined ? data.occupation : customer.occupation,
                income_per_month: data.income_per_month !== undefined ? data.income_per_month : customer.income_per_month,
                other_debt: data.other_debt !== undefined ? data.other_debt : customer.other_debt,

                // 🌟 ฟิลด์อื่นๆ ให้สามารถอัปเดตได้
                profile_image_url: (data as any).profile_image_url !== undefined ? (data as any).profile_image_url : customer.profile_image_url,
                account_number: (data as any).account_number !== undefined ? (data as any).account_number : customer.account_number,
                membership_tier_id: (data as any).membership_tier_id !== undefined ? (data as any).membership_tier_id : customer.membership_tier_id,
                membership_score: (data as any).membership_score !== undefined ? (data as any).membership_score : customer.membership_score,
            }

            const updatedCustomer = await customer.update(mapData, { transaction: options.transaction });

            const performedBy = (data as any).user_id || (data as any).performed_by || 1;
            await logAudit('customers', customerId, 'UPDATE', oldData, mapData, performedBy, options.transaction);

            logger.info(`Customer updated with ID: ${customerId}`);
            return updatedCustomer;

        } catch (error) {
            logger.error(`Error updating customer: ${(error as Error).message}`);
            throw error;
        }
    }

    // 🟢 ฟังก์ชันสำหรับอัปเดตสถานะ KYC แบบกลุ่ม พร้อมกฎ State Machine
    async updateKycStatuses(
        customerIds: number[],
        targetStatus: KycStatus,
        performedBy: number,
        options: { transaction?: any } = {}
    ): Promise<customers[]> {
        const { transaction } = options;
        const updatedCustomers: customers[] = [];

        // 1. ดึงข้อมูลลูกค้าทั้งหมดที่อยู่ใน Array IDs
        const customersList = await db.customers.findAll({
            where: { id: { [Op.in]: customerIds } },
            transaction,
            lock: transaction?.LOCK.UPDATE
        });

        if (customersList.length !== customerIds.length) {
            throw new Error('ບໍ່ພົບຂໍ້ມູນລູກຄ້າບາງລາຍການ (Some customers not found)');
        }

        // 2. วนลูปตรวจสอบกฎ (State Transition) และอัปเดต
        for (const customer of customersList) {
            const currentStatus = customer.kyc_status || 'unverified';
            let isValidTransition = false;

            // 🌟 State Machine Rules
            if (targetStatus === 'verified' && currentStatus === 'unverified') isValidTransition = true;
            if (targetStatus === 'rejected' && currentStatus === 'unverified') isValidTransition = true;
            if (targetStatus === 'expired' && currentStatus === 'verified') isValidTransition = true;

            if (!isValidTransition) {
                throw new Error(`ຜິດພາດ: ບໍ່ສາມາດປ່ຽນສະຖານະຈາກ '${currentStatus}' ເປັນ '${targetStatus}' ສຳລັບລູກຄ້າ ID: ${customer.id}`);
            }

            const oldData = customer.toJSON();

            // อัปเดตสถานะใหม่
            customer.kyc_status = targetStatus;

            // ====================================================
            // 🌟 ຖ້າອະນຸມັດຜ່ານ (Verified) ໃຫ້ສ້າງ Member Code, ວັນທີ, ແລະ ວົງເງິນ
            // ====================================================
            if (targetStatus === 'verified' && currentStatus === 'unverified') {
                const yyyy = new Date().getFullYear().toString(); // ເຊັ່ນ 2026

                // 🟢 ຈັດການ locationCode: ໃຊ້ district_id ຖ້າມີ 3 ຫຼັກໃຫ້ຕື່ມ 0 ດ້ານໜ້າ, ຖ້າມີ 4 ຫຼັກກໍໃຊ້ໄດ້ເລີຍ
                const locationCode = customer.district_id
                    ? String(customer.district_id).padStart(4, '0')
                    : '0000'; // Fallback ກໍລະນີບໍ່ມີຂໍ້ມູນ

                const prefix = `INS-${locationCode}-${yyyy}-`; // ຕົວຢ່າງ: INS-0801-2026- ຫຼື INS-0101-2026-

                // 🟢 1: ດຶງລະຫັດທີ່ເຄີຍຖືກສ້າງໄປແລ້ວໃນ Prefix ດຽວກັນ ພ້ອມລັອກຕາຕະລາງ (Pessimistic Locking)
                const existingRecords = await db.customers.findAll({
                    where: {
                        member_code: {
                            [Op.like]: `${prefix}%`
                        }
                    },
                    attributes: ['member_code'],
                    transaction,
                    lock: transaction?.LOCK.UPDATE // Lock ປ້ອງກັນ Transaction ອື່ນມາແຍ່ງລະຫັດ
                });

                // 🟢 2: ນຳລະຫັດທີ່ຫາເຈີເຂົ້າ Set ເພື່ອຄວາມໄວໃນການເຊັກຊ້ຳ (O(1))
                const existingCodes = new Set(existingRecords.map(record => record.member_code));

                let random6: string;
                let newMemberCode: string;

                // 🟢 3: ສຸ່ມລະຫັດ 6 ຫຼັກ ຖ້າຊ້ຳໃຫ້ສຸ່ມໃໝ່ທັນທີພາຍໃນລູບ (Do-While)
                do {
                    // ສຸ່ມໂຕເລກ 6 ຫຼັກ ແບບປອດໄພ (100000 - 999999)
                    random6 = Math.floor(100000 + Math.random() * 900000).toString();
                    newMemberCode = `${prefix}${random6}`;
                } while (existingCodes.has(newMemberCode));

                customer.member_code = newMemberCode;

                // 🟢 4: ກຳນົດວັນອອກບັດ ແລະ ວັນໝົດອາຍຸ (ອາຍຸ 5 ປີ)
                const now = new Date();
                const expire = new Date();
                expire.setFullYear(now.getFullYear() + 5);

                customer.card_issue_at = now.toISOString().split('T')[0] as any;
                customer.card_expire_at = expire.toISOString().split('T')[0] as any;

                // 🟢 5: ສ້າງ Credit Limit ພື້ນຖານ 1,000,000 
                const existCredit = await db.customer_credits.findOne({
                    where: { customer_id: customer.id },
                    transaction,
                    lock: transaction?.LOCK.UPDATE
                });

                if (!existCredit) {
                    await db.customer_credits.create({
                        customer_id: customer.id,
                        credit_limit: 1000000.00,
                        cash_advance_limit: 300000.00, // 30% ຂອງວົງເງິນ
                        used_cash_advance: 0,
                        available_balance: 1000000.00,
                        status: 'active'
                    }, { transaction });
                }
            }

            await customer.save({ transaction });

            // 🟢 บันทึก Audit Log
            await logAudit('customers', customer.id, 'UPDATE', oldData, customer.toJSON(), performedBy, transaction);

            updatedCustomers.push(customer);
        }

        return updatedCustomers;
    }
}

export default new CustomerRepository();