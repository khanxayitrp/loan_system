"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepaymentSchedule = exports.createRepaymentSchedule = exports.createWithCustomer = exports.sentApplyDraft = exports.getAllLoan = exports.getLoanById = exports.getLoanByLoanID = exports.changeStatus = exports.updateDraftLoanApplication = exports.updateLoanApplication = exports.createLoanApplication = void 0;
const loan_application_repo_1 = __importDefault(require("../repositories/loan_application.repo"));
const repayment_repo_1 = __importDefault(require("../repositories/repayment.repo"));
const customer_repo_1 = __importDefault(require("../repositories/customer.repo"));
const errors_1 = require("../utils/errors");
const init_models_1 = require("../models/init-models");
const otp_service_1 = require("../services/otp.service");
const auditLogger_1 = require("../utils/auditLogger");
// ==========================================
// 🟢 HELPER FUNCTION: ສຳລັບບັນທຶກ Audit Log ໃນ Controller
// ==========================================
// const logAuditHelper = async (
//     tableName: string,
//     recordId: number,
//     action: 'CREATE' | 'UPDATE' | 'DELETE',
//     oldValues: any,
//     newValues: any,
//     performedBy: number,
//     t: Transaction
// ) => {
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
// };
const createLoanApplication = async (req, res) => {
    try {
        const data = req.body;
        // Optional: เช็คสิทธิ์ staff จาก req.user.permissions
        const application = await loan_application_repo_1.default.createLoanApplication({
            ...data,
            requester_id: req.userPayload?.userId || null, // จาก middleware auth
        });
        res.status(201).json({
            success: true,
            message: 'Loan application created',
            data: application
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
exports.createLoanApplication = createLoanApplication;
const updateLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userPayload?.userId;
        const data = req.body;
        console.log('Update loan application data :', data);
        let loanData = {
            ...data,
            approver_id: userId, // บันทึกผู้อนุมัติ
        };
        const updated = await loan_application_repo_1.default.updateLoanApplication(Number(id), loanData);
        if (!updated)
            return res.status(404).json({ message: 'Application not found' });
        res.status(200).json({
            success: true,
            message: 'Loan application updated',
            data: updated
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
exports.updateLoanApplication = updateLoanApplication;
const updateDraftLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userPayload?.userId;
        console.log('Draft loan data :', req.body);
        let loanData = {
            ...req.body,
            performed_by: userId, // บันทึกผู้แก้ไข
        };
        const updated = await loan_application_repo_1.default.updateDraftLoanApplication(Number(id), loanData);
        if (!updated)
            return res.status(404).json({ message: 'Application not found' });
        res.status(200).json({
            success: true,
            message: 'Draft Loan application updated',
            data: updated
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
exports.updateDraftLoanApplication = updateDraftLoanApplication;
const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userPayload?.userId;
        console.log('function changeStatus ', req.body);
        const updated = await loan_application_repo_1.default.updateLoanApplicationStatus(Number(id), status, Number(userId));
        if (!updated)
            return res.status(404).json({ message: 'Application not found' });
        res.status(200).json({ success: true, message: `Status changed to ${status}`, data: updated });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
exports.changeStatus = changeStatus;
const getLoanByLoanID = async (req, res) => {
    try {
        const { LoanId } = req.body;
        const data = await loan_application_repo_1.default.findLoanApplicationByLoanId(LoanId);
        res.status(200).json({ success: true, message: `get Loan Data by ${LoanId}`, data: data });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getLoanByLoanID = getLoanByLoanID;
const getLoanById = async (req, res) => {
    try {
        const Id = parseInt(req.params.id, 10);
        const data = await loan_application_repo_1.default.findLoanApplicationById(Id);
        res.status(200).json({ success: true, message: `get Loan Data by ${Id}`, data: data });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getLoanById = getLoanById;
const getAllLoan = async (req, res) => {
    try {
        const { CustomerId, requesterId, productId, status, min, max, is_confirmed, page, limit } = req.query;
        // Log เพื่อ debug
        console.log('Request query:', req.query);
        // 🟢 ดึงค่า status ออกมา โดยเช็คทั้ง Key 'status' ธรรมดา และ Key 'status[]' ที่ Axios ชอบแอบแปลงมาให้
        const actualStatus = status || req.query['status[]'];
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const { rows, count } = await loan_application_repo_1.default.findLoanApplications({
            customerId: CustomerId ? Number(CustomerId) : undefined,
            requesterId: requesterId ? Number(requesterId) : undefined,
            productId: productId ? Number(productId) : undefined,
            status: actualStatus ? String(actualStatus) : undefined,
            min: min ? Number(min) : undefined,
            max: max ? Number(max) : undefined,
            is_confirmed: is_confirmed ? Number(is_confirmed) : undefined, // ✅ เพิ่มถ้าต้องการ
            page: pageNum,
            limit: limitNum
        });
        return res.status(200).json({
            success: true,
            message: 'get all Loan Data',
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(count / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error fetching loans:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
exports.getAllLoan = getAllLoan;
const sentApplyDraft = async (req, res) => {
    const transaction = await init_models_1.db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { is_confirmed, otp, phone } = req.body;
        console.log('check before sent to Apply ', req.body);
        // 🟢 ດຶງ ID ຜູ້ໃຊ້ທີ່ເຮັດລາຍການ (ຖ້າບໍ່ມີໃຫ້ເປັນ 1 ຫຼື ID ຂອງລະບົບ)
        const performedBy = req.userPayload?.userId || 1;
        // 1. Verify OTP (ทุกช่องทางต้องผ่าน)
        if (!await otp_service_1.otpService.verifyOTP({ phoneNumber: phone, otp })) {
            throw new errors_1.ValidationError('OTP ບໍ່ຖືກຕ້ອງ ຫລື ຫມົດອາຍຸ');
        }
        const loanApp = await loan_application_repo_1.default.findLoanApplicationById(Number(id));
        if (!loanApp)
            throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນການຂໍສິນເຊຶ່ອຂອງລູກຄ້າ');
        // 🟢 ເກັບຂໍ້ມູນເກົ່າໄວ້ກ່ອນການອັບເດດ
        const oldLoanData = loanApp.toJSON();
        const updateData = { is_confirmed };
        const updatedLoan = await loanApp.update(updateData, { transaction });
        if (!updatedLoan)
            return res.status(404).json({ message: 'Loan Application not found' });
        // 🟢 ບັນທຶກ Audit Log ສຳລັບການ Update ສະຖານະ
        await (0, auditLogger_1.logAudit)('loan_applications', loanApp.id, 'UPDATE', oldLoanData, updateData, performedBy, transaction);
        await transaction.commit();
        res.status(200).json({ success: true, message: `Sent Draft to Apply Completed`, data: updatedLoan });
    }
    catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
exports.sentApplyDraft = sentApplyDraft;
// // POST /api/loan-applications/create-with-customer
// POST /api/loan-applications/create-with-customer
const createWithCustomer = async (req, res) => {
    const transaction = await init_models_1.db.sequelize.transaction();
    try {
        const { phone, otp, identity_number, first_name, last_name, address, age, occupation, income_per_month, product_id, quantity = 1, total_amount, loan_period, interest_rate_at_apply, monthly_pay, interest_type, interest_rate_type, existing_customer_id } = req.body;
        // 🟢 Check if request is from an authenticated staff member
        const isStaffRequest = !!req.userPayload;
        const staffId = req.userPayload?.userId || null;
        // For audit logs: Use staff ID if available, otherwise use a generic System ID (e.g., 1) or null
        const performedBy = staffId || 1;
        // 1. Verify OTP (ทุกช่องทางต้องผ่าน)
        if (!await otp_service_1.otpService.verifyOTP({ phoneNumber: phone, otp })) {
            throw new errors_1.ValidationError('OTP ບໍ່ຖືກຕ້ອງ ຫລື ຫມົດອາຍຸ');
        }
        // 2. Get or Create Customer
        let customer;
        const customerPayload = { phone, identity_number, first_name, last_name, address, age, occupation, income_per_month };
        const customerUpdatePayload = { first_name, last_name, address, age, occupation, income_per_month };
        // 🟢 Logic split based on authentication status
        if (isStaffRequest && req.userPayload?.role === 'staff') {
            // STAFF FLOW
            if (existing_customer_id) {
                customer = await customer_repo_1.default.findCustomerById(existing_customer_id);
                if (!customer)
                    throw new errors_1.NotFoundError('ບໍ່ພົບລູກຄ້າ');
                const oldCustomerData = customer.toJSON();
                await customer.update(customerUpdatePayload, { transaction });
                await (0, auditLogger_1.logAudit)('customers', customer.id, 'UPDATE', oldCustomerData, customerUpdatePayload, performedBy, transaction);
            }
            else {
                customer = await customer_repo_1.default.createCustomer(customerPayload, { transaction });
                await (0, auditLogger_1.logAudit)('customers', customer.id, 'CREATE', null, customer.toJSON(), performedBy, transaction);
            }
        }
        else {
            // CUSTOMER (PUBLIC) FLOW
            customer = await customer_repo_1.default.findCustomersByPhone(phone);
            if (!customer) {
                customer = await customer_repo_1.default.createCustomer(customerPayload, { transaction });
                await (0, auditLogger_1.logAudit)('customers', customer.id, 'CREATE', null, customer.toJSON(), performedBy, transaction);
            }
            else {
                const oldCustomerData = customer.toJSON();
                await customer.update(customerUpdatePayload, { transaction });
                await (0, auditLogger_1.logAudit)('customers', customer.id, 'UPDATE', oldCustomerData, customerUpdatePayload, performedBy, transaction);
            }
        }
        // 3. Validate product
        const product = await init_models_1.db.products.findByPk(product_id, { transaction });
        if (!product)
            throw new errors_1.NotFoundError('ບໍ່ພົບສິນຄ້າ');
        const final_total = total_amount || (product.price * quantity);
        // 4. Create Loan Application
        const loanPayload = {
            customer_id: customer.id,
            product_id,
            total_amount: final_total,
            loan_period: loan_period || 0,
            interest_rate_at_apply: interest_rate_at_apply || 0,
            interest_type: interest_type || 'flat_rate',
            interest_rate_type: interest_rate_type || 'monthly',
            monthly_pay: monthly_pay,
            is_confirmed: 0,
            status: 'pending',
            // 🟢 Set requester_id ONLY if it's a staff member. If public customer, it remains null.
            requester_id: staffId || null
        };
        const application = await loan_application_repo_1.default.createLoanApplication(loanPayload, { transaction });
        await (0, auditLogger_1.logAudit)('loan_applications', application.id, 'CREATE', null, application.toJSON(), performedBy, transaction);
        let requesterData = null;
        if (application.requester_id) {
            const requester = await init_models_1.db.users.findByPk(application.requester_id, { transaction });
            if (requester) {
                requesterData = {
                    id: requester.id,
                    name: requester.full_name || requester.username || 'ບໍ່ລະບຸ'
                };
            }
        }
        await transaction.commit();
        res.status(201).json({
            success: true,
            message: 'ສ້າງຮ່າງຄຳຂໍຜ່ອນຮຽບຮ້ອຍ',
            data: {
                application_id: application.id,
                customer_id: customer.id,
                product_id,
                loan_id: application.loan_id,
                total_amount: total_amount,
                loan_period: loan_period,
                interest_rate_at_apply: interest_rate_at_apply,
                interest_type: application.interest_type, // 🟢 รีเทิร์นค่ากลับไปให้ชัวร์
                interest_rate_type: application.interest_rate_type, // 🟢 รีเทิร์นค่ากลับไปให้ชัวร์
                monthly_pay: monthly_pay,
                is_confirmed: application.is_confirmed,
                status: application.status,
                requester_id: application.requester_id || null,
                approver_id: application.approver_id || null,
                applied_at: application.applied_at || null,
                approved_at: application.approved_at || null,
                credit_score: application.credit_score || null,
                remarks: application.remarks || null,
                created_at: application.created_at || null,
                updated_at: application.updated_at || null,
                customer: {
                    id: customer.id,
                    phone: phone,
                    identity_number: identity_number,
                    first_name: first_name,
                    last_name: last_name,
                    address: address,
                    age: age,
                    occupation: occupation,
                    income_per_month: income_per_month
                },
                product: {
                    id: product_id,
                    partner_id: product.partner_id,
                    productType_id: product.productType_id,
                    product_name: product.product_name,
                    price: product.price,
                    interest_rate: interest_rate_at_apply
                },
                requester: requesterData,
                approver: null,
                is_staff_mode: !!req.userPayload?.role?.includes('staff')
            }
        });
    }
    catch (error) {
        await transaction.rollback();
        const err = (0, errors_1.handleErrorResponse)(error);
        res.status(err.status).json(err);
    }
};
exports.createWithCustomer = createWithCustomer;
const createRepaymentSchedule = async (req, res) => {
    const transaction = await init_models_1.db.sequelize.transaction();
    try {
        const { scheduleData } = req.body;
        const application_id = parseInt(req.params.application_id);
        const userId = req.userPayload?.userId;
        console.log('Creating repayment schedule for application_id:', application_id);
        console.log('Schedule data:', scheduleData);
        const result = await repayment_repo_1.default.saveRepaymentSchedule(application_id, scheduleData, Number(userId), transaction);
        await transaction.commit();
        res.status(201).json({ success: true, message: 'Repayment schedule created', data: result });
    }
    catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
exports.createRepaymentSchedule = createRepaymentSchedule;
const getRepaymentSchedule = async (req, res) => {
    try {
        const application_id = parseInt(req.params.application_id);
        console.log('Fetching repayment schedule for application_id:', application_id);
        const schedule = await repayment_repo_1.default.findRepaymentsByApplicationId(application_id);
        res.status(200).json({ success: true, message: 'Repayment schedule fetched', data: schedule });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
exports.getRepaymentSchedule = getRepaymentSchedule;
