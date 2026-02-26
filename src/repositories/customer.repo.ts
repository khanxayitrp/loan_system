import { customers, customersAttributes, customersCreationAttributes } from '../models/customers';
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op, Sequelize, Transaction } from 'sequelize';

class CustomerRepository {
    async createCustomer(data: customersCreationAttributes, options: { transaction?: any } = {}): Promise<customers> {
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
                throw new Error('Identity number is required')
            }
            if (cleanCustomer.income_per_month === undefined || cleanCustomer.income_per_month === 0) {
                throw new Error('Income per month is required');
            }

            const existCustomer = await db.customers.findOne({ where: { identity_number: cleanCustomer.identity_number }, transaction: options.transaction });
            if (existCustomer) {
                logger.error(`Identity number already exists: ${cleanCustomer.identity_number}`);
                throw new Error('Identity number already exists');
            }
            const mapData: any = {
                identity_number: cleanCustomer.identity_number,
                first_name: cleanCustomer.first_name,
                last_name: cleanCustomer.last_name,
                phone: cleanCustomer.phone,
                address: cleanCustomer.address,
                occupation: cleanCustomer.occupation,
                income_per_month: cleanCustomer.income_per_month,
            };
            const newCustomer = await db.customers.create(mapData, { transaction: options.transaction });
            logger.info(`Customer created with ID: ${newCustomer.id}`);
            return newCustomer;

        } catch (error) {
            logger.error(`Error creating customer: ${(error as Error).message}`);
            throw error;
        }
    }
    async findCustomerById(customerId: number, options: { transaction?: any } = {}): Promise<customers | null> {
        return await db.customers.findByPk(customerId, { transaction: options.transaction });
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
        return await db.customers.findOne({ where: { phone }, transaction: options.transaction });
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
            const customer = await this.findCustomerById(customerId, options);
            if (!customer) {
                logger.error(`Customer with ID: ${customerId} not found`);
                return null;
            }
            const mapData: any = {
                identity_number: data.identity_number || customer.identity_number,
                first_name: data.first_name || customer.first_name,
                last_name: data.last_name || customer.last_name,
                phone: data.phone || customer.phone,
                address: data.address || customer.address,
                occupation: data.occupation || customer.occupation,
                income_per_month: data.income_per_month || customer.income_per_month,
            }

            const updateCustomer = await customer.update(mapData, {
                where: { id: customerId },
                returning: true
            }, { transaction: options.transaction });
            logger.info(`Customer updated with ID: ${customerId}`);
            return customer;
        } catch (error) {
            logger.error(`Error updating customer: ${(error as Error).message}`);
            throw error;
        }

    }


}

export default new CustomerRepository();