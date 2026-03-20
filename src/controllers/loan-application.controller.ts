
import { Request, Response } from 'express';
import loanAppRepo from '../repositories/loan_application.repo';
import repaymentRepo from '../repositories/repayment.repo';
import delivery_receiptRepo from '../repositories/delivery_receipt.repo';
import customerRepo from '../repositories/customer.repo';
import { NotFoundError, ValidationError, handleErrorResponse } from '../utils/errors';
import { customers, customersAttributes } from '../models/init-models';
import { db } from '../models/init-models';
import { otpService } from '../services/otp.service';
import { Transaction } from 'sequelize';
import { logAudit } from '../utils/auditLogger';

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

export const createLoanApplication = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Optional: เช็คสิทธิ์ staff จาก req.user.permissions

    const application = await loanAppRepo.createLoanApplication({
      ...data,
      requester_id: req.userPayload?.userId || null, // จาก middleware auth
    });

    res.status(201).json({
      success: true,
      message: 'Loan application created',
      data: application
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

export const updateLoanApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userPayload?.userId;
    const data = req.body;

    console.log('Update loan application data :', data)

    let loanData: any = {
      ...data,
      approver_id: userId, // บันทึกผู้อนุมัติ
    }
    const updated = await loanAppRepo.updateLoanApplication(Number(id), loanData);

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    res.status(200).json({
      success: true,
      message: 'Loan application updated',
      data: updated
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

export const updateDraftLoanApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userPayload?.userId;
    console.log('Draft loan data :', req.body)
    let loanData: any = {
      ...req.body,
      performed_by: userId, // บันทึกผู้แก้ไข
    }
    const updated = await loanAppRepo.updateDraftLoanApplication(Number(id), loanData);

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    res.status(200).json({
      success: true,
      message: 'Draft Loan application updated',
      data: updated
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

export const changeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userPayload?.userId;
    console.log('function changeStatus ', req.body)
    const updated = await loanAppRepo.updateLoanApplicationStatus(Number(id), status, Number(userId));

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    res.status(200).json({ success: true, message: `Status changed to ${status}`, data: updated });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};


export const getLoanByLoanID = async (req: Request, res: Response) => {
  try {
    const { LoanId } = req.body
    const data = await loanAppRepo.findLoanApplicationByLoanId(LoanId);
    res.status(200).json({ success: true, message: `get Loan Data by ${LoanId}`, data: data })
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export const getLoanById = async (req: Request, res: Response) => {
  try {
    const Id = parseInt(req.params.id, 10)
    const data = await loanAppRepo.findLoanApplicationById(Id)
    res.status(200).json({ success: true, message: `get Loan Data by ${Id}`, data: data })
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export const getAllLoanByCustomerId = async (req: Request, res: Response) => {
  try {
    const { status, min, max, is_confirmed, page, limit } = req.query
    const CustomerId = req.userPayload?.userId; // ดึง CustomerId จาก Token ของลูกค้า
    console.log('Request query:', req.query);

    // 🟢 ດຶງຄ່າ status ອອກມາ ໂດຍເຊັກທັງ Key 'status' ທຳມະດາ ແລະ 'status[]'
    const actualStatus = status || req.query['status[]'];

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    // 🟢 1. ຮັບຄ່າ result ທີ່ສົ່ງມາຈາກ Repository
    const result = await loanAppRepo.findLoanApplicationsByCustomerId({
      customerId: CustomerId ? Number(CustomerId) : undefined,
      status: actualStatus, // ສົ່ງໄປເລີຍ ບໍ່ຕ້ອງຄອບ String() ເພາະ Repository ຈັດການ Array/String ໃຫ້ແລ້ວ
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      is_confirmed: is_confirmed !== undefined ? Number(is_confirmed) : undefined, // ໃຊ້ !== undefined ກັນໜຽວກໍລະນີສົ່ງເລກ 0 ມາ
      page: pageNum,
      limit: limitNum
    });

    // 🟢 2. ສົ່ງ Response ກັບໄປຫາ Frontend (ສຳຄັນຫຼາຍ ຫ້າມລືມ)
    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      counts: result.counts,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    });

  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
}

export const getAllLoan = async (req: Request, res: Response) => {
  try {
    const { CustomerId, requesterId, productId, status, min, max, is_confirmed, page, limit } = req.query
    // Log เพื่อ debug
    console.log('Request query:', req.query);

    // 🟢 ดึงค่า status ออกมา โดยเช็คทั้ง Key 'status' ธรรมดา และ Key 'status[]' ที่ Axios ชอบแอบแปลงมาให้
    const actualStatus = status || req.query['status[]'];

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    const { rows, count } = await loanAppRepo.findLoanApplications({
      customerId: CustomerId ? Number(CustomerId) : undefined,
      requesterId: requesterId ? Number(requesterId) : undefined,
      productId: productId ? Number(productId) : undefined,
      status: actualStatus ? String(actualStatus) : undefined,
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      is_confirmed: is_confirmed ? Number(is_confirmed as string) : undefined,  // ✅ เพิ่มถ้าต้องการ
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

  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
}

export const sentApplyDraft = async (req: Request, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { is_confirmed, otp, phone } = req.body;
        console.log('check before sent to Apply ', req.body);
        
        // 🟢 ດຶງ ID ຜູ້ໃຊ້ທີ່ເຮັດລາຍການ (ຖ້າບໍ່ມີໃຫ້ເປັນ 1 ຫຼື ID ຂອງລະບົບ)
        const performedBy = req.userPayload?.userId || 1;

        // 1. Verify OTP (ทุกช่องทางต้องผ่าน)
        // if (!await otpService.verifyOTP({ phoneNumber: phone, otp })) {
        //     throw new ValidationError('OTP ບໍ່ຖືກຕ້ອງ ຫລື ຫມົດອາຍຸ');
        // }

        const loanApp = await loanAppRepo.findLoanApplicationById(Number(id));

        if (!loanApp) throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນການຂໍສິນເຊຶ່ອຂອງລູກຄ້າ');

        // 🟢 ເກັບຂໍ້ມູນເກົ່າໄວ້ກ່ອນການອັບເດດ
        const oldLoanData = loanApp.toJSON();
        const updateData = { is_confirmed };

        const updatedLoan = await loanApp.update(updateData, { transaction });
        if (!updatedLoan) return res.status(404).json({ message: 'Loan Application not found' });

        // 🟢 ບັນທຶກ Audit Log ສຳລັບການ Update ສະຖານະ
        await logAudit('loan_applications', loanApp.id, 'UPDATE', oldLoanData, updateData, performedBy, transaction);

        await transaction.commit();
        res.status(200).json({ success: true, message: `Sent Draft to Apply Completed`, data: updatedLoan });

    } catch (error: any) {
        await transaction.rollback();
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

// // POST /api/loan-applications/create-with-customer

// POST /api/loan-applications/create-with-customer
export const createWithCustomer = async (req: Request, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
        const {
            phone, otp, identity_number, first_name, last_name, address, age, occupation, income_per_month,
            product_id, quantity = 1, total_amount, loan_period, interest_rate_at_apply, monthly_pay,
            interest_type, interest_rate_type, 
            existing_customer_id 
        } = req.body;

        // 🟢 Check if request is from an authenticated staff member
        const isStaffRequest = !!req.userPayload;
        const staffId = req.userPayload?.userId || null;
        
        // For audit logs: Use staff ID if available, otherwise use a generic System ID (e.g., 1) or null
        const performedBy = staffId || 1; 

        // 1. Verify OTP (ทุกช่องทางต้องผ่าน)
        if (!phone || !otp) {
      throw new ValidationError('ກະລຸນາປ້ອນເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
    }

    const verificationResult = await otpService.verifyOTP({
      phoneNumber: phone,
      otp
    });

         // 🟢 ชี้ไปที่ .success แบบนี้เลยครับ
    if (!verificationResult.success) {
      return res.status(400).json({ 
        message: verificationResult.message || 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ',
        data: verificationResult.data // ส่งจำนวนครั้งที่เหลือกลับไปให้ Frontend ด้วยก็ได้ครับ
      });
    }

        // 2. Get or Create Customer
        let customer;
        const customerPayload = { phone, identity_number, first_name, last_name, address, age, occupation, income_per_month };
        const customerUpdatePayload = { first_name, last_name, address, age, occupation, income_per_month };

        // 🟢 Logic split based on authentication status
        if (isStaffRequest && req.userPayload?.role === 'staff') {
            // STAFF FLOW
            if (existing_customer_id) {
                customer = await customerRepo.findCustomerById(existing_customer_id);
                if (!customer) throw new NotFoundError('ບໍ່ພົບລູກຄ້າ');
                
                const oldCustomerData = customer.toJSON();
                await customer.update(customerUpdatePayload, { transaction });
                await logAudit('customers', customer.id, 'UPDATE', oldCustomerData, customerUpdatePayload, performedBy, transaction);
            } else {
                customer = await customerRepo.createCustomer(customerPayload, { transaction });
                await logAudit('customers', customer.id, 'CREATE', null, customer.toJSON(), performedBy, transaction);
            }
        } else {
            // CUSTOMER (PUBLIC) FLOW
            customer = await customerRepo.findCustomersByPhone(phone);  
            if (!customer) {
                customer = await customerRepo.createCustomer(customerPayload, { transaction });
                await logAudit('customers', customer.id, 'CREATE', null, customer.toJSON(), performedBy, transaction);
            } else {
                const oldCustomerData = customer.toJSON();
                await customer.update(customerUpdatePayload, { transaction });
                await logAudit('customers', customer.id, 'UPDATE', oldCustomerData, customerUpdatePayload, performedBy, transaction);
            }
        }

        // 3. Validate product
        const product = await db.products.findByPk(product_id, { transaction });
        if (!product) throw new NotFoundError('ບໍ່ພົບສິນຄ້າ');

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

        const application = await loanAppRepo.createLoanApplication(loanPayload as any, { transaction });

        await logAudit('loan_applications', application.id, 'CREATE', null, application.toJSON(), performedBy, transaction);

        let requesterData = null;
        if (application.requester_id) {
            const requester = await db.users.findByPk(application.requester_id, { transaction });
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
                interest_type: application.interest_type,           // 🟢 รีเทิร์นค่ากลับไปให้ชัวร์
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
    } catch (error) {
        await transaction.rollback();
        const err = handleErrorResponse(error);
        res.status(err.status).json(err);
    }
};

export const createRepaymentSchedule = async (req: Request, res: Response) => {
  const transaction = await db.sequelize.transaction();
    try {
        const { scheduleData } = req.body;
        const application_id = parseInt(req.params.application_id);
        const userId = req.userPayload?.userId;
        console.log('Creating repayment schedule for application_id:', application_id);
        console.log('Schedule data:', scheduleData);
        const result = await repaymentRepo.saveRepaymentSchedule(application_id, scheduleData, Number(userId), transaction);
        await transaction.commit();
        res.status(201).json({ success: true, message: 'Repayment schedule created', data: result });
    } catch (error: any) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  export const getRepaymentSchedule = async (req: Request, res: Response) => {
    try {
        const application_id = parseInt(req.params.application_id);
        console.log('Fetching repayment schedule for application_id:', application_id);
        const schedule = await repaymentRepo.findRepaymentsByApplicationId(application_id);
        res.status(200).json({ success: true, message: 'Repayment schedule fetched', data: schedule });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    } 
  }

  

