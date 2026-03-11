import { loan_applications, loan_applicationsAttributes, loan_applicationsCreationAttributes } from "../models/loan_applications";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op, Transaction } from 'sequelize';
import customerRepo from "./customer.repo";
import { NotFoundError, ValidationError, handleErrorResponse } from '../utils/errors';
import { logAudit } from "../utils/auditLogger";


export type action = "submitted" | "verified_basic" | "verified_call" | "verified_cib" | "verified_field" | "assessed_income" | "approved" | "rejected" | "returned_for_edit" | "cancelled";

// export type status = "pending" | "verifying" | "approved" | "rejected" | "cancelled" | "completed" | "closed_early" | undefined;
class LoanApplicationRepository {

    // // ==========================================
    // // 🟢 HELPER FUNCTION: สำหรับบันทึก Audit Log
    // // (ถ้าในไฟล์ Repository นี้ยังไม่มี ให้ก๊อปปี้ฟังก์ชันนี้ไปไว้ในคลาสด้วยครับ)
    // // ==========================================
    // private async logAudit(
    //     tableName: string,
    //     recordId: number,
    //     action: 'CREATE' | 'UPDATE' | 'DELETE',
    //     oldValues: any,
    //     newValues: any,
    //     performedBy: number,
    //     t: Transaction
    // ) {
    //     let changedColumns: any = undefined;

    //     if (action === 'UPDATE' && oldValues && newValues) {
    //         const changes: string[] = [];
    //         for (const key in newValues) {
    //             if (newValues[key] !== undefined && oldValues[key] != newValues[key]) {
    //                 changes.push(key);
    //             }
    //         }
    //         if (changes.length === 0) return;
    //         changedColumns = changes;
    //     }

    //     await db.audit_logs.create({
    //         table_name: tableName,
    //         record_id: recordId,
    //         action: action,
    //         old_values: oldValues || undefined,
    //         new_values: newValues || undefined,
    //         changed_columns: changedColumns,
    //         performed_by: performedBy
    //     }, { transaction: t });
    // }

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
            
            // 🟢 2. บันทึก Audit Log (CREATE)
            // โดยดึง ID ผู้ทำรายการมาจาก requester_id (ถ้าไม่มีให้ Default เป็น 1)
            const performedBy = cleanLoanApplication.requester_id || 1;
            await logAudit('loan_applications', newLoanApplication.id, 'CREATE', null, newLoanApplication.toJSON(), performedBy, transaction);

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
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number', 'address', 'age', 'occupation', 'income_per_month', 'unit', 'issue_place', 'issue_date'],
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
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price', 'interest_rate'],
                    include: [
                        {
                            model: db.partners,
                            as: 'partner',  // Assuming the association alias; adjust if different
                            attributes: ['id', 'shop_id', 'shop_name', 'shop_owner', 'contact_number', 'shop_logo_url', 'address', 'business_type', 'is_active'],
                        }
                    ]
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
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number', 'address', 'age', 'occupation', 'income_per_month', 'unit', 'issue_place', 'issue_date'],
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
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price', 'interest_rate'],
                    include: [
                        {
                            model: db.partners,
                            as: 'partner',  // Assuming the association alias; adjust if different
                            attributes: ['id', 'shop_id', 'shop_name', 'shop_owner', 'contact_number', 'shop_logo_url', 'address', 'business_type', 'is_active'],
                        }
                    ]
                },
                {
                    model: db.users,
                    as: 'requester',
                    attributes: ['id', 'username', 'full_name']
                },
                {
                    model: db.users,
                    as: 'approver',
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
    async findLoanApplications(filters: any): Promise<{ rows: loan_applications[]; count: number }> {
        const { customerId, requesterId, productId, status, min, max, is_confirmed, page, limit } = filters;
        const whereClause: any = {};

        if (customerId) whereClause.customer_id = customerId;
        if (requesterId) whereClause.requester_id = requesterId;
        if (productId) whereClause.product_id = productId;
        if (status) whereClause.status = status;
        if (is_confirmed !== undefined) whereClause.is_confirmed = is_confirmed;  // ✅ เพิ่ม (รองรับ 0/1)

        // 🟢 จัดการ Status ให้รองรับทั้งแบบ Array, String คั่นด้วยลูกน้ำ และแบบค่าเดียว
        // รองรับกรณี Axios ส่งมาเป็น status[] ด้วย
        let inputStatus = filters.status || filters['status[]'];

        if (inputStatus) {
            if (Array.isArray(inputStatus)) {
                // กรณีส่งมาเป็น Array: ['pending', 'verifying']
                whereClause.status = { [Op.in]: inputStatus };
            } else if (typeof inputStatus === 'string' && inputStatus.includes(',')) {
                // กรณีส่งมาเป็น String: 'pending,verifying'
                whereClause.status = { [Op.in]: inputStatus.split(',') };
            } else {
                // กรณีส่งมาเป็นค่าเดียว: 'pending'
                whereClause.status = inputStatus;
            }
        }
        // จัดการช่วงจำนวนเงิน (Range Amount)
        if (min !== undefined || max !== undefined) {
            whereClause.total_amount = {};
            if (min !== undefined) whereClause.total_amount[Op.gte] = min; // มากกว่าหรือเท่ากับ
            if (max !== undefined) whereClause.total_amount[Op.lte] = max; // น้อยกว่าหรือเท่ากับ
        }
        console.log('🔍 Generated Where Clause:', whereClause);

        // Pagination calculation
        let pageNum = 1;
        let limitNum = 10;

        if (page) {
            pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
        }
        if (limit) {
            limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        }

        const offset = (pageNum - 1) * limitNum;

        return await db.loan_applications.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.customers,
                    as: 'customer',
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone'],

                },
                {
                    model: db.products,
                    as: 'product',
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name'],

                },
                {
                    model: db.users,
                    as: 'requester',
                    attributes: ['id', 'username', 'full_name']
                },

            ],

            order: [['created_at', 'DESC']], // เรียงลำดับตามความเหมาะสม
            limit: limitNum,
            offset: offset,
            distinct: true // Ensure count is correct with includes
        });
    }



    async updateDraftLoanApplication(loanApplicationId: number, data: any): Promise<loan_applications | null> {
        const transaction = await db.sequelize.transaction();
        try {
            const loanApplication = await loan_applications.findByPk(loanApplicationId, { transaction });
            if (!loanApplication) {
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                await transaction.rollback(); 
                return null;
            }
            console.log(' This Data is ', data)

            // 🟢 ดึง ID พนักงาน/ยูสเซอร์ที่ทำรายการ
            const performedBy = data.user_id || data.performed_by;
            if (!performedBy) {
                logger.error('User ID is required');
                await transaction.rollback();
                return null;
            }

            // 2. ຈັດການ Customer ID
            let customerId = data.customer_id;
            if (customerId && typeof customerId === 'object') {
                customerId = customerId.id || customerId.customer_id;
            }
            
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

            // 🎯 เก็บข้อมูลเก่า และบันทึก Audit Log (ของ Customer)
            const oldCustomerData = customer.toJSON();
            await customer.update(custData, { transaction });
            await logAudit('customers', customer.id, 'UPDATE', oldCustomerData, custData, performedBy, transaction);

            const mapData: any = {
                product_id: data.product_id,
                total_amount: data.total_amount,
                interest_rate_at_apply: data.interest_rate_at_apply,
                monthly_pay: data.monthly_pay,
                loan_period: data.loan_period,
                down_payment: data.down_payment || null,
                fee: data.fee || null,
                first_installment_amount: data.first_installment_amount || null,
                payment_day: data.payment_day,
                borrower_signature_date: data.borrower_signature_date || null,
                guarantor_signature_date: data.guarantor_signature_date || null,
                staff_signature_date: data.staff_signature_date || null
            };

            // 🎯 เก็บข้อมูลเก่า และบันทึก Audit Log (ของ Loan Application)
            const oldLoanData = loanApplication.toJSON();
            const updatedLoan = await loanApplication.update(mapData, { transaction });
            await logAudit('loan_applications', loanApplication.id, 'UPDATE', oldLoanData, mapData, performedBy, transaction);

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
        const t = await db.sequelize.transaction();
        try {
            // ==========================================
            // STEP 1: ค้นหาข้อมูลเดิม & เตรียม Payload
            // ==========================================
            const loanApplication = await this.findLoanApplicationById(loanApplicationId);
            if (!loanApplication) {
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                return null;
            }

            // 🟢 เก็บข้อมูลเก่าไว้ทำ Audit Log
            const oldLoanData = loanApplication.toJSON();
            const updatePayload: any = { ...data };

            // แปลงรูปแบบ customer_id กรณีที่ Frontend ส่งมาเป็น Object
            if (data.customer_id && typeof data.customer_id === 'object') {
                updatePayload.customer_id = (data.customer_id as any).id || (data.customer_id as any).customer_id;
            }

            // ==========================================
            // STEP 2: โลจิกคำนวณค่างวดใหม่ (กรณีแก้ไขระยะเวลาตอนที่ยังไม่ Confirm)
            // ==========================================
            if (!loanApplication.is_confirmed && data.loan_period && data.loan_period !== loanApplication.loan_period) {
                const totalInterest = (loanApplication.total_amount * loanApplication.interest_rate_at_apply) / 100;
                updatePayload.monthly_installment = parseFloat(((loanApplication.total_amount + totalInterest) / data.loan_period).toFixed(2));
                updatePayload.status = 'pending';
            }

            // ==========================================
            // STEP 3: โลจิกการพิจารณาอนุมัติ (ทำเมื่อมี Credit Score แล้วเท่านั้น)
            // ==========================================
            const currentScore = loanApplication.credit_score;

            if (currentScore !== null && currentScore !== undefined && data.approver_id) {
                // 3.1 ตรวจสอบสิทธิ์พนักงาน
                const approverUser = await db.users.findOne({ where: { id: data.approver_id } });
                if (approverUser?.role !== 'staff' && approverUser?.staff_level !== 'approver') {
                    throw new Error('ທ່ານບໍ່ມີສິດໃນການອະນຸມັດ Loan Application ຈຳເປັນຕ້ອງມີສິດ admin ຫຼື approver ເທົ່ານັ້ນ');
                }
                updatePayload.approver_id = data.approver_id;

                // 3.2 จัดการ Remarks ตามเกณฑ์คะแนน
                if (currentScore >= 65 && currentScore <= 79) {
                    updatePayload.remarks = data.remarks;
                } else if (currentScore < 65) {
                    updatePayload.remarks = data.remarks || 'ເງື່ອນໄຂບໍ່ຜ່ານ (Condition not met)';
                } else {
                    updatePayload.remarks = data.remarks || 'ຜ່ານການພິຈາລະນາ (Approved)';
                }
            } else if (!currentScore && data.approver_id) {
                // เซฟตี้: ลบทิ้งป้องกันการแอบอนุมัติ
                delete updatePayload.approver_id;
            }

            // ==========================================
            // STEP 4: จัดการสถานะ (Status) & เวลา (Timestamps)
            // ==========================================
            const finalStatus = updatePayload.status || loanApplication.status;

            if (finalStatus === 'verifying' && !loanApplication.applied_at) {
                updatePayload.applied_at = new Date();
            }

            if (finalStatus === 'approved' && updatePayload.approver_id && !loanApplication.approved_at) {
                updatePayload.approved_at = new Date();
            }

            // ==========================================
            // STEP 5: บันทึกลง Database
            // ==========================================
            const updatedLoanApplication = await loanApplication.update(updatePayload, {
                where: { id: loanApplicationId },
                returning: true,
                transaction: t
            });

            // 🟢 หา ID ของคนที่ทำรายการนี้
            const performedBy = updatePayload.approver_id || data.requester_id || 1; 

            // 🎯 Best Practice ข้อ 1: บันทึก Data Mutation ลง Audit Log (CCTV) 
            // จะถูกบันทึกทุกครั้งที่มีฟิลด์เปลี่ยนไป ไม่ว่าสถานะจะเปลี่ยนหรือไม่ก็ตาม
            await logAudit('loan_applications', loanApplication.id, 'UPDATE', oldLoanData, updatePayload, performedBy, t);

            // 🎯 Best Practice ข้อ 2: บันทึก Workflow ลง Approval Log (Timeline)
            // จะถูกบันทึกเฉพาะตอนที่สถานะ (Status) ขยับเท่านั้น
            if (loanApplication.status !== finalStatus) {
                let actionType: action | null = null;

                if (finalStatus === 'approved') actionType = 'approved';
                else if (finalStatus === 'rejected') actionType = 'rejected';
                else if (finalStatus === 'cancelled') actionType = 'cancelled'; // 🟢 รองรับ cancelled ที่เพิ่มมาใหม่
                else if (finalStatus === 'pending') actionType = 'returned_for_edit'; 

                if (actionType) {
                    await this.logApprovalAction(
                        loanApplicationId,
                        actionType,
                        loanApplication.status,
                        finalStatus,
                        updatePayload.remarks || null,
                        performedBy,
                        t
                    );
                }
            }

            await t.commit();
            logger.info(`Loan application updated with ID: ${loanApplicationId}, Status: ${finalStatus}`);
            return updatedLoanApplication;

        } catch (error) {
            await t.rollback();
            logger.error(`Error updating loan application: ${(error as Error).message}`);
            throw error;
        }
    }

    private async logApprovalAction(applicationId: number, action: action, statusFrom: string | undefined, statusTo: string, remarks: string | undefined, userId: number, t: Transaction): Promise<void> {
        await db.loan_approval_logs.create({
            application_id: applicationId,
            action: action,
            status_from: statusFrom,
            status_to: statusTo,
            remarks: remarks,
            performed_by: userId
        }, { transaction: t });
    }

    async updateLoanApplicationStatus(loanApplicationId: number, status: any, userId: number): Promise<loan_applications | null> {
        const t = await db.sequelize.transaction();
        try {
            const loanApplication = await this.findLoanApplicationById(loanApplicationId);
            if (!loanApplication) {
                await t.rollback();
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                return null;
            }

            if (loanApplication.status === status) {
                logger.info(`Loan application status is already ${status}`);
                return loanApplication;
            }
            let confirmed = loanApplication.is_confirmed;
            let loan_status: string = loanApplication.status || 'pending';
            let isJustSubmitted = false;
            if (loanApplication.is_confirmed === 0) {
                confirmed = 1;
                isJustSubmitted = true;
            }
            if (loanApplication.status !== 'pending') {
                loan_status = status;
            } const updateData: any = {
            is_confirmed: confirmed,
            status: loan_status
        };

        if (loan_status === 'verifying' && !loanApplication.applied_at) updateData.applied_at = new Date();
        if (loan_status === 'approved' && !loanApplication.approved_at) updateData.approved_at = new Date();

        const updatedLoanApplication = await loanApplication.update(updateData, { transaction: t });

        // 🟢 บันทึก Log ว่าถูก "ส่งเข้าระบบ" (Submitted)
        if (isJustSubmitted) {
            await this.logApprovalAction(
                loanApplicationId, 
                'submitted', 
                loanApplication.status, 
                loan_status, 
                'ສົ່ງຄຳຂໍສິນເຊື່ອເຂົ້າລະບົບ', 
                userId, // ⬅️ รับค่ามาจาก Controller (req.user.id)
                t
            );
        }
            logger.info(`Loan application status updated with ID: ${loanApplicationId}`);
            return updatedLoanApplication;
        } catch (error) {
            await t.rollback();
            logger.error(`Error updating loan application status: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new LoanApplicationRepository();