import { Request, Response, NextFunction } from 'express';
import { membershipOriginationService } from '../services/membership-origination.service';
import membershipAppRepo from '../repositories/membership-application.repo';
import redisService from '../services/redis.service';
import fileUploadService from '../services/fileUpload.service';
import { FILE_UPLOAD_CONFIG } from '../types/file.types';
import { BadRequestError, ValidationError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { otpService } from '../services/otp.service';

// 🟢 1. สำหรับพนักงาน (Back-Office)
export const applyFromStaff = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null;
  try {
    const data = req.body;
    const file = req.file;
    const performedBy = req.userPayload?.userId || 1;

    if (data.credit_check_consent !== 'true' || data.data_accuracy_confirmation !== 'true') {
      throw new BadRequestError('ກະລຸນາຍອມຮັບເງື່ອນໄຂການກວດສອບເຄຣດິດ (Consent required)');
    }

    let profileImageUrl: string | null = null;
    if (file) {
      const uploadResult = await fileUploadService.uploadSingleFile(file, FILE_UPLOAD_CONFIG.PROFILE_IMAGES, 'profile');
      if (uploadResult.success && uploadResult.fileUrl) {
        profileImageUrl = uploadResult.fileUrl;
        uploadedObjectKey = uploadResult.filePath || null;
      }
    }

    const result = await membershipOriginationService.submitApplication({
      customerId: data.customer_id ? Number(data.customer_id) : undefined,
      customerData: data,
      workData: data,
      creditRequestData: data,
      profileImageUrl: profileImageUrl,
      performedBy: performedBy,
      source: 'STAFF'
    });

    res.status(201).json({ success: true, message: 'ພະນັກງານຍື່ນຄຳຮ້ອງສະໝັກສຳເລັດແລ້ວ', data: result });
  } catch (error) {
    if (uploadedObjectKey) await fileUploadService.deleteFile(uploadedObjectKey).catch(() => {});
    next(error);
  }
};

// 🟢 2. สำหรับลูกค้า Public Web (ไม่มี Login, ต้องยืนยัน OTP)
export const applyFromPublicWeb = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null;
  try {
    const data = req.body;
    const file = req.file;

    // ตรวจสอบ OTP
    if (!data.phone || !data.otp) {
      throw new ValidationError('ກະລຸນາປ້ອນເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
    }

    const verificationResult = await otpService.verifyOTP({ phoneNumber: data.phone, otp: data.otp });
    if (!verificationResult.success) {
      throw new BadRequestError(verificationResult.message || 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ');
    }

    if (data.credit_check_consent !== 'true' || data.data_accuracy_confirmation !== 'true') {
      throw new BadRequestError('ກະລຸນາຍອມຮັບເງື່ອນໄຂ (Consent required)');
    }

    let profileImageUrl: string | null = null;
    if (file) {
      const uploadResult = await fileUploadService.uploadSingleFile(file, FILE_UPLOAD_CONFIG.PROFILE_IMAGES, 'profile');
      if (uploadResult.success && uploadResult.fileUrl) {
        profileImageUrl = uploadResult.fileUrl;
        uploadedObjectKey = uploadResult.filePath || null;
      }
    }

    const result = await membershipOriginationService.submitApplication({
      customerId: undefined, // ให้ระบบไปค้นหาจากเบอร์โทรเอง
      customerData: data,
      workData: data,
      creditRequestData: data,
      profileImageUrl: profileImageUrl,
      performedBy: 1, // System Default (หรือเก็บ Null ถ้าแก้ DB ให้รองรับ)
      source: 'PUBLIC_WEB'
    });

    res.status(201).json({ success: true, message: 'ຍື່ນຄຳຮ້ອງສະໝັກສຳເລັດແລ້ວ', data: result });
  } catch (error) {
    if (uploadedObjectKey) await fileUploadService.deleteFile(uploadedObjectKey).catch(() => {});
    next(error);
  }
};

// 🟢 3. สำหรับลูกค้า Super App (Login มี Token)
export const applyFromSuperApp = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null;
  try {
    const data = req.body;
    const file = req.file;
    
    // 🛡️ บังคับใช้ Customer ID จาก Token
    const customerId = req.customerPayload?.userId; 
    if (!customerId) throw new UnauthorizedError('Unauthorized: Token missing customer data');

    if (data.credit_check_consent !== 'true' || data.data_accuracy_confirmation !== 'true') {
      throw new BadRequestError('ກະລຸນາຍອມຮັບເງື່ອນໄຂ (Consent required)');
    }

    let profileImageUrl: string | null = null;
    if (file) {
      const uploadResult = await fileUploadService.uploadSingleFile(file, FILE_UPLOAD_CONFIG.PROFILE_IMAGES, 'profile');
      if (uploadResult.success && uploadResult.fileUrl) {
        profileImageUrl = uploadResult.fileUrl;
        uploadedObjectKey = uploadResult.filePath || null;
      }
    }

    const result = await membershipOriginationService.submitApplication({
      customerId: customerId, // 🛡️ ล็อกตายว่าเป็นของคนนี้เท่านั้น
      customerData: data,
      workData: data,
      creditRequestData: data,
      profileImageUrl: profileImageUrl,
      performedBy: customerId, // ให้ Customer ID เป็น Actor
      source: 'SUPER_APP'
    });

    res.status(201).json({ success: true, message: 'ຍື່ນຄຳຮ້ອງສະໝັກສຳເລັດແລ້ວ', data: result });
  } catch (error) {
    if (uploadedObjectKey) await fileUploadService.deleteFile(uploadedObjectKey).catch(() => {});
    next(error);
  }
};

// 🟢 4. ດຶງຂໍ້ມູນໃບຄຳຂໍທັງໝົດສຳລັບໜ້າລາຍການ (List View)
export const getAllApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, cursor, limit = 25 } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const cursorVal = cursor ? Number(cursor) : undefined;

    // ສ້າງ Cache Key ທີ່ບໍ່ຊ້ຳກັນຕາມ Parameter[cite: 10]
    const cacheKey = `membership_applications:list:search=${search||''}:status=${status||''}:limit=${limitNum}:cursor=${cursorVal||''}`;
    
    // 🌟 ກວດສອບ Redis Cache ກ່ອນ
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const result = await membershipAppRepo.findAllApplications(
      { search: search as string, status: status as string },
      { limit: limitNum, cursor: cursorVal }
    );

    const lastItem = result.rows[result.rows.length - 1];
    const nextCursor = lastItem ? lastItem.id : null;
    const hasNextPage = result.rows.length === limitNum;

    const responsePayload = {
      success: true,
      message: 'ດຶງຂໍ້ມູນຄຳຮ້ອງຂໍສຳເລັດແລ້ວ',
      data: result.rows,
      meta: {
        total: result.count,
        limit: limitNum,
        nextCursor: hasNextPage ? nextCursor : null,
        hasNextPage: hasNextPage
      }
    };

    // 🌟 ບັນທຶກລົງ Redis Cache (15 ນາທີ)[cite: 10]
    await redisService.set(cacheKey, JSON.stringify(responsePayload), 900);

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// 🟢 5. ດຶງລາຍລະອຽດໃບຄຳຂໍ (Detail View)
export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cacheKey = `membership_applications:detail:${id}`;

    // 🌟 ກວດສອບ Redis Cache ກ່ອນ[cite: 10]
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const application = await membershipAppRepo.findApplicationById(Number(id));

    if (!application) {
      throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນຄຳຮ້ອງຂໍ (Application not found)');
    }

    const responsePayload = {
      success: true,
      message: 'ດຶງລາຍລະອຽດຄຳຮ້ອງຂໍສຳເລັດ',
      data: application
    };

    await redisService.set(cacheKey, JSON.stringify(responsePayload), 900);

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// 🟢 6. ดึงข้อมูลคำขอล่าสุดด้วย Customer ID
export const getLatestApplicationByCustomerId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const cacheKey = `membership_applications:customer_latest:${customerId}`;

    // 🌟 ກວດສອບ Redis Cache ກ່ອນ[cite: 10]
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const application = await membershipAppRepo.findLatestApplicationByCustomerId(Number(customerId));

    if (!application) {
      throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນຄຳຮ້ອງຂໍສຳລັບລູກຄ້າຄົນນີ້ (No application found for this customer)');
    }

    const responsePayload = {
      success: true,
      message: 'ດຶງລາຍລະອຽດຄຳຮ້ອງຂໍສຳເລັດ',
      data: application
    };

    // 🌟 ເກັບລົງ Cache 15 ນາທີ[cite: 10]
    await redisService.set(cacheKey, JSON.stringify(responsePayload), 900);

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// 🟢 ດຶງຂໍ້ມູນ Profile/Application ຫຼ້າສຸດຂອງຕົນເອງ (ສຳລັບ Super App)
export const getMyLatestApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerPayload?.userId; // 🌟 ແກະຈາກ Token
    if (!customerId) throw new UnauthorizedError('Unauthorized: Token missing customer data');

    const application = await membershipAppRepo.findLatestApplicationByCustomerId(customerId);

    if (!application) {
      throw new NotFoundError('ທ່ານຍັງບໍ່ມີຂໍ້ມູນຄຳຮ້ອງຂໍສະໝັກສະມາຊິກ');
    }

    return res.status(200).json({
      success: true,
      message: 'ດຶງລາຍລະອຽດສຳເລັດ',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// 🟢 7.1 ອັບເດດຄຳຮ້ອງຂໍ (ສຳລັບພະນັກງານ - Staff)
export const updateApplicationFromStaff = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null;
  try {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;
    const performedBy = req.userPayload?.userId || 1;

    if (!id || isNaN(Number(id))) throw new BadRequestError('ID ໃບຄຳຂໍບໍ່ຖືກຕ້ອງ');

    let profileImageUrl: string | null = null;
    if (file) {
      const uploadResult = await fileUploadService.uploadSingleFile(file, FILE_UPLOAD_CONFIG.PROFILE_IMAGES, 'profile');
      if (uploadResult.success && uploadResult.fileUrl) {
        profileImageUrl = uploadResult.fileUrl;
        uploadedObjectKey = uploadResult.filePath || null;
      }
    }

    const updatedApp = await membershipOriginationService.updateApplication(Number(id), {
      customerData: data,
      workData: data,
      creditRequestData: data,
      profileImageUrl: profileImageUrl,
      performedBy: performedBy,
      source: 'STAFF' // 🌟
    });

    return res.status(200).json({ success: true, message: 'ອັບເດດຂໍ້ມູນສຳເລັດ', data: updatedApp });
  } catch (error) {
    if (uploadedObjectKey) await fileUploadService.deleteFile(uploadedObjectKey).catch(() => {});
    next(error);
  }
};

// 🟢 7.2 ອັບເດດຄຳຮ້ອງຂໍ (ສຳລັບ Public Web ຕ້ອງໃຊ້ OTP)
export const updateApplicationFromPublicWeb = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null;
  try {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;

    if (!id || isNaN(Number(id))) throw new BadRequestError('ID ໃບຄຳຂໍບໍ່ຖືກຕ້ອງ');
    if (!data.phone || !data.otp) throw new ValidationError('ກະລຸນາປ້ອນເບີໂທລະສັບ ແລະ ລະຫັດ OTP');

    const verificationResult = await otpService.verifyOTP({ phoneNumber: data.phone, otp: data.otp });
    if (!verificationResult.success) throw new BadRequestError(verificationResult.message || 'OTP ບໍ່ຖືກຕ້ອງ');

    let profileImageUrl: string | null = null;
    if (file) {
      const uploadResult = await fileUploadService.uploadSingleFile(file, FILE_UPLOAD_CONFIG.PROFILE_IMAGES, 'profile');
      if (uploadResult.success && uploadResult.fileUrl) {
        profileImageUrl = uploadResult.fileUrl;
        uploadedObjectKey = uploadResult.filePath || null;
      }
    }

    const updatedApp = await membershipOriginationService.updateApplication(Number(id), {
      customerData: data,
      workData: data,
      creditRequestData: data,
      profileImageUrl: profileImageUrl,
      performedBy: 1, // System Default
      source: 'PUBLIC_WEB' // 🌟
    });

    return res.status(200).json({ success: true, message: 'ອັບເດດຂໍ້ມູນສຳເລັດ', data: updatedApp });
  } catch (error) {
    if (uploadedObjectKey) await fileUploadService.deleteFile(uploadedObjectKey).catch(() => {});
    next(error);
  }
};

// 🟢 7.3 ອັບເດດຄຳຮ້ອງຂໍ (ສຳລັບ Super App)
export const updateApplicationFromSuperApp = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedObjectKey: string | null = null;
  try {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;
    const customerId = req.customerPayload?.userId; 

    if (!id || isNaN(Number(id))) throw new BadRequestError('ID ໃບຄຳຂໍບໍ່ຖືກຕ້ອງ');
    if (!customerId) throw new UnauthorizedError('Unauthorized: Token missing customer data');

    let profileImageUrl: string | null = null;
    if (file) {
      const uploadResult = await fileUploadService.uploadSingleFile(file, FILE_UPLOAD_CONFIG.PROFILE_IMAGES, 'profile');
      if (uploadResult.success && uploadResult.fileUrl) {
        profileImageUrl = uploadResult.fileUrl;
        uploadedObjectKey = uploadResult.filePath || null;
      }
    }

    const updatedApp = await membershipOriginationService.updateApplication(Number(id), {
      customerData: data,
      workData: data,
      creditRequestData: data,
      profileImageUrl: profileImageUrl,
      performedBy: customerId, // 🌟 ໃຊ້ Customer ID ໃນການຢືນຢັນສິດ
      source: 'SUPER_APP' // 🌟
    });

    return res.status(200).json({ success: true, message: 'ອັບເດດຂໍ້ມູນສຳເລັດ', data: updatedApp });
  } catch (error) {
    if (uploadedObjectKey) await fileUploadService.deleteFile(uploadedObjectKey).catch(() => {});
    next(error);
  }
};