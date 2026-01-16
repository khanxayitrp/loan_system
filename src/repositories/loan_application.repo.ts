import { loan_applications, loan_applicationsAttributes, loan_applicationsCreationAttributes } from "@/models/loan_applications";
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op } from 'sequelize';

export type status = "pending" | "verifying" | "approved" | "rejected" | "cancelled" | "completed" | "closed_early" | undefined;
class LoanApplicationRepository {
    
    async createLoanApplication(data: loan_applicationsCreationAttributes): Promise<loan_applications> {
        try {
            const cleanLoanApplication = { ...data };

            if (!cleanLoanApplication.customer_id || cleanLoanApplication.customer_id === 0) {
                throw new Error('Customer ID is required');
            }
            if (!cleanLoanApplication.product_id || cleanLoanApplication.product_id === 0) {
                throw new Error('Product ID is required');
            }

            if (!cleanLoanApplication.total_amount || cleanLoanApplication.total_amount === 0) {
                throw new Error('Total amount is required');
            }
            if (!cleanLoanApplication.interest_rate_at_apply || cleanLoanApplication.interest_rate_at_apply === 0) {
                throw new Error('Interest rate at apply is required');
            }
            if (!cleanLoanApplication.loan_period || cleanLoanApplication.loan_period === 0) {
                throw new Error('Loan period is required');
            }

            if (cleanLoanApplication.customer_id && typeof cleanLoanApplication.customer_id === 'object') {
                cleanLoanApplication.customer_id = (cleanLoanApplication.customer_id as any).id || (cleanLoanApplication.customer_id as any).customer_id;
            }

            const mapData: any = {
                customer_id: cleanLoanApplication.customer_id,
                product_id: cleanLoanApplication.product_id,
                total_amount: cleanLoanApplication.total_amount,
                interest_rate_at_apply: cleanLoanApplication.interest_rate_at_apply,
                loan_period: cleanLoanApplication.loan_period,
                monthly_installment: cleanLoanApplication.monthly_installment,
                is_confirmed: cleanLoanApplication.is_confirmed || 0,
                status: cleanLoanApplication.status || 'pending',
                requester_id: cleanLoanApplication.requester_id || null,
                approver_id: cleanLoanApplication.approver_id || null,
                remarks: cleanLoanApplication.remarks || null,
            };
            const newLoanApplication = await db.loan_applications.create(mapData);
            logger.info(`Loan application created with ID: ${newLoanApplication.id}`);
            return newLoanApplication;
        } catch (error) {
            logger.error(`Error creating loan application: ${(error as Error).message}`);
            throw error;
        }
    }

    async findLoanApplicationById(loanApplicationId: number): Promise<loan_applications | null> {
        return await db.loan_applications.findByPk(loanApplicationId);
    }

    async findLoanApplicationsByCustomerId(customerId: number): Promise<loan_applications[]> {
        return await db.loan_applications.findAll({ where: { customer_id: customerId } });
    }

    async findLoanApplicationsByStatus(status: string): Promise<loan_applications[]> {
        return await db.loan_applications.findAll({ where: { status: status } });
    }

    async findLoanApplicationsByRequesterId(requesterId: number): Promise<loan_applications[]> {
        return await db.loan_applications.findAll({ where: { requester_id: requesterId } });
    }

    async findLoanApplicationsByProductId(productId: number): Promise<loan_applications[]> {
        return await db.loan_applications.findAll({ where: { product_id: productId } });
    }

    async findLoanApplicationsInAmountRange(minAmount: number, maxAmount: number): Promise<loan_applications[]> {
        return await db.loan_applications.findAll({
            where: {
                total_amount: {
                    [Op.between]: [minAmount, maxAmount]
                }
            }
        });
    }
    async findLoanApplicationByCustomerAndStatus(customerId: number, status: string): Promise<loan_applications[]> {
        return await db.loan_applications.findAll({ where: { customer_id: customerId, status: status } });
    }

    async findLoanApplicationsByRequesterAndStatus(requesterId: number, status: string): Promise<loan_applications[]> {
        return await db.loan_applications.findAll({ where: { requester_id: requesterId, status: status } });
    }

    async updateLoanApplication(loanApplicationId: number, data: Partial<loan_applicationsAttributes>): Promise<loan_applications | null> {
        try {
            const loanApplication = await this.findLoanApplicationById(loanApplicationId);
            if (!loanApplication) {
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                return null;
            }

            if (data.customer_id && typeof data.customer_id === 'object') {
                data.customer_id = (data.customer_id as any).id || (data.customer_id as any).customer_id;
            }
            let loan_status = 'pending';
            let loan_monthly_installment = loanApplication.monthly_installment;


            if (loanApplication.is_confirmed === 0) {
                loan_status = 'cancelled';
                if (data.loan_period && data.loan_period !== loanApplication.loan_period) {
                    loan_status = 'pending';
                    // Recalculate monthly installment
                    // สูตร: (เงินต้น + ดอกเบี้ยรวม) / จำนวนงวด
                    const totalInterest = (loanApplication.total_amount * loanApplication.interest_rate_at_apply) / 100;
                    loan_monthly_installment = parseFloat(((loanApplication.total_amount + totalInterest) / data.loan_period).toFixed(2));
                }
            } else {
                loan_status = 'verifying';
                if (data.approver_id) {
                    loan_status = 'approved';
                }
            }
            // 4. สร้าง Object ข้อมูลที่จะอัปเดต (mapData)
            const mapData: any = {
                ...data, // รวมข้อมูลที่ส่งมาจากข้างนอกทั้งหมด
                status: loan_status,
                monthly_installment: loan_monthly_installment,
                loan_period: data.loan_period
            };

            if (loan_status === 'verifying' && !loanApplication.applied_at) {
                mapData.applied_at = new Date();
            }
            if (loan_status === 'approved' && !loanApplication.approved_at) {
                mapData.approved_at = new Date();
            }
            const updatedLoanApplication = await loanApplication.update(mapData, {
                where: { id: loanApplicationId },
                returning: true
            });
            logger.info(`Loan application updated with ID: ${loanApplicationId}`);
            return updatedLoanApplication;
        } catch (error) {
            logger.error(`Error updating loan application: ${(error as Error).message}`);
            throw error;
        }
    }

    
    async updateLoanApplicationStatus(loanApplicationId: number, status: any): Promise<loan_applications | null> {
        try {
            const loanApplication = await this.findLoanApplicationById(loanApplicationId);
            if (!loanApplication) {
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                return null;
            }

            if (loanApplication.status === status) {
                logger.info(`Loan application status is already ${status}`);
                return loanApplication;
            }
            let confirmed = loanApplication.is_confirmed;
            let loan_status: loan_applications['status'] = loanApplication.status;
            if (loanApplication.is_confirmed === 0) {
                confirmed = 1;
            }
            if (loanApplication.status !== 'pending') {
                loan_status = status;
            } else {
                logger.warn(`Attempted to update status via incorrect function for Loan ID: ${loanApplicationId} (Status is pending)`);
                // คุณอาจจะเลือก throw error ตรงนี้ถ้าต้องการให้ Frontend รู้
            }
            // 5. เตรียม Object สำหรับอัปเดต (เพิ่มเรื่องวันที่อัตโนมัติ)
            const updateData: any = { 
                is_confirmed: confirmed, 
                status: loan_status 
            };

            if (loan_status === 'verifying' && !loanApplication.applied_at) {
                updateData.applied_at = new Date();
            }
            if (loan_status === 'approved' && !loanApplication.approved_at) {
                updateData.approved_at = new Date();
            }
            const updatedLoanApplication = await loanApplication.update(updateData);
            logger.info(`Loan application status updated with ID: ${loanApplicationId}`);
            return updatedLoanApplication;
        } catch (error) {
            logger.error(`Error updating loan application status: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new LoanApplicationRepository();