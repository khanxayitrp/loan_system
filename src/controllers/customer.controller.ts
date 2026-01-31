import { Request, Response } from 'express';
import customerRepo from '../repositories/customer.repo'; // ปรับ path ตาม project
import { generateOTP, verifyOTP } from '../utils/otp';
import { ValidationError } from '../utils/errors'; // สมมติมี

export const requestOtpForCustomer = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) throw new ValidationError('Phone number is required');

    // สร้างและส่ง OTP (ใน dev จะ log OTP ออกมา)
    generateOTP(phone);

    res.status(200).json({ 
      message: 'OTP sent successfully',
      phone 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { 
      identity_number, first_name, last_name, phone, 
      address, occupation, income_per_month, otp 
    } = req.body;

    // Verify OTP ก่อน
    const isValid = await verifyOTP(phone, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const customer = await customerRepo.createCustomer({
      identity_number,
      first_name,
      last_name,
      phone,
      address,
      occupation,
      income_per_month,
      // user_id: req.user?.id || null, // ถ้ามี auth จาก middleware
    });

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await customerRepo.findCustomerById(Number(id));
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// เพิ่ม controller อื่นๆ ตาม repo ที่มี เช่น update, search by name/phone...