import { loan_applications, loan_applicationsAttributes, loan_applicationsCreationAttributes } from "../models/loan_applications";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op, Transaction } from 'sequelize';
import { NotFoundError, ValidationError, handleErrorResponse, BadRequestError, ForbiddenError } from '../utils/errors';
import { logAudit } from "../utils/auditLogger";
import RepaymentRepository from './repayment.repo';

export type action = "submitted" | "verified_basic" | "verified_call" | "verified_cib" | "verified_field" | "assessed_income" | "verified_delivery_receipt" | "approved" | "rejected" | "returned_for_edit" | "cancelled";

class LoanApplicationRepository {

    async createLoanApplication(data: Partial<loan_applicationsCreationAttributes>, options: { transaction?: any } = {}): Promise<loan_applications> {
        try {
            const { transaction } = options;
            const cleanLoanApplication = { ...data };

            if (!cleanLoanApplication.customer_id || cleanLoanApplication.customer_id === 0) {
                throw new ValidationError('Customer ID is required');
            }
            if (!cleanLoanApplication.product_id || cleanLoanApplication.product_id === 0) {
                throw new ValidationError('Product ID is required');
            }
            if (!cleanLoanApplication.total_amount || cleanLoanApplication.total_amount === 0) {
                throw new ValidationError('Total amount is required');
            }
            if (!cleanLoanApplication.interest_rate_at_apply || cleanLoanApplication.interest_rate_at_apply === 0) {
                throw new ValidationError('Interest rate at apply is required');
            }
            if (!cleanLoanApplication.loan_period || cleanLoanApplication.loan_period === 0) {
                throw new ValidationError('Loan period is required');
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
                transaction,
                lock: transaction.LOCK.UPDATE // 🟢 เพิ่ม Lock เพื่อป้องกันการสร้าง loan_id ซ้ำในกรณีที่มีการสร้างพร้อมกันหลายคำขอ
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
                down_payment: cleanLoanApplication.down_payment || 0,
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
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number', 'address', 'age', 'occupation', 'income_per_month', 'other_debt', 'unit', 'issue_place', 'issue_date'],
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
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price'],
                    include: [
                        {
                            model: db.partners,
                            as: 'partner',
                            attributes: ['id', 'shop_id', 'shop_name', 'shop_owner', 'contact_number', 'shop_logo_url', 'address', 'business_type', 'is_active'],
                        },
                        {
                            model: db.product_types,
                            as: 'productType',
                            attributes: ['id', 'type_name']
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
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary', 'date_of_birth', 'age', 'work_location']
                }
            ],
        });
    }

    async findLoanApplicationByCusIDandLoanId(customerId: number, loanId: number): Promise<loan_applications | null> {
        return await db.loan_applications.findOne({
            where: { customer_id: customerId, id: loanId },
            include: [
                {
                    model: db.customers,
                    as: 'customer',
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number', 'address', 'age', 'occupation', 'income_per_month', 'other_debt', 'unit', 'issue_place', 'issue_date'],
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
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price'],
                    include: [
                        {
                            model: db.partners,
                            as: 'partner',
                            attributes: ['id', 'shop_id', 'shop_name', 'shop_owner', 'contact_number', 'shop_logo_url', 'address', 'business_type', 'is_active'],
                        },
                        {
                            model: db.product_types,
                            as: 'productType',
                            attributes: ['id', 'type_name']
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
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary', 'date_of_birth', 'age', 'work_location']
                },
                {
                    model: db.loan_contract,
                    as: 'loan_contracts',
                    attributes: ['id']
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
                    attributes: ['id', 'identity_number', 'first_name', 'last_name', 'phone', 'date_of_birth', 'census_number', 'address', 'province_id', 'district_id', 'age', 'occupation', 'income_per_month', 'other_debt', 'unit', 'issue_place', 'issue_date'],
                    include: [
                        {
                            model: db.customer_work_info,
                            as: 'customer_work_infos',
                            attributes: ['id', 'company_name', 'address', 'province_id', 'district_id', 'phone', 'business_type', 'business_detail', 'duration_years', 'duration_months', 'department', 'position', 'salary', 'created_at']
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
                    attributes: ['id', 'partner_id', 'productType_id', 'product_name', 'brand', 'model', 'price'],
                    include: [
                        {
                            model: db.partners,
                            as: 'partner',
                            attributes: ['id', 'shop_id', 'shop_name', 'shop_owner', 'contact_number', 'shop_logo_url', 'address', 'business_type', 'is_active'],
                        },
                        {
                            model: db.product_types,
                            as: 'productType',
                            attributes: ['id', 'type_name']
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
                    attributes: ['id', 'name', 'identity_number', 'phone', 'address', 'province_id', 'district_id', 'occupation', 'relationship', 'work_company_name', 'work_position', 'work_salary', 'date_of_birth', 'age', 'work_location', 'work_province_id', 'work_district_id', 'work_district_id', 'work_phone']
                },
                {
                    model: db.delivery_receipts,
                    as: 'delivery_receipt',
                    attributes: ['id', 'application_id', 'receipts_id', 'delivery_date', 'receiver_name', 'receipt_image_url', 'status', 'remark', 'approver_id', 'approved_at']
                },
                {
                    model: db.loan_contract,
                    as: 'loan_contracts',
                    attributes: ['id', 'loan_contract_number']
                }
            ],
        });
    }

    async findLoanApplicationsByCustomerId(filters: any) {
        const { customerId, status, is_confirmed, min, max, page, limit } = filters;
        const whereClause: any = {};

        if (customerId) whereClause.customer_id = customerId;

        console.log('Filters received in Repository:', filters);

        // 🟢 ຈຸດທີ່ແກ້ໄຂ: ຖ້າສົ່ງ status ມາເປັນ array ຫຼຶ string ທີ່ມີຈຸດ ໃຫ້ເຮັດ Op.in ເລີຍ
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

        if (is_confirmed !== undefined) whereClause.is_confirmed = is_confirmed;

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

        // 🟢 1. ດຶງຈຳນວນແຍກຕາມສະຖານະ (ໂດຍອ້າງອີງເງື່ອນໄຂດຽວກັນກັບ Data, ແຕ່ອາດຈະບໍ່ເອົາສະຖານະມາເປັນເງື່ອນໄຂ ເພື່ອໃຫ້ນັບລວມທັງໝົດໄດ້)
        // ສ້າງ where condition ໃໝ່ສຳລັບນັບສະເພາະລູກຄ້າຄົນນີ້ (ແຕ່ບໍ່ filter ຕາມ status)
        const countWhereClause: any = { ...whereClause };
        delete countWhereClause.status; // ລຶບ status ອອກເພື່ອນັບທຸກໆສະຖານະຂອງລູກຄ້າ
        delete countWhereClause.is_confirmed; // ລຶບ is_confirmed ອອກເພື່ອນับทຸກສະຖານະຂອງລູກຄ້າ

        const DataCount = await db.loan_applications.findAll({
            where: countWhereClause,
            // where: customerId ? { customer_id: customerId } : {}, // ຖ້າມີ customerId ໃຫ້ filter ตาม customer_id, ถ้าไม่มีให้ดึงทั้งหมด
            attributes: [
                [
                    db.sequelize.literal(`
                        CASE 
                        WHEN status = 'pending' AND is_confirmed = 0 THEN 'draft'
                        WHEN status = 'pending' AND is_confirmed = 1 THEN 'pending'
                        WHEN status = 'verifying' THEN 'verifying'
                        ELSE status 
                        END
                    `),
                    'display_status'
                ],
                [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'total']
            ],
            // ປ່ຽນຈາກ group: [db.sequelize.literal('display_status')]
            group: ['display_status'],
            raw: true,
        });

        // 🟢 ແປງຜົນລັບຈາກ Array ເປັນ Object ເພື່ອໃຫ້ອ່ານງ່າຍ ເຊັ່ນ { draft: 1, pending: 5, approved: 10 }
        const countsByStatus: Record<string, number> = {
            draft: 0,
            pending: 0,
            verifying: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
            completed: 0,
            closed_early: 0
        };

        (DataCount as any[]).forEach((item) => {
            const statusName = item.display_status;
            const count = parseInt(item.total, 10) || 0;
            if (statusName) {
                countsByStatus[statusName] = count;
            }
        });

        // 🟢 2. ດຶງຂໍ້ມູນລາຍລະອຽດ (Pagination)
        const result = await db.loan_applications.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'loan_id', 'total_amount', 'is_confirmed', 'status', 'created_at', 'updated_at'],
            include: [
                { model: db.customers, as: 'customer', attributes: ['id', 'first_name', 'last_name'] },
                { model: db.products, as: 'product', attributes: ['id', 'product_name', 'image_url'] },

            ],
            order: [['created_at', 'DESC']],
            limit: limitNum,
            offset: offset,
            distinct: true // ສຳຄັນຫຼາຍ ເວລາມີ include ທີ່ມີຄວາມສຳພັນແບບ 1:M ເພື່ອໃຫ້ນັບແຖວຫຼັກຖືກຕ້ອງ
        });

        // 🟢 3. ສົ່ງຂໍ້ມູນກັບຄືນໄປໃນຮູບແບບທີ່ທ່ານຕ້ອງການ
        return {
            data: result.rows,              // ຂໍ້ມູນລາຍລະອຽດຂອງໃບຄຳຂໍ
            total: result.count,            // ຈຳນວນທັງໝົດທີ່ກົງກັບ Filter (ສຳລັບ Pagination)
            counts: countsByStatus,         // ຂໍ້ມູນຈຳນວນແຍກຕາມສະຖານະ ເຊັ່ນ counts.draft, counts.pending
            currentPage: pageNum,
            totalPages: Math.ceil(result.count / limitNum)
        };
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
                { model: db.delivery_receipts, as: 'delivery_receipt', attributes: ['id', 'application_id', 'receipts_id', 'status'] },
                { model: db.loan_contract, as: 'loan_contracts', attributes: ['id'] }
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
            const loanApplication = await loan_applications.findByPk(loanApplicationId, { transaction, lock: transaction.LOCK.UPDATE });
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
            console.log('Data received for updateDraftLoanApplication:', data);
            console.log('Existing loan application data:', loanApplication.toJSON());
            let customerId = data.customer_id || loanApplication.customer_id;
            if (customerId && typeof customerId === 'object') {
                customerId = customerId.id || customerId.customer_id;
            }

            // 🟢 1. ย้ายการดึงข้อมูล Customer ขึ้นมาก่อน เพื่อให้มีข้อมูลเก่าไว้เทียบ
            const customer = await db.customers.findByPk(customerId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!customer) throw new NotFoundError('ບໍ່ພົບລູກຄ້າ');

            // 🟢 2. ใช้สูตร !== undefined ถังค่าไม่ได้ส่งมา ให้ดึงของเก่าจาก DB มาใส่กลับคืน
            const custData = {
                identity_number: data.identity_number !== undefined ? data.identity_number : customer.identity_number,
                census_number: data.census_number !== undefined ? data.census_number : customer.census_number,
                first_name: data.first_name !== undefined ? data.first_name : customer.first_name,
                last_name: data.last_name !== undefined ? data.last_name : customer.last_name,
                phone: data.phone !== undefined ? data.phone : customer.phone,
                address: data.address !== undefined ? data.address : customer.address,
                province_id: data.province_id !== undefined ? data.province_id : customer.province_id,
                district_id: data.district_id !== undefined ? data.district_id : customer.district_id,
                date_of_birth: data.date_of_birth !== undefined ? data.date_of_birth : customer.date_of_birth,
                age: data.age !== undefined ? data.age : customer.age,
                occupation: data.occupation !== undefined ? data.occupation : customer.occupation,
                income_per_month: data.income_per_month !== undefined ? data.income_per_month : customer.income_per_month,
                other_debt: data.other_debt !== undefined ? data.other_debt : customer.other_debt,
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

    async updateLoanApplication(loanApplicationId: number, data: Partial<any>): Promise<any | null> {
    const t = await db.sequelize.transaction();
    try {
        // ==========================================
        // STEP 1: ຄົ້ນຫາຂໍ້ມູນເດີມ & ກຽມ Payload
        // ==========================================
        const loanApplication = await db.loan_applications.findByPk(loanApplicationId, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        
        if (!loanApplication) {
            await t.rollback();
            throw new NotFoundError(`Loan application with ID: ${loanApplicationId} not found`);
        }

        const oldLoanData = loanApplication.toJSON();
        const updatePayload: any = { ...data };

        if (data.customer_id && typeof data.customer_id === 'object') {
            updatePayload.customer_id = (data.customer_id as any).id || (data.customer_id as any).customer_id;
        }

        let actionIntent = data.status; // 'verified', 'disbursed', 'rejected'
        let roleType = ''; // ຕົວແປສຳລັບເກັບບົດບາດໃນການເຊັນ

        // ==========================================
        // 🌟 STEP 2: ກວດສອບສິດ ແລະ ບັງຄັບລຳດັບການອະນຸມັດ (Sequential Guard)
        // ==========================================
        if (data.approver_id && ['disbursed', 'approved', 'verified', 'rejected'].includes(actionIntent)) {
            const approverUser = await db.users.findByPk(data.approver_id, { transaction: t });
            const staffLevel = approverUser?.staff_level ?? '';

            if (approverUser?.role !== 'admin' && !['approver', 'credit_manager', 'deputy_director', 'director'].includes(staffLevel)) {
                throw new ForbiddenError('ທ່ານບໍ່ມີສິດໃນການອະນຸມັດ ຫຼື ກວດກາສິນເຊື່ອ');
            }

            // 🟢 2.1 ກວດສອບວ່າ ຢູສເຊີນີ້ເຄີຍເຊັນເອກະສານນີ້ໄປແລ້ວຫຼືຍັງ?
            const mySignature = await db.document_signatures.findOne({
                where: {
                    application_id: loanApplicationId,
                    user_id: data.approver_id,
                    document_type: 'approval_summary',
                    status: ['signed', 'rejected']
                },
                transaction: t
            });

            if (mySignature) {
                throw new BadRequestError('ທ່ານໄດ້ກວດກາ ແລະ ຢືນຢັນເອກະສານນີ້ໄປແລ້ວ! ບໍ່ສາມາດເຮັດລາຍການຊ້ຳໄດ້.');
            }

            // 🟢 2.2 ຈັດການ Role ແລະ ລຳດັບການອະນຸມັດ
            if (actionIntent === 'rejected') {
                roleType = staffLevel === 'credit_manager' ? 'credit_head' : 'approver_1';
            } else {
                if (staffLevel === 'credit_manager') {
                    // ຫົວໜ້າສິນເຊື່ອ ກົດໄດ້ແຄ່ Verify
                    roleType = 'credit_head';
                    actionIntent = 'verified';
                }
                else if (['deputy_director', 'director', 'approver'].includes(staffLevel)) {
                    // ກຸ່ມຜູ້ບໍລິຫານ (ຕ້ອງໃຫ້ Credit Manager ຜ່ານກ່ອນ)
                    const cmSignature = await db.document_signatures.findOne({
                        where: { application_id: loanApplicationId, document_type: 'approval_summary', role_type: 'credit_head', status: 'signed' },
                        transaction: t
                    });

                    if (!cmSignature) {
                        throw new BadRequestError('ບໍ່ສາມາດອະນຸມັດໄດ້! ຕ້ອງຜ່ານການກວດກາຈາກ "ຫົວໜ້າສິນເຊື່ອ (Credit Manager)" ກ່ອນ.');
                    }

                    // ນັບຈຳນວນຜູ້ບໍລິຫານທີ່ເຄີຍເຊັນແລ້ວ
                    const existingHighLevelSigs = await db.document_signatures.count({
                        where: {
                            application_id: loanApplicationId,
                            document_type: 'approval_summary',
                            role_type: ['approver_1', 'approver_2'],
                            status: 'signed'
                        },
                        transaction: t
                    });

                    if (existingHighLevelSigs === 0) {
                        roleType = 'approver_1';
                        actionIntent = 'verified';
                    } else if (existingHighLevelSigs === 1) {
                        // ຜູ້ບໍລິຫານຄົນທີ 2 ເຊັນ -> ປ່ອຍສິນເຊື່ອທັນທີ (Disbursed)
                        roleType = 'approver_2';
                        actionIntent = 'disbursed'; 
                    } else {
                        throw new BadRequestError('ເອກະສານນີ້ໄດ້ຮັບການອະນຸມັດ ແລະ ປ່ອຍສິນເຊື່ອສຳເລັດສົມບູນແລ້ວ!');
                    }
                }
            }

            updatePayload.approver_id = data.approver_id;
            updatePayload.status = actionIntent;
        }

        const finalStatus = updatePayload.status || loanApplication.status;

        // ==========================================
        // STEP 3: ຈັດການເວລາ (Timestamps)
        // ==========================================
        if (finalStatus === 'verifying' && !loanApplication.applied_at) {
            updatePayload.applied_at = new Date();
        }
        if (finalStatus === 'disbursed' && updatePayload.approver_id && !loanApplication.approved_at) {
            updatePayload.approved_at = new Date(); // ใช้วันนี้เป็นวันอนุมัติ/ปล่อยกู้
        }

        const performedBy = updatePayload.approver_id || data.requester_id || 1;

        const updatedLoanApplication = await loanApplication.update(updatePayload, {
            where: { id: loanApplicationId },
            returning: true,
            transaction: t
        });

        // 🎯 ບັນທຶກ Audit Log
        await logAudit('loan_applications', loanApplication.id, 'UPDATE', oldLoanData, updatePayload, performedBy, t);


        // ==========================================
        // 🌟 STEP 4: ປະທັບຕາລາຍເຊັນ ແລະ ຈັດການຕາຕະລາງຜ່ອນຊຳລະ
        // ==========================================
        if (['disbursed', 'approved', 'verified', 'rejected'].includes(finalStatus) && updatePayload.approver_id && roleType) {

            const signatureStatus = finalStatus === 'rejected' ? 'rejected' : 'signed';

            // 4.1 ອັບເດດລາຍເຊັນໃນໃບ Approval Summary
            const existingSummarySig = await db.document_signatures.findOne({
                where: { application_id: loanApplicationId, document_type: 'approval_summary', role_type: roleType },
                transaction: t
            });

            if (existingSummarySig) {
                await existingSummarySig.update({ user_id: updatePayload.approver_id, status: signatureStatus, signed_at: new Date() }, { transaction: t });
            } else {
                await db.document_signatures.create({
                    application_id: loanApplicationId, document_type: 'approval_summary', reference_id: loanApplicationId,
                    role_type: roleType as any, user_id: updatePayload.approver_id, status: signatureStatus, signed_at: new Date()
                }, { transaction: t });
            }

            // 4.2 ອັບເດດລາຍເຊັນໃນ Contract
            const contract = await db.loan_contract.findOne({
                where: { loan_id: loanApplicationId },
                transaction: t
            });

            if (contract) {
                const existingContractSig = await db.document_signatures.findOne({
                    where: { application_id: loanApplicationId, document_type: 'contract', role_type: roleType },
                    transaction: t
                });

                if (existingContractSig) {
                    await existingContractSig.update({ user_id: updatePayload.approver_id, status: signatureStatus, signed_at: new Date() }, { transaction: t });
                } else {
                    await db.document_signatures.create({
                        application_id: loanApplicationId, document_type: 'contract', reference_id: contract.id,
                        role_type: roleType as any, user_id: updatePayload.approver_id, status: signatureStatus, signed_at: new Date()
                    }, { transaction: t });
                }

                // ==========================================
                // 🎯 4.3 ຈັດການຕາຕະລາງຜ່ອນຊຳລະ (Repayment Schedule) - ແຍກເປັນ 2 ຈັງຫວະ
                // ==========================================

                // ຈັງຫວະທີ 1: ຫົວໜ້າສິນເຊື່ອ (Credit Manager) ກວດຜ່ານ (Verify)
                // ໃຫ້ອັບເດດວັນທີຈ່າຍໃນຕາຕະລາງ (ແຕ່ຍັງເປັນ Draft ເພື່ອໃຫ້ພະນັກງານພິມອອກມາໄດ້)
                if (finalStatus === 'verified' && roleType === 'credit_head') {
                    const verifyDate = new Date();

                    // 🌟 🟢 ແກ້ໄຂ: ຕ້ອງດຶງ payment_day ຈາກ 'updatePayload' ເພາະເປັນຄ່າໃໝ່ທີ່ສົ່ງມາຈາກໜ້າບ້ານ
    const finalPaymentDay = Number(updatePayload.payment_day) || Number(loanApplication.payment_day) || 1;
                    await RepaymentRepository.shiftDraftScheduleDates(
                        loanApplicationId,
                        finalPaymentDay,
                        verifyDate,
                        t
                    );
                }

                // ຈັງຫວະທີ 2: ຜູ້ບໍລິຫານຄົນທີ 2 ເຊັນອະນຸມັດ (Disbursed)
                // ຄອນເຟີມສັນຍາ ແລະ ລັອກສະຖານະຕາຕະລາງເປັນ Approved (ຫ້າມແກ້ໄຂວັນທີແລ້ວ)
                if (finalStatus === 'disbursed') {
                    const oldContractData = contract.toJSON();
                    await contract.update({ is_confirmed: 1, updated_by: updatePayload.approver_id }, { transaction: t });
                    await logAudit('loan_contract', contract.id, 'UPDATE', oldContractData, contract.toJSON(), performedBy, t);

                    await RepaymentRepository.finalizeScheduleApproval(
                        loanApplicationId,
                        updatePayload.approver_id,
                        new Date(),
                        t
                    );
                }
            }
        }

        // ==========================================
        // STEP 5: ບັນທຶກ Approval Log (Timeline)
        // ==========================================
        if (loanApplication.status !== finalStatus || data.approver_id) {
            let actionLogType = '';
            if (finalStatus === 'disbursed' || finalStatus === 'approved') actionLogType = 'approved'; 
            else if (actionIntent === 'verified') actionLogType = 'verified'; 
            else if (finalStatus === 'rejected') actionLogType = 'rejected';

            if (actionLogType) {
                await this.logApprovalAction(
                    loanApplicationId,
                    actionLogType as any,
                    loanApplication.status,
                    finalStatus,
                    updatePayload.remarks || null,
                    performedBy,
                    t
                );
            }
        }

        await t.commit();
        return updatedLoanApplication;

    } catch (error) {
        await t.rollback();
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