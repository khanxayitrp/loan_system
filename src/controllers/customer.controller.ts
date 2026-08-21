import { Request, Response, NextFunction } from 'express';
import customerRepo from '../repositories/customer.repo'; // ปรับ path ตาม project
import { otpService } from '../services/otp.service';
import { db } from '../models/init-models';
import tokenService from '../services/token.service';
import fileUploadService from '../services/fileUpload.service';
import { FILE_UPLOAD_CONFIG } from '../types/file.types';

// 👉 Import Custom Errors
import { 
    ValidationError, 
    BadRequestError, 
    NotFoundError, 
    ForbiddenError
} from '../utils/errors'; 
import { formatStandardPhoneNumber } from '../utils/formatters';
import { Transaction } from 'sequelize';

export const requestOtpForCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) {
        throw new ValidationError('Phone number is required');
    }

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
    next(error); 
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null; // 🌟 เก็บ Key ไว้ลบไฟล์กรณี Error (Rollback)

  try {
    // ⚠️ ເມື່ອເປັນ multipart/form-data ຂໍ້ມູນທຸກຢ່າງໃນ req.body ຈະເປັນ String
    const {
      identity_number, first_name, last_name, phone, province_id, district_id,
      address, occupation, income_per_month, other_debt, otp,
      account_number
    } = req.body;

    const file = req.file; // 🌟 ຮັບໄຟລ໌ຮູບຈາກ Multer Middleware

    if (!phone || !otp) {
        throw new ValidationError('ກະລຸນາລະບຸເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
    }

    // 1. ຢືນຢັນ OTP ກ່ອນອັບໂຫຼດຮູບ (ປ້ອງກັນການອັບໂຫຼດຖ້າ OTP ຜິດ)
    const isValid = await otpService.verifyOTP({ phoneNumber: phone, otp });
    
    if (!isValid) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    // 2. ອັບໂຫຼດຮູບໂປຣໄຟລ໌ (ຖ້າມີ)
    let profile_image_url: string | null = null;
    if (file) {
        const uploadResult = await fileUploadService.uploadSingleFile(
            file, 
            FILE_UPLOAD_CONFIG.PROFILE_IMAGES, // 🌟 ອ້າງອີງ Config ທີ່ສ້າງໃໝ່
            'profile'
        );
        if (uploadResult.success && uploadResult.fileUrl) {
            profile_image_url = uploadResult.fileUrl;
            uploadedObjectKey = uploadResult.filePath || null; // ເກັບ Key ໄວ້
        }
    }

    // 3. ບັນທຶກຂໍ້ມູນລົງ Database
    const customer = await customerRepo.createCustomer({
      identity_number,
      first_name,
      last_name,
      phone,
      province_id,
      district_id,
      address,
      occupation,
      income_per_month: income_per_month ? Number(income_per_month) : undefined, // ແປງເປັນ Number
      other_debt: other_debt ? Number(other_debt) : undefined, // ແປງເປັນ Number
      profile_image_url: profile_image_url!,
      account_number: account_number || null,
      // user_id: req.user?.id || null, // ຖ້າມີ auth ຈາກ middleware
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    // 🌟 4. Rollback: ລຶບຮູບຖິ້ມ ຖ້າບັນທຶກ DB ບໍ່ສຳເລັດ
    if (uploadedObjectKey) {
        console.warn(`[Rollback] Deleting orphan file: ${uploadedObjectKey}`);
        await fileUploadService.deleteFile(uploadedObjectKey).catch(e => console.error(e));
    }
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

    let customer = null;

    if (phone && typeof phone === 'string') {
      customer = await customerRepo.findCustomersByPhone(phone);
    }

    if (!customer && first_name && last_name) {
      const fullName = `${first_name} ${last_name}`; 
      customer = await customerRepo.findCustomersByName(fullName);
    }

    if (!phone && (!first_name || !last_name)) {
        throw new BadRequestError('ກະລຸນາລະບຸ ຊື່-ນາມສະກຸນ ຫຼື ເບີໂທລະສັບ');
    }

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

export const verifyOtpAndGetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new ValidationError('ກະລຸນາປ້ອນເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
    }

    const verificationResult = await otpService.verifyOTP({ phoneNumber: phone, otp });

    if (!verificationResult.success) {
        throw new BadRequestError(verificationResult.message || 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ');
    }

    const standardPhone = formatStandardPhoneNumber(phone);
    
    const customer = await customerRepo.findCustomersByPhone(standardPhone);

    if (!customer) {
        throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນລູກຄ້ານີ້ໃນລະບົບ. ກະລຸນາສະໝັກ ຫຼື ສົ່ງຄຳຂໍສິນເຊື່ອກ່ອນ.');
    }

    const token = tokenService.generateCustomerToken(customer.id, customer.phone);

    return res.status(200).json({
      success: true,
      message: 'ຢືນຢັນ OTP ສຳເລັດ, ໄດ້ຮັບ Token ແລ້ວ',
      data: {
        token: token,
        customer: {
          id: customer.id,
          phone: customer.phone,
          first_name: customer.first_name,
          last_name: customer.last_name,
          profile_image_url: customer.profile_image_url, // 🌟 ສົ່ງຮູບກັບໄປໃຫ້ແອັບ
          account_number: customer.account_number, // 🌟 ບັນຊີທະນາຄານ
          membership: customer.membership_tier ? {
              tier_name: customer.membership_tier.tier_name,
              score: customer.membership_score
          } : null,
          credit_limits: customer.customer_credit ? {
              total_limit: customer.customer_credit.credit_limit,
              available_balance: customer.customer_credit.available_balance,
              cash_advance_limit: customer.customer_credit.cash_advance_limit,
              used_cash_advance: customer.customer_credit.used_cash_advance
          } : null
        }
      }
    });

  } catch (error) {
    next(error);
  }
};