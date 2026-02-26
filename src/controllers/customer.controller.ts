import { Request, Response } from 'express';
import customerRepo from '../repositories/customer.repo'; // ปรับ path ตาม project
import { otpService } from '../services/otp.service';
import { ValidationError } from '../utils/errors'; // สมมติมี

export const requestOtpForCustomer = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) throw new ValidationError('Phone number is required');

    // สร้างและส่ง OTP (ใน dev จะ log OTP ออกมา)
    const result = await otpService.sendOTP({
      phoneNumber: phone,
      message: 'Your OTP code is: {OTP}. Valid for 5 minutes.',
    })

    res.status(200).json({
      message: 'OTP sent successfully',
      result
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
    const isValid = await otpService.verifyOTP({
      phoneNumber: phone,
      otp
    });
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
    res.status(200).json({ success: true, message: 'found customer data', data: customer });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerBySearch = async (req: Request, res: Response) => {
  try {
    const { phone, first_name, last_name } = req.query;
    console.log("🔍 Incoming search params:", req.query);

    let customer = null;

    // 1. ກໍລະນີຫາດ້ວຍເບີໂທ
    if (phone && typeof phone === 'string') {
      customer = await customerRepo.findCustomersByPhone(phone);
    }

    // 2. ຖ້າຫາດ້ວຍເບີບໍ່ເຫັນ (ຫຼື ບໍ່ໄດ້ສົ່ງເບີມາ) ໃຫ້ຫາດ້ວຍຊື່-ນາມສະກຸນ
    if (!customer && first_name && last_name) {
      const fullName = `${first_name} + ' ' + ${last_name}`;
      customer = await customerRepo.findCustomersByName(fullName);
    }

    // 3. ຖ້າບໍ່ມີຂໍ້ມູນຫຍັງສົ່ງມາເລີຍ
    if (!phone && (!first_name || !last_name)) {
        return res.status(400).json({ 
            success: false, 
            message: 'ກະລຸນາລະບຸ ຊື່-ນາມສະກຸນ ຫຼື ເບີໂທລະສັບ' 
        });
    }

    // 4. ສົ່ງຜົນລັດ
    if (!customer) {
        return res.status(404).json({ success: false, message: 'ບໍ່ພົບຂໍ້ມູນລູກຄ້າ' });
    }

    return res.status(200).json({ 
        success: true, 
        message: 'ພົບຂໍ້ມູນລູກຄ້າ', 
        data: customer 
    });

  } catch (error: any) {
    console.error("❌ Search Error:", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// เพิ่ม controller อื่นๆ ตาม repo ที่มี เช่น update, search by name/phone...