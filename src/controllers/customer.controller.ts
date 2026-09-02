import { Request, Response, NextFunction } from 'express';
import customerRepo from '../repositories/customer.repo'; // ปรับ path ตาม project
import { otpService } from '../services/otp.service';
import { db } from '../models/init-models';
import tokenService from '../services/token.service';
import fileUploadService from '../services/fileUpload.service';
import { FILE_UPLOAD_CONFIG } from '../types/file.types';
import { KycStatus } from '../types/customer.types';

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
      account_number,
      date_of_birth, // 🟢 ຮັບຄ່າ ວັນເດືອນປີເກີດ
      gender // 🟢 ຮັບຄ່າ ເພດ
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

    // 1. ຄຳນວນອາຍຸ (Age) ຈາກ date_of_birth ຖ້າມີການສົ່ງມາ
    let calculatedAge = 0;
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      const today = new Date();
      calculatedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        calculatedAge--;
      }
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
      date_of_birth: date_of_birth || null, // 🟢 ບັນທຶກວັນເດືອນປີເກີດ
      gender: gender || null,               // 🟢 ບັນທຶກເພດ
      age: calculatedAge > 0 ? calculatedAge : 0, // 🟢 ບັນທຶກອາຍຸ
      income_per_month: income_per_month ? Number(income_per_month) : undefined,
      other_debt: other_debt ? Number(other_debt) : undefined,
      profile_image_url: profile_image_url!,
      account_number: account_number || null,
      kyc_status: 'unverified' // ຕັ້ງຄ່າເບື້ອງຕົ້ນ
      // user_id: req.user?.id || null, 
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
// 🟢 ອັບເດດຂໍ້ມູນລູກຄ້າ
export const updateCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null;

  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      throw new BadRequestError('ID ລູກຄ້າບໍ່ຖືກຕ້ອງ');
    }

    const file = req.file; // ຮັບຮູບໃໝ່ຖ້າມີການອັບເດດ
    const updateData = { ...req.body };

    // 1. ຄຳນວນອາຍຸ (Age) ຈາກ date_of_birth ອັດຕະໂນມັດຖ້າມີການແກ້ໄຂ
    if (updateData.date_of_birth) {
      const dob = new Date(updateData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      updateData.age = age > 0 ? age : 0;
    }

    // 2. ຈັດການຮູບໂປຣໄຟລ໌ໃໝ່ (ຖ້າມີການອັບໂຫຼດ)
    if (file) {
      const uploadResult = await fileUploadService.uploadSingleFile(
        file,
        FILE_UPLOAD_CONFIG.PROFILE_IMAGES,
        'profile'
      );
      if (uploadResult.success && uploadResult.fileUrl) {
        updateData.profile_image_url = uploadResult.fileUrl;
        uploadedObjectKey = uploadResult.filePath || null;
      }
    }

    // 3. ແປງປະເພດຂໍ້ມູນໃຫ້ຖືກຕ້ອງ
    if (updateData.income_per_month !== undefined) updateData.income_per_month = Number(updateData.income_per_month);
    if (updateData.other_debt !== undefined) updateData.other_debt = Number(updateData.other_debt);

    // 4. ເອີ້ນໃຊ້ Repository ເພື່ອບັນທຶກ
    const updatedCustomer = await customerRepo.updateCustomer(Number(id), updateData);

    if (!updatedCustomer) {
      throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນລູກຄ້າທີ່ຕ້ອງການແກ້ໄຂ');
    }

    return res.status(200).json({
      success: true,
      message: 'ອັບເດດຂໍ້ມູນສຳເລັດແລ້ວ',
      data: updatedCustomer
    });

  } catch (error) {
    if (uploadedObjectKey) {
      await fileUploadService.deleteFile(uploadedObjectKey).catch(e => console.error(e));
    }
    next(error);
  }
};

// 🟢 ດຶງຂໍ້ມູນສະມາຊິກທັງໝົດດ້ວຍ Cursor Pagination
export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, startDate, endDate, cursor, limit = 50 } = req.query;

    const limitNumber = Number(limit);
    const cursorNumber = cursor ? Number(cursor) : undefined; // ແປງ cursor ເປັນຕົວເລກ

    const result = await customerRepo.findAllCustomers(
      {
        search: search as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string
      },
      { limit: limitNumber, cursor: cursorNumber }
    );

    // 🌟 ຫາຄ່າ Cursor ສຳລັບໜ້າຖັດໄປ (ດຶງ ID ຂອງລາຍການສຸດທ້າຍໃນ Array)
    const lastItem = result.rows[result.rows.length - 1];
    const nextCursor = lastItem ? lastItem.id : null;
    const hasNextPage = result.rows.length === limitNumber; // ຖ້າດຶງມາໄດ້ເທົ່າກັບ limit ສະແດງວ່າຍັງມີໜ້າຖັດໄປ

    return res.status(200).json({
      success: true,
      message: 'ດຶງຂໍ້ມູນສະມາຊິກສຳເລັດ',
      data: result.rows,
      meta: {
        total: result.count,
        limit: limitNumber,
        nextCursor: hasNextPage ? nextCursor : null, // ຖ້າບໍ່ມີໜ້າຖັດໄປ ໃຫ້ເປັນ null
        hasNextPage: hasNextPage
      }
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

// 🟢 อัปเดตสถานะ KYC (รองรับทั้ง Array และ Single ID)
export const updateKycStatus = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await db.sequelize.transaction();
  try {
    let { customer_ids, status } = req.body;

    if (!customer_ids || !status) {
      throw new ValidationError('ກະລຸນາລະບຸ customer_ids ແລະ status (Customer IDs and status are required)');
    }

    // 1. ตรวจสอบและแปลงให้เป็น Array เสมอ
    if (!Array.isArray(customer_ids)) {
      customer_ids = [customer_ids];
    }

    const ids = customer_ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));

    if (ids.length === 0) {
      throw new ValidationError('ID ລູກຄ້າບໍ່ຖືກຕ້ອງ (Invalid Customer IDs)');
    }

    if (ids.length > 100) {
      throw new BadRequestError('ສາມາດອັບເດດໄດ້ສູງສຸດ 100 ລາຍການຕໍ່ຄັ້ງ (Max 100 items per request)');
    }

    // 2. ตรวจสอบสถานะปลายทางที่อนุญาต
    const validStatuses: KycStatus[] = ['verified', 'rejected', 'expired'];
    if (!validStatuses.includes(status as KycStatus)) {
      throw new ValidationError('ສະຖານະບໍ່ຖືກຕ້ອງ (Invalid target status)');
    }

    // 🟢 2. Explicitly cast the validated string to our strict type
    const validatedStatus = status as KycStatus;
    // ดึง User ID ของพนักงานที่กดอัปเดต (สมมติว่าดึงจาก req.user ที่ได้จาก verifyToken)
    const performedBy = req.userPayload?.userId || 1;

    // 3. เรียกใช้ Repo ภายใต้ Transaction
    const updatedCustomers = await customerRepo.updateKycStatuses(ids, validatedStatus, performedBy, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'ອັບເດດສະຖານະ KYC ສຳເລັດແລ້ວ',
      data: updatedCustomers
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};