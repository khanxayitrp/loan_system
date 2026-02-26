
import { Request, Response } from 'express';
import loanAppRepo from '../repositories/loan_application.repo';
import customerRepo from '../repositories/customer.repo';
import { NotFoundError, ValidationError, handleErrorResponse } from '../utils/errors';
import { customers, customersAttributes } from '../models/init-models';
import { db } from '../models/init-models';
import { otpService } from '../services/otp.service';

export const createLoanApplication = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Optional: เช็คสิทธิ์ staff จาก req.user.permissions

    const application = await loanAppRepo.createLoanApplication({
      ...data,
      requester_id: req.user?.id || null, // จาก middleware auth
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
    const updated = await loanAppRepo.updateLoanApplication(Number(id), req.body);

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

    console.log('Draft loan data :', req.body)
    const updated = await loanAppRepo.updateDraftLoanApplication(Number(id), req.body);

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
    console.log('function changeStatus ', req.body)
    const updated = await loanAppRepo.updateLoanApplicationStatus(Number(id), status);

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

export const getAllLoan = async (req: Request, res: Response) => {
  try {
    const { CustomerId, requesterId, productId, status, min, max, is_confirmed } = req.query
    // Log เพื่อ debug
    console.log('Request query:', req.query);
    const loans = await loanAppRepo.findLoanApplications({
      customerId: CustomerId ? Number(CustomerId) : undefined,
      requesterId: requesterId ? Number(requesterId) : undefined,
      productId: productId ? Number(productId) : undefined,
      status,
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
    is_confirmed: is_confirmed ? Number(is_confirmed as string) : undefined  // ✅ เพิ่มถ้าต้องการ
    });

    return res.status(200).json({
      success: true,
      message: 'get all Loan Data',
      data: loans
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
    const { id } = req.params
    const { is_confirmed, otp, phone } = req.body
    console.log('check before sent to Apply ', req.body)
    // 1. Verify OTP (ทุกช่องทางต้องผ่าน)
    if (!await otpService.verifyOTP({ phoneNumber: phone, otp })) {
      throw new ValidationError('OTP ບໍ່ຖືກຕ້ອງ ຫລື ຫມົດອາຍຸ');
    }

    const loanApp = await loanAppRepo.findLoanApplicationById(Number(id))

    if (!loanApp) throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນການຂໍສິນເຊຶ່ອຂອງລູກຄ້າ');

    const updatedLoan = await loanApp.update({ is_confirmed }, {transaction})
if (!updatedLoan) return res.status(404).json({ message: 'Loan Application not found' });
    await transaction.commit()
    res.status(200).json({ success: true, message: `Sent Draft to Apply Completed`, data: updatedLoan });

  } catch (error: any) {
    await transaction.rollback()
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
}

// POST /api/loan-applications/create-with-customer
export const createWithCustomer = async (req: Request, res: Response) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      phone, otp, identity_number, first_name, last_name, address, age, occupation, income_per_month,
      product_id, quantity = 1, total_amount, loan_period, interest_rate_at_apply, monthly_pay,
      existing_customer_id // สำหรับ staff
    } = req.body;

    // 1. Verify OTP (ทุกช่องทางต้องผ่าน)
    if (!await otpService.verifyOTP({ phoneNumber: phone, otp })) {
      throw new ValidationError('OTP ບໍ່ຖືກຕ້ອງ ຫລື ຫມົດອາຍຸ');
    }

    // 2. Get or Create Customer
    let customer;
    if (req.userPayload?.role === 'staff') {
      // Staff สามารถเลือก customer_id ที่มีอยู่ได้ (ถ้าส่งมา)
      if (existing_customer_id) {
        customer = await customerRepo.findCustomerById(existing_customer_id);
        if (!customer) throw new NotFoundError('ບໍ່ພົບລູກຄ້າ');
        // อัปเดตข้อมูลลูกค้าโดย staff
        await customer.update({ first_name, last_name, address, age, occupation, income_per_month }, { transaction });
      } else {
        // Staff สร้างลูกค้าใหม่
        customer = await customerRepo.createCustomer({
          phone, identity_number, first_name, last_name, address, age, occupation, income_per_month
        }, { transaction });
      }
    } else {
      // Customer ทั่วไป: สร้างใหม่หรือใช้ที่มี
      customer = await customerRepo.findCustomersByPhone(phone);  // ← แก้จาก findCustomersByPhone เป็น findCustomerByPhone
      if (!customer) {
        customer = await customerRepo.createCustomer({
          phone, identity_number, first_name, last_name, address, age, occupation, income_per_month
        }, { transaction });
      } else {
        // อัปเดตข้อมูล (optional)
        await customer.update({ first_name, last_name, address, age, occupation, income_per_month }, { transaction });
      }
    }

    // 3. Validate product
    const product = await db.products.findByPk(product_id, { transaction });
    if (!product) throw new NotFoundError('ບໍ່ພົບສິນຄ້າ');

    const final_total = total_amount || (product.price * quantity);

    // 4. Create Loan Application
    const application = await loanAppRepo.createLoanApplication({
      customer_id: customer.id,
      product_id,
      total_amount: final_total,
      loan_period: loan_period || 0,
      interest_rate_at_apply: interest_rate_at_apply || 0,
      monthly_pay: monthly_pay,
      is_confirmed: 0,
      status: 'pending',
      requester_id: req.userPayload?.userId ?? undefined
    }, { transaction });

        // ✅ 5. ดึงข้อมูล requester (ถ้ามี)
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
        // customer_id: customer.id,
        application_id: application.id,
        customer_id: customer.id,
        product_id,
        loan_id: application.loan_id,                    // ✅ เพิ่ม (มีใน DB)
        total_amount: total_amount,
        loan_period: loan_period,
        interest_rate_at_apply: interest_rate_at_apply,
        monthly_pay: monthly_pay,
        is_confirmed: application.is_confirmed,               // 0 or 1
        status: application.status,
        requester_id: application.requester_id || null,
        approver_id: application.approver_id || null,               // ✅ เพิ่ม
        applied_at: application.applied_at || null,                // ✅ เพิ่ม
        approved_at: application.approved_at || null,               // ✅ เพิ่ม
        credit_score: application.credit_score || null,              // ✅ เพิ่ม
        remarks: application.remarks || null,                   // ✅ เพิ่ม
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
        requester: requesterData, // ✅ ส่ง requester data ที่สมบูรณ์
          // name: 
         approver: null, // ยังไม่มี approver
        is_staff_mode: !!req.userPayload?.role?.includes('staff')  // ปรับให้ปลอดภัยขึ้น
      }
    });
  } catch (error) {
    await transaction.rollback();
    const err = handleErrorResponse(error);
    res.status(err.status).json(err);
  }
};