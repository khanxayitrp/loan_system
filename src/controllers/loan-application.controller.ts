import { Request, Response } from 'express';
import loanAppRepo from '../repositories/loan_application.repo';
import customerRepo from '../repositories/customer.repo';
import { NotFoundError,ValidationError, handleErrorResponse } from '../utils/errors';
import { customers, customersAttributes } from '../models/init-models';
import { db } from '../models/init-models';
import { verifyOTP } from '@/utils/otp';

export const createLoanApplication = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Optional: เช็คสิทธิ์ staff จาก req.user.permissions

    const application = await loanAppRepo.createLoanApplication({
      ...data,
      requester_id: req.user?.id || null, // จาก middleware auth
    });

    res.status(201).json({
      message: 'Loan application created',
      application
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLoanApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await loanAppRepo.updateLoanApplication(Number(id), req.body);

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    res.json({
      message: 'Loan application updated',
      application: updated
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await loanAppRepo.updateLoanApplicationStatus(Number(id), status);

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    res.json({ message: `Status changed to ${status}`, application: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/loan-applications/create-with-customer
export const createWithCustomer = async (req: Request, res: Response) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { 
      phone, otp, identity_number, first_name, last_name, address, occupation, income_per_month,
      product_id, quantity = 1, total_amount,
      existing_customer_id // สำหรับ staff
    } = req.body;

    // 1. Verify OTP (ทุกช่องทางต้องผ่าน)
    if (!await verifyOTP(phone, otp)) {
      throw new ValidationError('OTP ไม่ถูกต้องหรือหมดอายุ');
    }

    // 2. Get or Create Customer
    let customer;
    if (req.userPayload?.role === 'staff') {
      // Staff สามารถเลือก customer_id ที่มีอยู่ได้ (ถ้าส่งมา)
      if (existing_customer_id) {
        customer = await customerRepo.findCustomerById(existing_customer_id);
        if (!customer) throw new NotFoundError('ไม่พบลูกค้า');
        // อัปเดตข้อมูลลูกค้าโดย staff
        await customer.update({ first_name, last_name, address, occupation, income_per_month }, { transaction });
      } else {
        // Staff สร้างลูกค้าใหม่
        customer = await customerRepo.createCustomer({ 
          phone,identity_number, first_name, last_name, address, occupation, income_per_month 
        }, { transaction });
      }
    } else {
      // Customer ทั่วไป: สร้างใหม่หรือใช้ที่มี
      customer = await customerRepo.findCustomersByPhone(phone);  // ← แก้จาก findCustomersByPhone เป็น findCustomerByPhone
      if (!customer) {
        customer = await customerRepo.createCustomer({ 
          phone, identity_number, first_name, last_name, address, occupation, income_per_month 
        }, { transaction });
      } else {
        // อัปเดตข้อมูล (optional)
        await customer.update({ first_name, last_name, address, occupation, income_per_month }, { transaction });
      }
    }

    // 3. Validate product
    const product = await db.products.findByPk(product_id, { transaction });
    if (!product) throw new NotFoundError('ไม่พบสินค้า');

    const final_total = total_amount || (product.price * quantity);

    // 4. Create Loan Application
    const application = await loanAppRepo.createLoanApplication({
      customer_id: customer.id,
      product_id,
      total_amount: final_total,
      loan_period: req.body.loan_period || 0,
      monthly_installment: 0,
      interest_rate_at_apply: product.interest_rate || 0,
      is_confirmed: 0,
      status: 'pending',
      requester_id: req.userPayload?.userId ?? undefined
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'สร้างคำขอผ่อนเรียบร้อย',
      data: {
        customer_id: customer.id,
        application_id: application.id,
        product_name: product.product_name,
        is_staff_mode: !!req.userPayload?.role?.includes('staff')  // ปรับให้ปลอดภัยขึ้น
      }
    });
  } catch (error) {
    await transaction.rollback();
    const err = handleErrorResponse(error);
    res.status(err.status).json(err);
  }
};