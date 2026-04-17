import { Request, Response, NextFunction } from 'express';
import customerRepo from '../repositories/customer.repo'; // ปรับ path ตาม project
import { otpService } from '../services/otp.service';
import { db } from '../models/init-models';
import tokenService from '../services/token.service';

// 👉 1. Import Custom Errors
import { 
    ValidationError, 
    BadRequestError, 
    NotFoundError, 
    ForbiddenError // เตรียมไว้เผื่อใช้กรณี user ถูกแบน
} from '../utils/errors'; 

export const requestOtpForCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) {
        throw new ValidationError('Phone number is required');
    }

    // สร้างและส่ง OTP (ใน dev จะ log OTP ออกมา)
    const result = await otpService.sendOTP({
      phoneNumber: phone,
      message: 'Your OTP code is: {OTP}. Valid for 5 minutes.',
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: result
    });
  } catch (error) {
    next(error); // โยนให้ Global Error Handler
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      identity_number, first_name, last_name, phone, province_id, district_id,
      address, occupation, income_per_month, other_debt, otp
    } = req.body;

    if (!phone || !otp) {
        throw new ValidationError('ກະລຸນາລະບຸເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
    }

    // Verify OTP ก่อน
    const isValid = await otpService.verifyOTP({
      phoneNumber: phone,
      otp
    });
    
    // สมมติว่า verifyOTP รีเทิร์นค่ากลับมาเป็น boolean (ตามโค้ดเดิมของคุณ)
    if (!isValid) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    const customer = await customerRepo.createCustomer({
      identity_number,
      first_name,
      last_name,
      phone,
      province_id,
      district_id,
      address,
      occupation,
      income_per_month,
      other_debt,
      // user_id: req.user?.id || null, // ถ้ามี auth จาก middleware
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
        throw new BadRequestError('ID ລູກຄ້າບໍ່ຖືກຕ້ອງ');
    }

    const customer = await customerRepo.findCustomerById(Number(id));
    
    if (!customer) {
        throw new NotFoundError('Customer not found');
    }
    
    return res.status(200).json({ 
        success: true, 
        message: 'found customer data', 
        data: customer 
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerBySearch = async (req: Request, res: Response, next: NextFunction) => {
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
      const fullName = `${first_name} ${last_name}`; // 💡 แก้ไข string concatenation ให้ถูกต้อง
      customer = await customerRepo.findCustomersByName(fullName);
    }

    // 3. ຖ້າບໍ່ມີຂໍ້ມູນຫຍັງສົ່ງມາເລີຍ
    if (!phone && (!first_name || !last_name)) {
        throw new BadRequestError('ກະລຸນາລະບຸ ຊື່-ນາມສະກຸນ ຫຼື ເບີໂທລະສັບ');
    }

    // 4. ສົ່ງຜົນລັດ
    if (!customer) {
        throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນລູກຄ້າ');
    }

    return res.status(200).json({ 
        success: true, 
        message: 'ພົບຂໍ້ມູນລູກຄ້າ', 
        data: customer 
    });

  } catch (error) {
    next(error);
  }
};

// 🟢 API ສຳລັບລູກຄ້າທີ່ເຄີຍຂໍສິນເຊື່ອແລ້ວ ແຕ່ຕ້ອງການເຂົ້າລະບົບມາເພື່ອ "ອັບໂຫຼດເອກະສານ"
export const verifyOtpAndGetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new ValidationError('ກະລຸນາປ້ອນເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
    }

    // ตรงนี้ดูจากโค้ดเดิมเหมือน otpService.verifyOTP จะรีเทิร์น object { success, message, data }
    const verificationResult = await otpService.verifyOTP({
      phoneNumber: phone,
      otp
    });

    if (!verificationResult.success) {
        // ใช้ BadRequestError พร้อมส่งข้อมูลจำนวนครั้งที่เหลือกลับไปด้วย
        throw new BadRequestError(verificationResult.message || 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ');
        // หมายเหตุ: หากต้องการส่ง details (เช่น จำนวนครั้ง) แนะนำให้เพิ่ม details parameter ใน BadRequestError ของ utils/errors.ts ด้วย 
        // หรือใช้วิธีส่งผ่าน ValidationError ได้เช่นกัน
    }

    // 2. ຄົ້ນຫາລູກຄ້າໃນຖານຂໍ້ມູນ ດ້ວຍເບີໂທ
    const customer = await db.customers.findOne({ where: { phone } });

    if (!customer) {
        throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນລູກຄ້ານີ້ໃນລະບົບ. ກະລຸນາສະໝັກ ຫຼື ສົ່ງຄຳຂໍສິນເຊື່ອກ່ອນ.');
    }
      
    // 🔥 ด่านอรหันต์: ถ้าลูกค้าคนนี้ถูกระงับการใช้งาน
    // if (customer.is_active === 0) {
    //   throw new ForbiddenError('ບັນຊີລູກຄ້າຖືກລະງັບການນຳໃຊ້');
    // }

    // 3. 🟢 ສ້າງ Token ຂອງລູກຄ້າ ຜ່ານ TokenService
    const token = tokenService.generateCustomerToken(customer.id, customer.phone);

    // 4. ສົ່ງ Token ກັບໄປໃຫ້ Frontend
    return res.status(200).json({
      success: true,
      message: 'ຢືນຢັນ OTP ສຳເລັດ, ໄດ້ຮັບ Token ແລ້ວ',
      data: {
        token: token,
        customer: {
          id: customer.id,
          phone: customer.phone,
          first_name: customer.first_name,
          last_name: customer.last_name
        }
      }
    });

  } catch (error) {
    next(error);
  }
};