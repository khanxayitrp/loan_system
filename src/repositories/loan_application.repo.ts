import { loan_applications, loan_applicationsAttributes, loan_applicationsCreationAttributes } from "../models/loan_applications";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import customerRepo from "./customer.repo";
import { NotFoundError, ValidationError, handleErrorResponse } from '../utils/errors';

export type status = "pending" | "verifying" | "approved" | "rejected" | "cancelled" | "completed" | "closed_early" | undefined;
class LoanApplicationRepository {

    async createLoanApplication(data: Partial<loan_applicationsCreationAttributes>, options: { transaction?: any } = {}): Promise<loan_applications> {
        try {
            const { transaction } = options;
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
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();

            const last_loan_id = await db.loan_applications.findOne({
                where: { customer_id: cleanLoanApplication.customer_id },
                order: [['created_at', 'DESC']],
                attributes: ['loan_id'],
                transaction
            })
            let newSequence = 1;
            if (last_loan_id?.loan_id) {
                const parts = last_loan_id.loan_id.split('-');
                // ເອົາສ່ວນສຸດທ້າຍຂອງ Array ມາໃຊ້ (ປອດໄພກວ່າການລະບຸ index [3])
                const lastNum = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(lastNum)) newSequence = lastNum + 1;
            }

            const formattedId = `LN-${cleanLoanApplication.customer_id}-${currentYear}-${String(newSequence).padStart(6, '0')}`;
            console.log('cleanData is ', cleanLoanApplication)

            const mapData: any = {
                customer_id: cleanLoanApplication.customer_id,
                product_id: cleanLoanApplication.product_id,
                loan_id: formattedId,
                total_amount: cleanLoanApplication.total_amount,
                interest_rate_at_apply: cleanLoanApplication.interest_rate_at_apply,
                loan_period: cleanLoanApplication.loan_period,
                monthly_pay: cleanLoanApplication.monthly_pay,
                is_confirmed: cleanLoanApplication.is_confirmed || 0,
                status: cleanLoanApplication.status || 'pending',
                requester_id: cleanLoanApplication.requester_id || null,
                approver_id: cleanLoanApplication.approver_id || null,
                credit_score: cleanLoanApplication.credit_score || null,
                remarks: cleanLoanApplication.remarks || null,
            };
            const newLoanApplication = await db.loan_applications.create(mapData, { transaction });
            logger.info(`Loan application created with ID: ${newLoanApplication.id}`);
            return newLoanApplication;
        } catch (error) {
            logger.error(`Error creating loan application: ${(error as Error).message}`);
            throw error;
        }
    }

    async findLoanApplicationByLoanId(loanId: string): Promise<loan_applications | null> {
        return await db.loan_applications.findOne({
            where: { loan_id: loanId },
            include: [
                {
                    model: db.customers,
                    as: 'customer',
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number',  'address', 'age', 'occupation', 'income_per_month'],
                    include: [
                        {
                            model: db.customer_work_info,
                            as: 'customer_work_infos',  // Assuming the association alias; adjust if different
                            attributes: ['id', 'company_name', 'address', 'phone', 'business_type', 'business_detail', 'duration_years', 'duration_months', 'department', 'position', 'salary', 'created_at']
                        }
                    ]
                },
                {
                    model: db.products,
                    as: 'product',
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price', 'interest_rate']
                },
                {
                    model: db.users,
                    as: 'requester',
                    attributes: ['id', 'username', 'full_name']
                },
                {
                    model: db.loan_guarantors,
                    as: 'loan_guarantors',  // Assuming the association alias; adjust if different
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary']
                }
            ],
        });
    }
    async findLoanApplicationById(loanApplicationId: number): Promise<loan_applications | null> {
        return await db.loan_applications.findOne({
            where: {
                id: loanApplicationId
            },
            include: [
                {
                    model: db.customers,
                    as: 'customer',
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number',  'address', 'age', 'occupation', 'income_per_month'],
                    include: [
                        {
                            model: db.customer_work_info,
                            as: 'customer_work_infos',  // Assuming the association alias; adjust if different
                            attributes: ['id', 'company_name', 'address', 'phone', 'business_type', 'business_detail', 'duration_years', 'duration_months', 'department', 'position', 'salary', 'created_at']
                        }
                    ]
                },
                {
                    model: db.products,
                    as: 'product',
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price', 'interest_rate']
                },
                {
                    model: db.users,
                    as: 'requester',
                    attributes: ['id', 'username', 'full_name']
                },
                {
                    model: db.loan_guarantors,
                    as: 'loan_guarantors',  // Assuming the association alias; adjust if different
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary']
                }
            ],
        });
    }

    // loan.repository.ts
    async findLoanApplications(filters: any): Promise<loan_applications[]> {
        const { customerId, requesterId, productId, status, min, max, is_confirmed } = filters;
        const whereClause: any = {};

        if (customerId) whereClause.customer_id = customerId;
        if (requesterId) whereClause.requester_id = requesterId;
        if (productId) whereClause.product_id = productId;
        if (status) whereClause.status = status;
        if (is_confirmed !== undefined) whereClause.is_confirmed = is_confirmed;  // ✅ เพิ่ม (รองรับ 0/1)

        // จัดการช่วงจำนวนเงิน (Range Amount)
        if (min !== undefined || max !== undefined) {
            whereClause.total_amount = {};
            if (min !== undefined) whereClause.total_amount[Op.gte] = min; // มากกว่าหรือเท่ากับ
            if (max !== undefined) whereClause.total_amount[Op.lte] = max; // น้อยกว่าหรือเท่ากับ
        }
        console.log('🔍 Generated Where Clause:', whereClause);
        return await db.loan_applications.findAll({
            where: whereClause,
            include: [
                {
                    model: db.customers,
                    as: 'customer',
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number',  'address', 'age', 'occupation', 'income_per_month'],
                    include: [
                        {
                            model: db.customer_work_info,
                            as: 'customer_work_infos',  // Assuming the association alias; adjust if different
                            attributes: ['id', 'company_name', 'address', 'phone', 'business_type', 'business_detail', 'duration_years', 'duration_months', 'department', 'position', 'salary', 'created_at']
                        }
                    ]
                },
                {
                    model: db.products,
                    as: 'product',
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price', 'interest_rate']
                },
                {
                    model: db.users,
                    as: 'requester',
                    attributes: ['id', 'username', 'full_name']
                },
                {
                    model: db.loan_guarantors,
                    as: 'loan_guarantors',  // Assuming the association alias; adjust if different
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary']
                }
            ],
        
            order: [['created_at', 'DESC']] // เรียงลำดับตามความเหมาะสม
        });
    }

    // async findLoanApplicationsByCustomerId(customerId: number): Promise<loan_applications[]> {
    //     return await db.loan_applications.findAll({ where: { customer_id: customerId } });
    // }

    // async findLoanApplicationsByStatus(status: string): Promise<loan_applications[]> {
    //     return await db.loan_applications.findAll({ where: { status: status } });
    // }

    // async findLoanApplicationsByRequesterId(requesterId: number): Promise<loan_applications[]> {
    //     return await db.loan_applications.findAll({ where: { requester_id: requesterId } });
    // }

    // async findLoanApplicationsByProductId(productId: number): Promise<loan_applications[]> {
    //     return await db.loan_applications.findAll({ where: { product_id: productId } });
    // }

    // async findLoanApplicationsInAmountRange(minAmount: number, maxAmount: number): Promise<loan_applications[]> {
    //     return await db.loan_applications.findAll({
    //         where: {
    //             total_amount: {
    //                 [Op.between]: [minAmount, maxAmount]
    //             }
    //         }
    //     });
    // }
    // async findLoanApplicationByCustomerAndStatus(customerId: number, status: string): Promise<loan_applications[]> {
    //     return await db.loan_applications.findAll({ where: { customer_id: customerId, status: status } });
    // }

    // async findLoanApplicationsByRequesterAndStatus(requesterId: number, status: string): Promise<loan_applications[]> {
    //     return await db.loan_applications.findAll({ where: { requester_id: requesterId, status: status } });
    // }

    async updateDraftLoanApplication(loanApplicationId: number, data: any): Promise<loan_applications | null> {
        const transaction = await db.sequelize.transaction();
        try {
            const loanApplication = await loan_applications.findByPk(loanApplicationId, { transaction });
            if (!loanApplication) {
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                await transaction.rollback(); // ຢ່າລືມ rollback ກ່ອນ return
                return null;
            }
            console.log(' This Data is ', data)
            // 2. ຈັດການ Customer ID
            let customerId = data.customer_id;
            if (customerId && typeof customerId === 'object') {
                customerId = customerId.id || customerId.customer_id;
            }
            // let loan_status = 'pending';
            // 3. Update ຂໍ້ມູນລູກຄ້າ
            const custData = {
                identity_number: data.identity_number,
                census_number: data.census_number || null,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                address: data.address,
                date_of_birth: data.date_of_birth || null,
                age: data.age,
                occupation: data.occupation,
                income_per_month: data.income_per_month,
                unit: data.unit || null,
                issue_place: data.issue_place || null,
                issue_date: data.issue_date || null
            };

            const customer = await db.customers.findByPk(customerId, { transaction });
            if (!customer) throw new NotFoundError('ບໍ່ພົບລູກຄ້າ');

            await customer.update(custData, { transaction });


            const mapData: any = {
                product_id: data.product_id,
                total_amount: data.total_amount,
                interest_rate_at_apply: data.interest_rate_at_apply,
                // status: loan_status,
                monthly_pay: data.monthly_pay,
                loan_period: data.loan_period,
                down_payment: data.down_payment || null,
                fee: data.fee || null,
                first_intstallment_amount: data.first_intstallment_amount || null,
                payment_day: data.payment_day,
                borrower_signature_date: data.borrower_signature_date || null,
                guarantor_signature_date: data.guarantor_signature_date || null,
                staff_signature_date: data.staff_signature_date || null
            };

            // ✅ ແກ້ໄຂ Syntax: ໃສ່ transaction ໄວ້ໃນ object ທີສອງ
            const updatedLoan = await loanApplication.update(mapData, { transaction });

            await transaction.commit();
            logger.info(`Draft Loan application updated with ID: ${loanApplicationId}`);

            return updatedLoan;
        } catch (error) {
            await transaction.rollback();
            logger.error(`Error updating Draft loan application: ${(error as Error).message}`);
            throw error;
        }
    }
    async updateLoanApplication(loanApplicationId: number, data: Partial<loan_applicationsAttributes>): Promise<loan_applications | null> {
        try {
            const loanApplication = await this.findLoanApplicationById(loanApplicationId);
            console.log("request from loanApplication ", loanApplication)
            if (!loanApplication) {
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                return null;
            }
            console.log("request from client ", data)
            if (data.customer_id && typeof data.customer_id === 'object') {
                data.customer_id = (data.customer_id as any).id || (data.customer_id as any).customer_id;
            }
            let loan_status = 'pending';
            let loan_monthly_installment = loanApplication.monthly_pay;


            if (!loanApplication.is_confirmed) {
                loan_status = data.status!.toString();
                console.log('this data is: ', loan_status)
                if (data.loan_period && data.loan_period !== loanApplication.loan_period) {
                    loan_status = 'pending';
                    // Recalculate monthly installment
                    // สูตร: (เงินต้น + ดอกเบี้ยรวม) / จำนวนงวด
                    const totalInterest = (loanApplication.total_amount * loanApplication.interest_rate_at_apply) / 100;
                    loan_monthly_installment = parseFloat(((loanApplication.total_amount + totalInterest) / data.loan_period).toFixed(2));
                }
            } else {
                loan_status = 'verifying';
                console.log('this data1 is: ', loan_status)
                if (data.approver_id) {
                    loan_status = 'approved';
                    console.log('this data2 is: ', loan_status)
                }
            }
            console.log('this last data is: ', loan_status)
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