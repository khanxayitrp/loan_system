"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger"); // ปรับ path เป็น relative ให้เหมือนไฟล์อื่น
const sequelize_1 = require("sequelize");
// 🟢 1. Import Helper ของเราเข้ามา
const auditLogger_1 = require("../utils/auditLogger");
class CustomerRepository {
    async createCustomer(data, options = {}) {
        try {
            const cleanCustomer = { ...data };
            if (!cleanCustomer.first_name || cleanCustomer.first_name.trim() === '') {
                throw new Error('First name is required');
            }
            if (!cleanCustomer.last_name || cleanCustomer.last_name.trim() === '') {
                throw new Error('Last name is required');
            }
            if (!cleanCustomer.phone || cleanCustomer.phone.trim() === '') {
                throw new Error('Phone number is required');
            }
            if (!cleanCustomer.address || cleanCustomer.address.trim() === '') {
                throw new Error('Address is required');
            }
            if (!cleanCustomer.occupation || cleanCustomer.occupation.trim() === '') {
                throw new Error('Occupation is required');
            }
            if (!cleanCustomer.identity_number || cleanCustomer.identity_number.trim() === '') {
                throw new Error('Identity number is required');
            }
            if (cleanCustomer.income_per_month === undefined || cleanCustomer.income_per_month === 0) {
                throw new Error('Income per month is required');
            }
            const existCustomer = await init_models_1.db.customers.findOne({ where: { identity_number: cleanCustomer.identity_number }, transaction: options.transaction });
            if (existCustomer) {
                logger_1.logger.error(`Identity number already exists: ${cleanCustomer.identity_number}`);
                throw new Error('Identity number already exists');
            }
            const mapData = {
                identity_number: cleanCustomer.identity_number,
                first_name: cleanCustomer.first_name,
                last_name: cleanCustomer.last_name,
                phone: cleanCustomer.phone,
                address: cleanCustomer.address,
                occupation: cleanCustomer.occupation,
                income_per_month: cleanCustomer.income_per_month,
            };
            const newCustomer = await init_models_1.db.customers.create(mapData, { transaction: options.transaction });
            // 🟢 บันทึก Audit Log (CREATE)
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
        return await init_models_1.db.customers.findByPk(customerId, { transaction: options.transaction });
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
        return await init_models_1.db.customers.findOne({ where: { phone }, transaction: options.transaction });
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
            const customer = await this.findCustomerById(customerId, options);
            if (!customer) {
                logger_1.logger.error(`Customer with ID: ${customerId} not found`);
                return null;
            }
            // 🟢 เก็บข้อมูลเดิมก่อนถูกอัปเดต เพื่อไปทำ Audit Log
            const oldData = customer.toJSON();
            const mapData = {
                identity_number: data.identity_number || customer.identity_number,
                first_name: data.first_name || customer.first_name,
                last_name: data.last_name || customer.last_name,
                phone: data.phone || customer.phone,
                address: data.address || customer.address,
                occupation: data.occupation || customer.occupation,
                income_per_month: data.income_per_month || customer.income_per_month,
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
