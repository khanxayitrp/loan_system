import { repayments, repaymentsAttributes, repaymentsCreationAttributes } from '../models/repayments';
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op, Sequelize, where } from 'sequelize';

class RepaymentRepository {
    async createRepayment(data: repaymentsCreationAttributes): Promise<repayments[]> {
        try {
            // Validate application_id
            if (!data.application_id || data.application_id === 0) {
                throw new Error('Application ID is required');
            }

            // Check if loan application exists
            const loanExist = await db.loan_applications.findByPk(data.application_id);
            if (!loanExist) {
                throw new Error('Associated loan application does not exist');
            }

            const plainApp = loanExist.get({ plain: true });

            // Extract loan details
            const loan_periods = plainApp?.loan_period || 0;
            const total_amount = plainApp?.total_amount || 0;
            const interest_rate = plainApp?.interest_rate_at_apply || 0;

            // Validate loan periods
            if (loan_periods <= 0) {
                throw new Error('Loan period must be greater than 0');
            }

            // Calculate amounts per installment
            const principal_per_installment = total_amount / loan_periods;
            const total_interest = (total_amount * interest_rate) / 100;
            const interest_per_installment = total_interest / loan_periods;
            const total_due_per_installment = principal_per_installment + interest_per_installment;

            // Create repayment schedule
            const repaymentSchedule: repaymentsCreationAttributes[] = [];
            let remaining_principal = total_amount;

            for (let i = 1; i <= loan_periods; i++) {
                // Calculate due date (assuming monthly installments)
                const due_date = new Date();
                due_date.setMonth(due_date.getMonth() + i);

                // Adjust remaining principal
                const current_principal = i === loan_periods
                    ? remaining_principal // Last installment takes remaining amount
                    : principal_per_installment;

                remaining_principal -= current_principal;

                repaymentSchedule.push({
                    application_id: data.application_id,
                    installment_no: i,
                    due_date: due_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
                    principal_amount: current_principal,
                    interest_amount: interest_per_installment,
                    total_due: current_principal + interest_per_installment,
                    remaining_principal: Math.max(0, remaining_principal),
                    payment_status: 'unpaid',
                });
            }

            // Bulk create all repayments
            const createdRepayments = await db.repayments.bulkCreate(repaymentSchedule);

            logger.info(`Created ${createdRepayments.length} repayment installments for application ${data.application_id}`);

            return createdRepayments;
        } catch (error) {
            logger.error(`Error creating repayment schedule: ${(error as Error).message}`);
            throw error;
        }
    }

    async findRepaymentsByApplicationId(applicationId: number): Promise<repayments[]> {
        return await db.repayments.findAll({ where: { application_id: applicationId } });
    }

    async findRepaymentById(repaymentId: number): Promise<repayments | null> {
        return await db.repayments.findByPk(repaymentId);
    }

    async updateRepayment(repaymentId: number, data: Partial<repaymentsAttributes>): Promise<repayments | null> {
        try {
            const repayment = await db.repayments.findByPk(repaymentId);
            if (!repayment) {
                logger.error(`Repayment with ID: ${repaymentId} not found`);
                return null;

            }
            const updateRepayment = await repayment.update(data, {
                where: { id: repaymentId },
                returning: true
            });
            logger.info(`Repayment with ID: ${repaymentId} updated successfully`);
            return updateRepayment;
        } catch (error) {
            logger.error(`Error updating repayment with ID: ${repaymentId} - ${(error as Error).message}`);
            throw error;
        }
    }
    async deleteRepaymentsByApplicationId(applicationId: number): Promise<number> {
        try {
            const deletedCount = await db.repayments.destroy({ where: { application_id: applicationId } });
            logger.info(`Deleted ${deletedCount} repayments for application ID: ${applicationId}`);
            return deletedCount;
        } catch (error) {
            logger.error(`Error deleting repayments for application ID: ${applicationId} - ${(error as Error).message}`);
            throw error;
        
        }
    }
}

export default new RepaymentRepository();