import { loan_applications, loan_applicationsAttributes, loan_applicationsCreationAttributes } from "../models/loan_applications";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op, Transaction } from 'sequelize';
import { NotFoundError, ValidationError, handleErrorResponse } from '../utils/errors';
import { logAudit } from "../utils/auditLogger";

export type action = "submitted" | "verified_basic" | "verified_call" | "verified_cib" | "verified_field" | "assessed_income" | "verified_delivery_receipt" | "approved" | "rejected" | "returned_for_edit" | "cancelled";

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
            });
            
            let newSequence = 1;
            if (last_loan_id?.loan_id) {
                const parts = last_loan_id.loan_id.split('-');
                const lastNum = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(lastNum)) newSequence = lastNum + 1;
            }

            const formattedId = `LN-${cleanLoanApplication.customer_id}-${currentYear}-${String(newSequence).padStart(6, '0')}`;

            const mapData: any = {
                customer_id: cleanLoanApplication.customer_id,
                product_id: cleanLoanApplication.product_id,
                loan_id: formattedId,
                total_amount: cleanLoanApplication.total_amount,
                interest_rate_at_apply: cleanLoanApplication.interest_rate_at_apply,
                interest_type: cleanLoanApplication.interest_type || 'flat_rate',
                interest_rate_type: cleanLoanApplication.interest_rate_type || 'monthly',
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
            
            // 🟢 บันทึก Audit Log (CREATE)
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
                            as: 'customer_work_infos',
                            attributes: ['id', 'company_name', 'address', 'phone', 'business_type', 'business_detail', 'duration_years', 'duration_months', 'department', 'position', 'salary', 'created_at']
                        },
                        {
                            model: db.customer_locations,
                            as: 'customer_locations',
                            attributes: ['id', 'customer_id', 'address_detail', 'latitude', 'longitude', 'is_primary', 'location_type']
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
                            as: 'partner',
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
                    as: 'loan_guarantors',
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary','date_of_birth', 'age', 'work_location']
                }
            ],
        });
    }

    async findLoanApplicationById(loanApplicationId: number): Promise<loan_applications | null> {
        return await db.loan_applications.findOne({
            where: { id: loanApplicationId },
            include: [
                {
                    model: db.customers,
                    as: 'customer',
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number', 'address', 'age', 'occupation', 'income_per_month', 'unit', 'issue_place', 'issue_date'],
                    include: [
                        {
                            model: db.customer_work_info,
                            as: 'customer_work_infos',
                            attributes: ['id', 'company_name', 'address', 'phone', 'business_type', 'business_detail', 'duration_years', 'duration_months', 'department', 'position', 'salary', 'created_at']
                        },
                        {
                            model: db.customer_locations,
                            as: 'customer_locations',
                            attributes: ['id', 'customer_id', 'address_detail', 'latitude', 'longitude', 'is_primary', 'location_type']
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
                            as: 'partner',
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
                    as: 'loan_guarantors',
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary','date_of_birth', 'age', 'work_location', 'work_phone']
                },
                {
                    model: db.delivery_receipts,
                    as: 'delivery_receipt',
                    attributes: ['id', 'application_id', 'receipts_id', 'delivery_date', 'receiver_name', 'receipt_image_url', 'status', 'remark', 'approver_id', 'approved_at']
                }
            ],
        });
    }

    async findLoanApplications(filters: any): Promise<{ rows: loan_applications[]; count: number }> {
        const { customerId, requesterId, productId, status, min, max, is_confirmed, page, limit } = filters;
        const whereClause: any = {};

        if (customerId) whereClause.customer_id = customerId;
        if (requesterId) whereClause.requester_id = requesterId;
        if (productId) whereClause.product_id = productId;
        if (status) whereClause.status = status;
        if (is_confirmed !== undefined) whereClause.is_confirmed = is_confirmed;

        let inputStatus = filters.status || filters['status[]'];

        if (inputStatus) {
            if (Array.isArray(inputStatus)) {
                whereClause.status = { [Op.in]: inputStatus };
            } else if (typeof inputStatus === 'string' && inputStatus.includes(',')) {
                whereClause.status = { [Op.in]: inputStatus.split(',') };
            } else {
                whereClause.status = inputStatus;
            }
        }
        
        if (min !== undefined || max !== undefined) {
            whereClause.total_amount = {};
            if (min !== undefined) whereClause.total_amount[Op.gte] = min;
            if (max !== undefined) whereClause.total_amount[Op.lte] = max;
        }

        let pageNum = 1;
        let limitNum = 10;
        if (page) pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
        if (limit) limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        const offset = (pageNum - 1) * limitNum;

        return await db.loan_applications.findAndCountAll({
            where: whereClause,
            include: [
                { model: db.customers, as: 'customer', attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone'] },
                { model: db.products, as: 'product', attributes: ['id', 'partner_id', 'productType_id', 'product_name'] },
                { model: db.users, as: 'requester', attributes: ['id', 'username', 'full_name'] },
                { model: db.users, as: 'approver', attributes: ['id', 'username', 'full_name'] },
                { model: db.delivery_receipts, as: 'delivery_receipt', attributes: ['id', 'application_id', 'receipts_id', 'status'] }
            ],
            order: [['created_at', 'DESC']],
            limit: limitNum,
            offset: offset,
            distinct: true
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

            const performedBy = data.user_id || data.performed_by;
            if (!performedBy) {
                logger.error('User ID is required');
                await transaction.rollback();
                return null;
            }

            let customerId = data.customer_id;
            if (customerId && typeof customerId === 'object') {
                customerId = customerId.id || customerId.customer_id;
            }
            
            // 🟢 1. ย้ายการดึงข้อมูล Customer ขึ้นมาก่อน เพื่อให้มีข้อมูลเก่าไว้เทียบ
            const customer = await db.customers.findByPk(customerId, { transaction });
            if (!customer) throw new NotFoundError('ບໍ່ພົບລູກຄ້າ');

            // 🟢 2. ใช้สูตร !== undefined ถังค่าไม่ได้ส่งมา ให้ดึงของเก่าจาก DB มาใส่กลับคืน
            const custData = {
                identity_number: data.identity_number !== undefined ? data.identity_number : customer.identity_number,
                census_number: data.census_number !== undefined ? data.census_number : customer.census_number,
                first_name: data.first_name !== undefined ? data.first_name : customer.first_name,
                last_name: data.last_name !== undefined ? data.last_name : customer.last_name,
                phone: data.phone !== undefined ? data.phone : customer.phone,
                address: data.address !== undefined ? data.address : customer.address,
                date_of_birth: data.date_of_birth !== undefined ? data.date_of_birth : customer.date_of_birth,
                age: data.age !== undefined ? data.age : customer.age,
                occupation: data.occupation !== undefined ? data.occupation : customer.occupation,
                income_per_month: data.income_per_month !== undefined ? data.income_per_month : customer.income_per_month,
                
                // 🔥 ป้องกันฟิลด์สำคัญเหล่านี้หายเมื่อไม่ได้ส่งมา
                unit: data.unit !== undefined ? data.unit : customer.unit,
                issue_place: data.issue_place !== undefined ? data.issue_place : customer.issue_place,
                issue_date: data.issue_date !== undefined ? data.issue_date : customer.issue_date,
            };

            const oldCustomerData = customer.toJSON();
            await customer.update(custData, { transaction });
            await logAudit('customers', customer.id, 'UPDATE', oldCustomerData, custData, performedBy, transaction);

            // 🟢 3. ทำแบบเดียวกันกับ Loan Application เพื่อความปลอดภัยสูงสุด
            const mapData: any = {
                product_id: data.product_id !== undefined ? data.product_id : loanApplication.product_id,
                total_amount: data.total_amount !== undefined ? data.total_amount : loanApplication.total_amount,
                interest_rate_at_apply: data.interest_rate_at_apply !== undefined ? data.interest_rate_at_apply : loanApplication.interest_rate_at_apply,
                monthly_pay: data.monthly_pay !== undefined ? data.monthly_pay : loanApplication.monthly_pay,
                loan_period: data.loan_period !== undefined ? data.loan_period : loanApplication.loan_period,
                down_payment: data.down_payment !== undefined ? data.down_payment : loanApplication.down_payment,
                fee: data.fee !== undefined ? data.fee : loanApplication.fee,
                first_installment_amount: data.first_installment_amount !== undefined ? data.first_installment_amount : loanApplication.first_installment_amount,
                payment_day: data.payment_day !== undefined ? data.payment_day : loanApplication.payment_day,
                borrower_signature_date: data.borrower_signature_date !== undefined ? data.borrower_signature_date : loanApplication.borrower_signature_date,
                guarantor_signature_date: data.guarantor_signature_date !== undefined ? data.guarantor_signature_date : loanApplication.guarantor_signature_date,
                staff_signature_date: data.staff_signature_date !== undefined ? data.staff_signature_date : loanApplication.staff_signature_date,
                interest_type: data.interest_type !== undefined ? data.interest_type : loanApplication.interest_type,
                interest_rate_type: data.interest_rate_type !== undefined ? data.interest_rate_type : loanApplication.interest_rate_type,
                updated_at: new Date()
            };

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
            // STEP 1: ຄົ້ນຫາຂໍ້ມູນເດີມ & ກຽມ Payload
            // ==========================================
            const loanApplication = await this.findLoanApplicationById(loanApplicationId);
            if (!loanApplication) {
                logger.error(`Loan application with ID: ${loanApplicationId} not found`);
                return null;
            }

            const oldLoanData = loanApplication.toJSON();
            const updatePayload: any = { ...data };

            if (data.customer_id && typeof data.customer_id === 'object') {
                updatePayload.customer_id = (data.customer_id as any).id || (data.customer_id as any).customer_id;
            }

            // ==========================================
            // STEP 2: ຈັດການ Credit Score & ເງື່ອນໄຂອະນຸມັດ
            // ==========================================
            const currentScore = data.credit_score !== undefined ? data.credit_score : loanApplication.credit_score;

            if (data.approver_id) {
                const approverUser = await db.users.findByPk(data.approver_id, { transaction: t });
                
                // ກວດສອບສິດ
                if (approverUser?.role !== 'admin' && !['approver', 'credit_manager', 'deputy_director', 'director'].includes(approverUser?.staff_level ?? '')) {
                    throw new Error('ທ່ານບໍ່ມີສິດໃນການອະນຸມັດ Loan Application');
                }
                updatePayload.approver_id = data.approver_id;

                // ຈັດການ Remarks ຕາມເກນຄະແນນ (ຖ້າມີຄະແນນ)
                if (currentScore !== null && currentScore !== undefined) {
                    if (currentScore >= 65 && currentScore <= 79) {
                        updatePayload.remarks = data.remarks;
                    } else if (currentScore < 65) {
                        updatePayload.remarks = data.remarks || 'ເງື່ອນໄຂບໍ່ຜ່ານ (Condition not met)';
                    } else {
                        updatePayload.remarks = data.remarks || 'ຜ່ານການພິຈາລະນາ (Approved)';
                    }
                }
            } else if (currentScore === null && data.approver_id) {
                delete updatePayload.approver_id;
            }

            // ==========================================
            // STEP 3: ຈັດການສະຖານະ (Status) & ເວລາ (Timestamps)
            // ==========================================
            const finalStatus = updatePayload.status || loanApplication.status;

            if (finalStatus === 'verifying' && !loanApplication.applied_at) {
                updatePayload.applied_at = new Date();
            }

            if (finalStatus === 'approved' && updatePayload.approver_id && !loanApplication.approved_at) {
                updatePayload.approved_at = new Date();
            }

            // 🟢 ກຳນົດ ID ຜູ້ເຮັດລາຍການ ເພື່ອໃຊ້ບັນທຶກ Audit Log ຂອງທຸກໆຕາຕະລາງ
            const performedBy = updatePayload.approver_id || data.requester_id || 1; 

            // ==========================================
            // STEP 4: ບັນທຶກການອັບເດດລົງ loan_applications
            // ==========================================
            const updatedLoanApplication = await loanApplication.update(updatePayload, {
                where: { id: loanApplicationId },
                returning: true,
                transaction: t
            });

            // 🎯 ບັນທຶກ Audit Log ສໍາລັບຕາຕະລາງ loan_applications
            await logAudit('loan_applications', loanApplication.id, 'UPDATE', oldLoanData, updatePayload, performedBy, t);


            // ==========================================
            // 🟢 STEP 5: ລວບຍອດ ອະນຸມັດຕາຕະລາງຜ່ອນ + ປະທັບຕາລົງສັນຍາ + ຄອນເຟີມສັນຍາ (ພ້ອມ Audit)
            // ==========================================
            if (finalStatus === 'approved' && updatePayload.approver_id) {
                
                // 5.1 ອັບເດດຕາຕະລາງຜ່ອນຊຳລະ (Repayment Schedule) ທີ່ເປັນ draft ໃຫ້ເປັນ approved
                const draftSchedules = await db.repayment_schedules.findAll({
                    where: { application_id: loanApplicationId, status: 'draft' },
                    transaction: t
                });

                for (const schedule of draftSchedules) {
                    const oldSchedData = schedule.toJSON();
                    await schedule.update({ 
                        status: 'approved', 
                        approved_by: updatePayload.approver_id, 
                        approved_at: new Date() 
                    }, { transaction: t });
                    
                    // 🎯 ບັນທຶກ Audit Log ສໍາລັບຕາຕະລາງ repayment_schedules
                    await logAudit('repayment_schedules', schedule.id, 'UPDATE', oldSchedData, schedule.toJSON(), performedBy, t);
                }

                // 5.2 ດຶງຂໍ້ມູນສັນຍາ (Loan Contract) ເພື່ອນຳ ID ມາຜູກກັບລາຍເຊັນ ແລະ ຄອນເຟີມສັນຍາ
                const contract = await db.loan_contract.findOne({
                    where: { loan_id: loanApplicationId },
                    transaction: t
                });

                if (contract) {
                    const oldContractData = contract.toJSON();

                    // 🟢 ອັບເດດໃຫ້ສັນຍາຖືກຢືນຢັນ (is_confirmed = 1) ທັນທີ
                    await contract.update({ 
                        is_confirmed: 1, 
                        updated_by: updatePayload.approver_id 
                    }, { transaction: t });

                    // 🎯 ບັນທຶກ Audit Log ສໍາລັບຕາຕະລາງ loan_contract
                    await logAudit('loan_contract', contract.id, 'UPDATE', oldContractData, contract.toJSON(), performedBy, t);


                    // 5.3 ຈັດການລາຍເຊັນ (document_signatures)
                    const approverUser = await db.users.findByPk(updatePayload.approver_id, { transaction: t });
                    let roleType = 'credit_head'; // Default fallback

                    // Map staff_level ໃຫ້ຕົງກັບ ENUM 'role_type'
                    if (approverUser?.staff_level === 'deputy_director') {
                        const existingApp1 = await db.document_signatures.findOne({
                            where: { document_type: 'contract', reference_id: contract.id, role_type: 'approver_1' },
                            transaction: t
                        });
                        roleType = existingApp1 ? 'approver_2' : 'approver_1';
                    } else if (approverUser?.staff_level === 'director') {
                        roleType = 'approver_3';
                    } else if (approverUser?.staff_level === 'credit_manager') {
                        roleType = 'credit_head';
                    }

                    // ປ້ອງກັນການເຊັນຊ້ຳໃນຕຳແໜ່ງເດີມ
                    const existingSignature = await db.document_signatures.findOne({
                        where: {
                            document_type: 'contract',
                            reference_id: contract.id,
                            role_type: roleType
                        },
                        transaction: t
                    });

                    // 5.4 Insert ລາຍເຊັນລົງຖານຂໍ້ມູນ ຖ້າຍັງບໍ່ມີ
                    if (!existingSignature) {
                        const newSignature = await db.document_signatures.create({
                            application_id: loanApplicationId,
                            document_type: 'contract',
                            reference_id: contract.id,
                            role_type: roleType as any, 
                            user_id: updatePayload.approver_id,
                            status: 'signed',
                            signed_at: new Date()
                        }, { transaction: t });

                        // 🎯 ບັນທຶກ Audit Log ສໍາລັບຕາຕະລາງ document_signatures (CREATE)
                        await logAudit('document_signatures', newSignature.id, 'CREATE', null, newSignature.toJSON(), performedBy, t);
                    }
                }
            }

            // ==========================================
            // STEP 6: ບັນທຶກ Workflow ລົງ Approval Log (Timeline)
            // ==========================================
            if (loanApplication.status !== finalStatus) {
                let actionType: action | null = null;

                if (finalStatus === 'approved') actionType = 'approved';
                else if (finalStatus === 'rejected') actionType = 'rejected';
                else if (finalStatus === 'cancelled') actionType = 'cancelled'; 
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
            } 
            
            const updateData: any = {
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
                    userId, 
                    t
                );
            }
            
            await t.commit();
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