import { customers, customersAttributes, customersCreationAttributes } from '../models/customers';
import { db } from '../models/init-models';
import { logger } from '../utils/logger'; 
import { Op, Sequelize, Transaction } from 'sequelize';

// 🟢 1. Import Helper ของเราเข้ามา
import { logAudit } from '../utils/auditLogger';
import { formatStandardPhoneNumber } from '../utils/formatters';

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
                throw new Error('ກະລຸນາປ້ອນຊື່ແທ້ (First name is required)');
            }
            if (!cleanCustomer.phone || String(cleanCustomer.phone).trim() === '') {
                throw new Error('ກະລຸນາປ້ອນເບີໂທລະສັບ (Phone number is required)');
            }
            if (!cleanCustomer.province_id || String(cleanCustomer.province_id).trim() === '') {
                throw new Error('ກະລຸນາເລືອກແຂວງ (Province ID is required)');
            }
            if (!cleanCustomer.district_id || String(cleanCustomer.district_id).trim() === '') {
                throw new Error('ກະລຸນາເລືອກເມືອງ (District ID is required)');
            }
            if (!cleanCustomer.address || String(cleanCustomer.address).trim() === '') {
                throw new Error('ກະລຸນາປ້ອນທີ່ຢູ່ (Address is required)');
            }
            if (!cleanCustomer.occupation || String(cleanCustomer.occupation).trim() === '') {
                throw new Error('ກະລຸນາປ້ອນອາຊີບ (Occupation is required)');
            }
            
            const income = Number(cleanCustomer.income_per_month);
            if (isNaN(income) || income <= 0) {
                throw new Error('ລາຍຮັບຕໍ່ເດືອນຕ້ອງຫຼາຍກວ່າ 0 (Income per month must be greater than 0)');
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
                throw new Error('ເບີໂທລະສັບນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາກວດສອບຄືນໃໝ່');
            }

            if (identityNumberToSave !== null) {
                const existCustomer = await db.customers.findOne({
                    where: { identity_number: identityNumberToSave },
                    transaction,
                    lock: transaction?.LOCK.UPDATE
                });

                if (existCustomer) {
                    logger.error(`Identity number already exists: ${identityNumberToSave}`);
                    throw new Error('ເລກບັດປະຈຳຕົວນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາກວດສອບຄືນໃໝ່');
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
                province_id: cleanCustomer.province_id,
                district_id: cleanCustomer.district_id,
                address: cleanCustomer.address,
                age: cleanCustomer.age,
                occupation: cleanCustomer.occupation,
                income_per_month: cleanCustomer.income_per_month,
                other_debt: cleanCustomer.other_debt || 0,
                // 🌟 เพิ่มฟิลด์ใหม่
                profile_image_url: (cleanCustomer as any).profile_image_url || null,
                account_number: (cleanCustomer as any).account_number || null,
                membership_tier_id: (cleanCustomer as any).membership_tier_id || null,
                membership_score: (cleanCustomer as any).membership_score || 0,
            };

            const newCustomer = await db.customers.create(mapData, { transaction: options.transaction });

            // 🟢 5. ບັນທຶກ Audit Log (CREATE)
            const performedBy = (data as any).user_id || (data as any).performed_by || 1;
            await logAudit('customers', newCustomer.id, 'CREATE', null, newCustomer.toJSON(), performedBy, options.transaction);

            logger.info(`Customer created with ID: ${newCustomer.id}`);
            return newCustomer;

        } catch (error) {
            logger.error(`Error creating customer: ${(error as Error).message}`);
            throw error;
        }
    }

    async findCustomerById(customerId: number, options: { transaction?: any, lock?: any } = {}): Promise<customers | null> {
        return await db.customers.findByPk(customerId, { transaction: options.transaction, lock: options.lock });
    }

    async findCustomerByIdentityNumber(identityNumber: string): Promise<customers | null> {
        return await db.customers.findOne({ where: { identity_number: identityNumber } });
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
                age: data.age !== undefined ? data.age : customer.age,
                province_id: data.province_id !== undefined ? data.province_id : customer.province_id,
                district_id: data.district_id !== undefined ? data.district_id : customer.district_id,
                address: data.address !== undefined ? data.address : customer.address,
                occupation: data.occupation !== undefined ? data.occupation : customer.occupation,
                income_per_month: data.income_per_month !== undefined ? data.income_per_month : customer.income_per_month,
                other_debt: data.other_debt !== undefined ? data.other_debt : customer.other_debt,
                // 🌟 เพิ่มฟิลด์ใหม่ให้สามารถอัปเดตได้
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
}

export default new CustomerRepository();