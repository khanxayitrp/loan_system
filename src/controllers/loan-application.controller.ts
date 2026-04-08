import { Request, Response, NextFunction } from 'express';
import loanAppRepo from '../repositories/loan_application.repo';
import repaymentRepo from '../repositories/repayment.repo';
// import delivery_receiptRepo from '../repositories/delivery_receipt.repo'; // ไม่เห็นได้ใช้ในไฟล์นี้ แนะนำให้เอาออกถ้าไม่ได้ใช้
import customerRepo from '../repositories/customer.repo';
import { generateSignatureSlots } from '../utils/signatureGenerator';

// 👉 1. Import Custom Errors
import { NotFoundError, ValidationError, BadRequestError, UnauthorizedError } from '../utils/errors';
import { db } from '../models/init-models';
import { otpService } from '../services/otp.service';
import { Transaction } from 'sequelize';
import { logAudit } from '../utils/auditLogger';
import { logApprovalAction } from '../utils/approvalLogger';

import redisService from '../services/redis.service';

export const createLoanApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    // Optional: เช็คสิทธิ์ staff จาก req.user.permissions

    const application = await loanAppRepo.createLoanApplication({
      ...data,
      requester_id: req.userPayload?.userId || null, // จาก middleware auth
    });

    return res.status(201).json({
      success: true,
      message: 'Loan application created',
      data: application
    });
  } catch (error) {
    next(error); // โยนให้ Global Error Handler
  }
};

//---------------- customer-portal ----------------
export const cancelLoanApplicationbyCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loanId = req.params.application_id;
    const customerId = req.customerPayload?.userId;

    if (!customerId) {
      throw new UnauthorizedError('Unauthorized');
    }

    let loanData: any = {
      status: 'cancelled',
      customer_id: customerId
    }

    const updated = await loanAppRepo.updateLoanApplication(Number(loanId), loanData);
    
    if (!updated) {
        throw new NotFoundError('Application not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Loan application cancelled',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const updateLoanApplication = async (req: Request, res: Response, next: NextFunction) => {
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

    if (!updated) {
        throw new NotFoundError('Application not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Loan application updated',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const updateDraftLoanApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.userPayload?.userId;
    console.log('Draft loan data :', req.body)

    let loanData: any = {
      ...req.body,
      performed_by: userId, // บันทึกผู้แก้ไข
    }
    
    const updated = await loanAppRepo.updateDraftLoanApplication(Number(id), loanData);

    if (!updated) {
        throw new NotFoundError('Application not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Draft Loan application updated',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const changeStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userPayload?.userId;
    
    console.log('function changeStatus ', req.body)
    
    if (!status) {
        throw new BadRequestError('Status is required');
    }

    const updated = await loanAppRepo.updateLoanApplicationStatus(Number(id), status, Number(userId));

    if (!updated) {
        throw new NotFoundError('Application not found');
    }

    return res.status(200).json({ 
        success: true, 
        message: `Status changed to ${status}`, 
        data: updated 
    });
  } catch (error) {
    next(error);
  }
};

export const getLoanByLoanID = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { LoanId } = req.body;
    
    if(!LoanId) throw new BadRequestError('LoanId is required');

    const data = await loanAppRepo.findLoanApplicationByLoanId(LoanId);
    
    if(!data) throw new NotFoundError('Application not found');

    return res.status(200).json({ 
        success: true, 
        message: `get Loan Data by ${LoanId}`, 
        data: data 
    });
  } catch (error) {
    next(error);
  }
}

export const getLoanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Id = parseInt(req.params.id, 10);
    
    if (isNaN(Id)) throw new BadRequestError('Invalid ID format');

    const data = await loanAppRepo.findLoanApplicationById(Id);
    
    if(!data) throw new NotFoundError('Application not found');

    return res.status(200).json({ 
        success: true, 
        message: `get Loan Data by ${Id}`, 
        data: data 
    });
  } catch (error) {
    next(error);
  }
}

export const getLoanbyCusIDandLoanID = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loanId = req.params.application_id;
    const CustomerId = req.customerPayload?.userId;

    if (!CustomerId) throw new UnauthorizedError('Unauthorized');

    const data = await loanAppRepo.findLoanApplicationByCusIDandLoanId(Number(CustomerId), Number(loanId));
    
    if (!data) {
        throw new NotFoundError('Application not found');
    }
    
    return res.status(200).json({ 
        success: true, 
        message: `get Loan Data by ${CustomerId} and ${loanId}`, 
        data: data 
    });

  } catch (error) {
    console.error('Error fetching loan:', error);
    next(error);
  }
}

export const getAllLoanByCustomerId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, min, max, is_confirmed, page, limit } = req.query
    const CustomerId = req.customerPayload?.userId;
    console.log('Request query:', req.query);

    const actualStatus = status || req.query['status[]'];
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    const result = await loanAppRepo.findLoanApplicationsByCustomerId({
      customerId: CustomerId ? Number(CustomerId) : undefined,
      status: actualStatus, 
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      is_confirmed: is_confirmed !== undefined ? Number(is_confirmed) : undefined,
      page: pageNum,
      limit: limitNum
    });

    return res.status(200).json({
      success: true,
      message: 'get all Loan Data by Customer',
      data: result.data,
      total: result.total,
      counts: result.counts,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    });

  } catch (error) {
    console.error('Error fetching loans:', error);
    next(error);
  }
}

export const getAllLoan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { CustomerId, requesterId, productId, status, min, max, is_confirmed, page, limit } = req.query
    console.log('Request query:', req.query);

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
      is_confirmed: is_confirmed ? Number(is_confirmed as string) : undefined,
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

  } catch (error) {
    console.error('Error fetching loans:', error);
    next(error);
  }
}

export const sentApplyDraft = async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { is_confirmed, otp, phone } = req.body; // otp, phone ไม่ได้ใช้แล้ว?
        console.log('check before sent to Apply ', req.body);
        
        const performedBy = req.userPayload?.userId || 1;

        // const loanApp = await loanAppRepo.findLoanApplicationById(Number(id));
        const loanApp = await db.loan_applications.findByPk(Number(id), { 
            transaction, 
            lock: transaction.LOCK.UPDATE 
        });

        if (!loanApp) {
            throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນການຂໍສິນເຊຶ່ອຂອງລູກຄ້າ');
        }

        const oldLoanData = loanApp.toJSON();
        const updateData = { is_confirmed };

        const updatedLoan = await loanApp.update(updateData, { transaction });
        
        // ถ้า update ไม่ผ่าน ปกติ Sequelize จะโยน Error เอง แต่เขียนดักไว้ก็ดีครับ
        if (!updatedLoan) {
             throw new NotFoundError('Loan Application not found or could not be updated');
        }

        await logAudit('loan_applications', loanApp.id, 'UPDATE', oldLoanData, updateData, performedBy, transaction);

        await transaction.commit();
        return res.status(200).json({ success: true, message: `Sent Draft to Apply Completed`, data: updatedLoan });

    } catch (error) {
        await transaction.rollback(); // คืนค่า Database ก่อน
        next(error); // โยนเข้า Error Handler
    }
};

export const createWithCustomer = async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await db.sequelize.transaction();
    try {
        const {
            phone, otp, identity_number, first_name, last_name, address, age, occupation, income_per_month, other_debt,
            product_id, quantity = 1, total_amount, loan_period, interest_rate_at_apply, monthly_pay, down_payment,
            interest_type, interest_rate_type, 
            existing_customer_id 
        } = req.body;

        const isStaffRequest = !!req.userPayload;
        const staffId = req.userPayload?.userId || null;
        const performedBy = staffId || 1; 

        // 1. Verify OTP
        if (!phone || !otp) {
            throw new ValidationError('ກະລຸນາປ້ອນເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
        }

        const verificationResult = await otpService.verifyOTP({
            phoneNumber: phone,
            otp
        });

        if (!verificationResult.success) {
             throw new BadRequestError(verificationResult.message || 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ');
        }

        // 2. Get or Create Customer
        let customer;
        const customerPayload = { phone, identity_number, first_name, last_name, address, age, occupation, income_per_month, other_debt };
        const customerUpdatePayload = { first_name, last_name, address, age, occupation, income_per_month, other_debt };

        if (isStaffRequest && req.userPayload?.role === 'staff') {
            // STAFF FLOW
            if (existing_customer_id) {
                // customer = await customerRepo.findCustomerById(existing_customer_id);
                customer = await db.customers.findByPk(existing_customer_id, { 
                transaction, 
                lock: transaction.LOCK.UPDATE // 🔒 Lock ລູກຄ້າໄວ້ກ່ອນອັບເດດ
            });
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
        const product = await db.products.findByPk(product_id, { transaction, lock: transaction.LOCK.UPDATE });
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
            down_payment: down_payment || 0,
            monthly_pay: monthly_pay,
            is_confirmed: 0,
            status: 'pending',
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

        return res.status(201).json({
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
                interest_type: application.interest_type,           
                interest_rate_type: application.interest_rate_type, 
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
                    income_per_month: income_per_month,
                    other_debt: other_debt
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
        next(error); // 👈 แค่โยน error ก็พอ Global Handler จะใช้ handleErrorResponse จัดการให้เอง!
    }
};

export const createRepaymentSchedule = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await db.sequelize.transaction();
    try {
        const { scheduleData } = req.body;
        const application_id = parseInt(req.params.application_id);
        const userId = req.userPayload?.userId;
        
        if (isNaN(application_id)) throw new BadRequestError('Invalid application_id format');
        if (!scheduleData) throw new BadRequestError('scheduleData is required');

        console.log('Creating repayment schedule for application_id:', application_id);
        
        const result = await repaymentRepo.saveRepaymentSchedule(application_id, scheduleData, Number(userId), transaction);
        
        await transaction.commit();
        
        // =========================================================
        // 🟢 THE ULTIMATE CACHE INVALIDATION (ລ້າງແຄຊຖິ້ມຫຼັງຈາກສ້າງໃໝ່!)
        // =========================================================
        await redisService.del(`cache:repayment_schedule:${application_id}`);
        // ລ້າງແຄຊ PDF ຕາຕະລາງຜ່ອນນຳ (ຖ້າມີການ Gen PDF)
        await redisService.del(`cache:pdf:schedule:${application_id}`);
        
        return res.status(201).json({ 
            success: true, 
            message: 'Repayment schedule created', 
            data: result 
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}

  export const getRepaymentSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const application_id = parseInt(req.params.application_id);
        
        if (isNaN(application_id)) throw new BadRequestError('Invalid application_id format');

        // =========================================================
        // 🟢 1. ກວດສອບຂໍ້ມູນໃນ Redis Cache ກ່ອນ
        // =========================================================
        const cacheKey = `cache:repayment_schedule:${application_id}`;
        const cachedSchedule = await redisService.get(cacheKey);

        if (cachedSchedule) {
            console.log(`[Cache Hit] Fetching Repayment Schedule ${application_id} from Redis.`);
            return res.status(200).json({ 
                success: true, 
                message: 'Repayment schedule fetched (From Cache)', 
                data: JSON.parse(cachedSchedule) 
            });
        }

        // =========================================================
        // 🔴 2. ຖ້າບໍ່ພົບໃນ Cache ໃຫ້ດຶງຈາກ Database
        // =========================================================
        console.log(`[Cache Miss] Fetching Repayment Schedule ${application_id} from MySQL.`);
        const schedule = await repaymentRepo.findRepaymentsByApplicationId(application_id);
        
        if(!schedule) throw new NotFoundError('Schedule not found');

        // =========================================================
        // 🟢 3. ບັນທຶກຂໍ້ມູນທີ່ໄດ້ລົງໃນ Redis (ຕັ້ງອາຍຸໄວ້ 15 ນາທີ ຫຼື 900 ວິນາທີ)
        // =========================================================
        await redisService.set(cacheKey, JSON.stringify(schedule), 900); 

        return res.status(200).json({ 
            success: true, 
            message: 'Repayment schedule fetched', 
            data: schedule 
        });
    } catch (error) {
        next(error);
    } 
}

  // =======================================================
// 🟢 ຟັງຊັນໃໝ່: ບັນທຶກປະຫວັດການພິມໃບ Approval Summary
// =======================================================
export const markApprovalSummaryPrinted = async (req: Request, res: Response, next: NextFunction) => {
    const t = await db.sequelize.transaction();
    try {
        const loanId = parseInt(req.params.id, 10);
        const userId = (req as any).userPayload?.userId;

        const loan = await db.loan_applications.findByPk(loanId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!loan) throw new Error('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ');

        // 1. ບັນທຶກລົງ Audit Log ວ່າຜູ້ໃຊ້ຄົນນີ້ໄດ້ພິມເອກະສານ
        await logApprovalAction(
            loanId,
            'printed_approval_summary',
            loan.status,
            loan.status,
            'ພິມໃບສະຫຼຸບການປະເມີນສິນເຊື່ອ (Hard Copy Generated)',
            userId,
            t
        );

        // 2. 🌟 ເອີ້ນໃຊ້ Utility ເພື່ອສ້າງຊ່ອງລາຍເຊັນ (ມັນຈະສ້າງໃຫ້ຄົບທັງ 5 ຄົນອັດຕະໂນມັດ)
        await generateSignatureSlots(
            loanId,
            'approval_summary',
            loanId, // ໃຊ້ loanId ເປັນ reference_id ເພາະ approval_summary ບໍ່ມີຕາຕະລາງແຍກ
            t
        );

        // 3. 🟢 ອັບເດດລາຍເຊັນຂອງ "ພະນັກງານສິນເຊື່ອ (Credit Staff)" ໃຫ້ເປັນ signed ທັນທີ 
        // ເພາະຄົນທີ່ກົດພິມ ແມ່ນຄົນທີ່ປະເມີນເອງ
        await db.document_signatures.update(
            { status: 'signed', user_id: userId, signed_at: new Date() },
            { 
                where: { application_id: loanId, document_type: 'approval_summary', role_type: 'credit_staff' },
                transaction: t
            }
        );

        await t.commit();
        res.status(200).json({ success: true, message: 'ບັນທຶກປະຫວັດການພິມສຳເລັດ' });

    } catch (error) {
        await t.rollback();
        next(error);
    }
}
  