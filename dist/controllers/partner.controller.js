"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const partner_repo_1 = __importDefault(require("../repositories/partner.repo"));
// 👉 1. Import Custom Errors ให้ครบ
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const redis_service_1 = __importDefault(require("../services/redis.service")); // 🟢 1. Import Redis
class PartnerController {
    async createShop(req, res, next) {
        try {
            const userId = req.userPayload?.userId;
            if (!userId) {
                throw new errors_1.UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່ (Authentication required)');
            }
            const data = req.body;
            const mapData = {
                user_id: userId,
                shop_id: data.shop_id,
                shop_name: data.shop_name,
                shop_owner: data.shop_owner,
                contact_number: data.contact_number || null,
                province_id: data.province_id || null,
                district_id: data.district_id || null,
                address: data.address,
                shop_logo_url: data.shop_logo_url || null,
                business_type: data.business_type
            };
            const shop = await partner_repo_1.default.createPartner(mapData);
            // 🟢 ล้างแคชรายชื่อ Partner ทิ้งเมื่อมีคนสร้างร้านใหม่
            await redis_service_1.default.delByPattern('cache:partner:*');
            return res.status(201).json({
                success: true,
                message: 'Shop partnership created',
                data: shop // 👉 เปลี่ยนคีย์เป็น data ให้เป็นมาตรฐาน
            });
        }
        catch (error) {
            next(error); // 👉 โยนให้ Global Handler จัดการ
        }
    }
    async getShop(req, res, next) {
        try {
            const userId = req.userPayload?.userId;
            if (!userId) {
                throw new errors_1.UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່ (Authentication required)');
            }
            const cacheKey = `cache:partner:user:${userId}`;
            // 🟢 ดึงจาก Redis ก่อน
            const cachedShop = await redis_service_1.default.get(cacheKey);
            if (cachedShop) {
                return res.status(200).json(JSON.parse(cachedShop));
            }
            const partner = await partner_repo_1.default.findPartnerByUserId(userId);
            if (!partner) {
                throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ');
            }
            // 👉 จัดฟอร์แมต Response ให้เป็นมาตรฐาน { success, message, data }
            const responseData = {
                success: true,
                message: 'ພົບຂໍ້ມູນແລ້ວ',
                data: {
                    id: partner.id,
                    user_id: partner.user_id,
                    shop_name: partner.shop_name,
                    shop_id: partner.shop_id,
                    shop_owner: partner?.shop_owner,
                    contact_number: partner.contact_number,
                    shop_logo_url: partner.shop_logo_url,
                    province_id: partner.province_id,
                    district_id: partner.district_id,
                    address: partner.address,
                    business_type: partner.business_type,
                    is_active: partner.is_active
                }
            };
            // 🟢 เซฟลง Redis (เก็บไว้ 1 วัน)
            await redis_service_1.default.set(cacheKey, JSON.stringify(responseData), 86400);
            return res.status(200).json(responseData);
        }
        catch (error) {
            // ไม่ต้องใส่ res.status(500) แล้ว ให้ next(error) รับจบ และมันจะไป log ให้เอง
            logger_1.logger.error('Error in getShop controller', { error: error.message });
            next(error);
        }
    }
    async updateShop(req, res, next) {
        try {
            const partnerId = parseInt(req.params.id, 10);
            if (isNaN(partnerId))
                throw new errors_1.BadRequestError('ID ຮ້ານຄ້າບໍ່ຖືກຕ້ອງ');
            const updateData = req.body;
            console.log('Received update data:', updateData); // Debug log
            const updatedPartner = await partner_repo_1.default.updatePartner(partnerId, updateData);
            if (!updatedPartner) {
                throw new errors_1.NotFoundError('ບໍ່ພົບຮ້ານຄ້າທີ່ຕ້ອງການອັບເດດ');
            }
            // 🟢 ล้างแคชทั้งหมดเมื่อมีการอัปเดตร้านค้า
            await redis_service_1.default.delByPattern('cache:partner:*');
            return res.status(200).json({
                success: true,
                message: 'ອັບເດດຂໍ້ມູນຮ້ານຄ້າສຳເລັດ',
                data: updatedPartner
            });
        }
        catch (error) {
            logger_1.logger.error('Error in updateShop controller', { error: error.message });
            next(error);
        }
    }
    async getAllShop(req, res, next) {
        try {
            const cacheKey = 'cache:partner:all';
            // 🟢 ดึงรายชื่อจาก Redis
            const cachedAllShop = await redis_service_1.default.get(cacheKey);
            if (cachedAllShop) {
                return res.status(200).json(JSON.parse(cachedAllShop));
            }
            const allShop = await partner_repo_1.default.findAllPartner();
            if (!allShop || allShop.length === 0) {
                // ถ้าไม่มีข้อมูล อาจจะไม่ error ก็ได้ แต่ส่งอาเรย์ว่างกลับไป (หรือจะ throw 404 แบบเดิมก็ได้)
                throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ');
            }
            const responseData = {
                success: true,
                message: 'ພົບຂໍ້ມູນແລ້ວ',
                data: allShop
            };
            // 🟢 เซฟลง Redis (เก็บไว้ 1 วัน)
            await redis_service_1.default.set(cacheKey, JSON.stringify(responseData), 86400);
            return res.status(200).json(responseData);
        }
        catch (error) {
            logger_1.logger.error('Error in getAllShop controller', { error: error.message });
            next(error);
        }
    }
    async changeStatusShop(req, res, next) {
        try {
            const partnerId = parseInt(req.params.id, 10);
            if (isNaN(partnerId) || partnerId <= 0) {
                throw new errors_1.BadRequestError('ID ຮ້ານຄ້າບໍ່ຖືກຕ້ອງ');
            }
            const { is_active } = req.body;
            if (is_active === undefined || is_active === null) {
                throw new errors_1.BadRequestError('ກະລຸນາລະບູສະຖານະ is_active');
            }
            const success = await partner_repo_1.default.SwitchStatusPartner(partnerId, is_active);
            if (!success) {
                throw new errors_1.NotFoundError(is_active === 1 ? 'ບໍ່ພົບຮ້ານຄ້າທີ່ຕ້ອງການເປີດໃຊ້ງານ' : 'ບໍ່ພົບຮ້ານຄ້າທີ່ຕ້ອງການປິດໃຊ້ງານ');
            }
            // 🟢 ล้างแคชทั้งหมดเมื่อมีร้านถูกระงับ/เปิดใช้
            await redis_service_1.default.delByPattern('cache:partner:*');
            return res.status(200).json({
                success: true,
                message: is_active === 1 ? 'ເປີດໃຊ້ງານຮ້ານຄ້າສຳເລັດ' : 'ປິດໃຊ້ງານຮ້ານຄ້າສຳເລັດ'
            });
        }
        catch (error) {
            logger_1.logger.error('Error in changeStatusShop controller', { error: error.message });
            next(error);
        }
    }
}
exports.default = new PartnerController();
