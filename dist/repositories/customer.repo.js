"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger"); // ปรับ path เป็น relative ให้เหมือนไฟล์อื่น
const sequelize_1 = require("sequelize");
// 🟢 1. Import Helper ของเราเข้ามา
const auditLogger_1 = require("../utils/auditLogger");
const formatters_1 = require("../utils/formatters");
class CustomerRepository {
    async createCustomer(data, options = {}) {
        try {
            const cleanCustomer = { ...data };
            const { transaction } = options;
            // ==========================================
            // 🟢 1. ຈັດລະບຽບຂໍ້ມູນກ່ອນ (Data Normalization)
            // ==========================================
            // ຕັດເບີໂທໃຫ້ເປັນມາດຕະຖານ (020 / 030)
            if (cleanCustomer.phone) {
                cleanCustomer.phone = (0, formatters_1.formatStandardPhoneNumber)(cleanCustomer.phone);
            }
            // ✅ ສ້າງຕົວແປໃໝ່ເພີ່ມມາຮັບຄ່າແທນ ເພື່ອບໍ່ໃຫ້ຜິດ Type ຂອງ TypeScript
            let identityNumberToSave = cleanCustomer.identity_number || null;
            if (identityNumberToSave && (identityNumberToSave.trim() === '' || identityNumberToSave === 'ບໍ່ມີ')) {
                identityNumberToSave = null;
            }
            // ==========================================
            // 🟢 2. ກວດສອບຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ (Validation)
            // ==========================================
            if (!cleanCustomer.first_name || cleanCustomer.first_name.trim() === '') {
                throw new Error('ກະລຸນາປ້ອນຊື່ແທ້ (First name is required)');
            }
            if (!cleanCustomer.phone || cleanCustomer.phone.trim() === '') {
                throw new Error('ກະລຸນາປ້ອນເບີໂທລະສັບ (Phone number is required)');
            }
            if (!cleanCustomer.province_id || cleanCustomer.province_id.trim() === '') {
                throw new Error('ກະລຸນາເລືອກແຂວງ (Province ID is required)');
            }
            if (!cleanCustomer.district_id || cleanCustomer.district_id.trim() === '') {
                throw new Error('ກະລຸນາເລືອກເມືອງ (District ID is required)');
            }
            if (!cleanCustomer.address || cleanCustomer.address.trim() === '') {
                throw new Error('ກະລຸນາປ້ອນທີ່ຢູ່ (Address is required)');
            }
            if (!cleanCustomer.occupation || cleanCustomer.occupation.trim() === '') {
                throw new Error('ກະລຸນາປ້ອນອາຊີບ (Occupation is required)');
            }
            // 🟢 ແປງຄ່າລາຍຮັບເປັນຕົວເລກ ແລະ ກວດສອບວ່າຕ້ອງຫຼາຍກວ່າ 0
            const income = Number(cleanCustomer.income_per_month);
            if (isNaN(income) || income <= 0) {
                throw new Error('ລາຍຮັບຕໍ່ເດືອນຕ້ອງຫຼາຍກວ່າ 0 (Income per month must be greater than 0)');
            }
            cleanCustomer.income_per_month = income;
            // ==========================================
            // 🟢 3. ກວດສອບຂໍ້ມູນຊ້ຳກັນ (Duplicate Checks)
            // ==========================================
            // 3.1 ກວດສອບເບີໂທລະສັບຊ້ຳ (ສຳຄັນຫຼາຍ ປ້ອງກັນ DB Error 500)
            const existPhone = await init_models_1.db.customers.findOne({
                where: { phone: cleanCustomer.phone },
                transaction,
                lock: transaction?.LOCK.UPDATE
            });
            if (existPhone) {
                logger_1.logger.error(`Phone number already exists: ${cleanCustomer.phone}`);
                throw new Error('ເບີໂທລະສັບນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາກວດສອບຄືນໃໝ່');
            }
            // 3.2 ກວດສອບບັດປະຈຳຕົວຊ້ຳກັນ (ກວດສະເພາະຄົນທີ່ມີບັດ)
            if (identityNumberToSave !== null) {
                const existCustomer = await init_models_1.db.customers.findOne({
                    where: { identity_number: identityNumberToSave },
                    transaction,
                    lock: transaction?.LOCK.UPDATE
                });
                if (existCustomer) {
                    logger_1.logger.error(`Identity number already exists: ${identityNumberToSave}`);
                    throw new Error('ເລກບັດປະຈຳຕົວນີ້ມີໃນລະບົບແລ້ວ ກະລຸນາກວດສອບຄືນໃໝ່');
                }
            }
            // ==========================================
            // 🟢 4. ບັນທຶກຂໍ້ມູນ (Map Data & Create)
            // ==========================================
            const mapData = {
                identity_number: identityNumberToSave, // ✅ ໃຊ້ຕົວແປໃໝ່ທີ່ເຮົາຈັດການແລ້ວ
                first_name: cleanCustomer.first_name,
                last_name: cleanCustomer.last_name || '', // ກໍລະນີ last_name ເປັນ null ໃຫ້ເຊັດເປັນ string ວ່າງ
                phone: cleanCustomer.phone,
                province_id: cleanCustomer.province_id,
                district_id: cleanCustomer.district_id,
                address: cleanCustomer.address,
                age: cleanCustomer.age,
                occupation: cleanCustomer.occupation,
                income_per_month: cleanCustomer.income_per_month,
                other_debt: cleanCustomer.other_debt || 0,
            };
            const newCustomer = await init_models_1.db.customers.create(mapData, { transaction: options.transaction });
            // 🟢 5. ບັນທຶກ Audit Log (CREATE)
            const performedBy = data.user_id || data.performed_by || 1;
            await (0, auditLogger_1.logAudit)('customers', newCustomer.id, 'CREATE', null, newCustomer.toJSON(), performedBy, options.transaction);
            logger_1.logger.info(`Customer created with ID: ${newCustomer.id}`);
            return newCustomer;
        }
        catch (error) {
            logger_1.logger.error(`Error creating customer: ${error.message}`);
            throw error;
        }
    }
    async findCustomerById(customerId, options = {}) {
        return await init_models_1.db.customers.findByPk(customerId, { transaction: options.transaction, lock: options.lock });
    }
    async findCustomerByIdentityNumber(identityNumber) {
        return await init_models_1.db.customers.findOne({ where: { identity_number: identityNumber } });
    }
    async findCustomersByName(name, options = {}) {
        return await init_models_1.db.customers.findOne({
            where: sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn('CONCAT', sequelize_1.Sequelize.col('first_name'), ' ', sequelize_1.Sequelize.col('last_name')), {
                [sequelize_1.Op.like]: `%${name}%`
            }),
            transaction: options.transaction
        });
    }
    async findCustomersByPhone(phone, options = {}) {
        if (!phone)
            return null;
        const standardPhone = (0, formatters_1.formatStandardPhoneNumber)(phone);
        return await init_models_1.db.customers.findOne({ where: { phone: standardPhone }, transaction: options.transaction });
    }
    async findCustomersByIncomeRange(minIncome, maxIncome) {
        return await init_models_1.db.customers.findAll({
            where: {
                income_per_month: {
                    [sequelize_1.Op.between]: [minIncome, maxIncome]
                }
            }
        });
    }
    async updateCustomer(customerId, data, options = {}) {
        try {
            const { transaction } = options;
            const customer = await this.findCustomerById(customerId, { transaction, lock: transaction?.LOCK.UPDATE });
            if (!customer) {
                logger_1.logger.error(`Customer with ID: ${customerId} not found`);
                return null;
            }
            // 🟢 เก็บข้อมูลเดิมก่อนถูกอัปเดต เพื่อไปทำ Audit Log
            const oldData = customer.toJSON();
            // ==========================================
            // 🟢 1. ຈັດລະບຽບຂໍ້ມູນກ່ອນ (Data Normalization)
            // ==========================================
            let newPhone = data.phone;
            if (newPhone !== undefined) {
                newPhone = (0, formatters_1.formatStandardPhoneNumber)(newPhone);
            }
            let newIdentityNumber = data.identity_number;
            // ຖ້າສົ່ງມາເປັນຄ່າວ່າງ ຫຼື 'ບໍ່ມີ' ໃຫ້ແປງເປັນ null ແທ້ໆ
            if (newIdentityNumber === '' || newIdentityNumber === 'ບໍ່ມີ') {
                newIdentityNumber = null;
            }
            const mapData = {
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
            };
            // 🟢 ✅ แก้ไข Syntax การ Update ให้ถูกต้อง
            // การเรียกใช้ instance.update() รับแค่ก้อน data และ options แค่ก้อนเดียว
            const updatedCustomer = await customer.update(mapData, { transaction: options.transaction });
            // 🟢 บันทึก Audit Log (UPDATE)
            const performedBy = data.user_id || data.performed_by || 1;
            await (0, auditLogger_1.logAudit)('customers', customerId, 'UPDATE', oldData, mapData, performedBy, options.transaction);
            logger_1.logger.info(`Customer updated with ID: ${customerId}`);
            return updatedCustomer;
        }
        catch (error) {
            logger_1.logger.error(`Error updating customer: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new CustomerRepository();
