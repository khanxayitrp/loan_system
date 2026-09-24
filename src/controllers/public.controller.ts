// src/controllers/public.controller.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../models/init-models';
import { redisService } from '../services/redis.service'; // 👈 ປ່ຽນ Path ໃຫ້ກົງກັບໄຟລ໌ RedisService ຂອງທ່ານ
import { NotFoundError, BadRequestError } from '../utils/errors';

// 🟢 Tier 1: Public Verification (ໃຊ້ Redis Cache ຕາມມາດຕະຖານ Gem Info.docx)
export const verifyMemberPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { member_code } = req.params;
    if (!member_code) throw new BadRequestError('Invalid Member Code');

    const cacheKey = `member_verify:${member_code}`;

    // 1. ກວດສອບຈາກ Redis Cache ກ່ອນສະເໝີ ເພື່ອຄວາມໄວສູງສຸດ
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // 2. ຖ້າ Cache Miss, ດຶງຂໍ້ມູນຈາກ Database
    const customer = await db.customers.findOne({
      where: { member_code: member_code },
      attributes: ['member_code', 'first_name', 'last_name', 'profile_image_url', 'kyc_status']
    });

    if (!customer) {
      throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນບັດສະມາຊິກນີ້ໃນລະບົບ');
    }

    // 3. Masking ຂໍ້ມູນ (ເຊື່ອງນາມສະກຸນ ເພື່ອຄວາມປອດໄພຂອງ Privacy)
    const maskedLastName = customer.last_name ? `${customer.last_name.substring(0, 2)}***` : '';

    const responseData = {
      success: true,
      data: {
        member_code: customer.member_code,
        first_name: customer.first_name,
        last_name: maskedLastName,
        profile_image_url: customer.profile_image_url,
        kyc_status: customer.kyc_status,
      }
    };

    // 4. ບັນທຶກລົງ Redis Cache (ກຳນົດ TTL = 3600 ວິນາທີ) 
    // 🌟 ຮຽກໃຊ້ Method set ຕາມ Signature: set(key, value, ttlSeconds)
    await redisService.set(cacheKey, JSON.stringify(responseData), 3600);

    return res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// 🟢 Tier 2: Unlock Financial Data (ດຶງສົດຈາກ DB ສະເໝີ ບໍ່ໃຊ້ Cache)
export const unlockMemberCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { member_code, phone_last_4 } = req.body;
    if (!member_code || !phone_last_4) throw new BadRequestError('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ');

    const customer = await db.customers.findOne({
      where: { member_code: member_code },
      attributes: ['id', 'phone', 'card_expire_at'],
      include: [{ model: db.customer_credits, as: 'customer_credit', attributes: ['available_balance'] }]
    });

    if (!customer) throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນບັດສະມາຊິກນີ້ໃນລະບົບ');

    // 1. ກວດສອບເບີໂທລະສັບ 4 ຕົວທ້າຍ
    const dbPhoneLast4 = customer.phone ? customer.phone.slice(-4) : '';
    if (dbPhoneLast4 !== phone_last_4) {
      throw new BadRequestError('ເບີໂທລະສັບ 4 ຕົວທ້າຍບໍ່ຖືກຕ້ອງ');
    }

    // 2. ສົ່ງຂໍ້ມູນການເງິນກັບໄປ
    return res.status(200).json({
      success: true,
      data: {
        card_expire_at: customer.card_expire_at,
        available_balance: customer.customer_credit?.available_balance || 0
      }
    });
  } catch (error) {
    next(error);
  }
};