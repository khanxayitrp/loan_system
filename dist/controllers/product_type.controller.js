"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const product_type_repo_1 = __importDefault(require("../repositories/product_type.repo"));
const logger_1 = require("../utils/logger");
const redis_service_1 = __importDefault(require("../services/redis.service")); // 🟢 Import Redis
class ProductTypeController {
    static validateQueryParams(query) {
        const errors = [];
        if (query.limit && (isNaN(Number(query.limit)) || Number(query.limit) < 1)) {
            errors.push('Limit must be a positive number');
        }
        if (query.page && (isNaN(Number(query.page)) || Number(query.page) < 1)) {
            errors.push('Page must be a positive number');
        }
        if (query.getAllData && !['true', 'false'].includes(query.getAllData)) {
            errors.push('getAllData must be true or false');
        }
        return errors;
    }
    async createProductType(req, res) {
        try {
            if (!req.userPayload) {
                console.log('[CONTROLLER] No userPayload found - unauthenticated request');
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່'
                });
            }
            const userId = req.userPayload?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ' });
            }
            const data = req.body;
            const mapData = {
                partner_id: userId,
                type_name: data.type_name,
                description: data.description || null,
                is_active: data.is_active
            };
            const newProductType = await product_type_repo_1.default.createProductType(mapData);
            // 🟢 ລ້າງແຄຊປະເພດສິນຄ້າທັງໝົດ
            await redis_service_1.default.delByPattern('cache:product_types:*');
            return res.status(201).json({ message: 'ສ້າງປະເພດສິນຄ້າສຳເລັດ', data: newProductType });
        }
        catch (error) {
            logger_1.logger.error('Error in createProductType controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງປະເພດສິນຄ້າ', error: error.message });
        }
    }
    async getAllProducttypes(req, res) {
        try {
            const { searchText, limit, page, getAllData } = req.query;
            //Validate parameters 
            const validationErrors = ProductTypeController.validateQueryParams(req.query);
            if (validationErrors.length > 0) {
                res.status(400).json({ message: 'Invalid query parameters', validationErrors });
                return;
            }
            const options = {
                search: searchText,
                limit: Number(limit),
                page: Number(page),
                getAllData: getAllData === 'true'
            };
            // 🟢 1. ກຳນົດ Cache Key ສຳລັບລາຍການປະເພດສິນຄ້າ
            const cacheKey = `cache:product_types:list:${JSON.stringify(options)}`;
            // 🟢 2. ກວດສອບ Redis ກ່ອນ
            const cachedProductTypes = await redis_service_1.default.get(cacheKey);
            if (cachedProductTypes) {
                return res.status(200).json({ productTypes: JSON.parse(cachedProductTypes) });
            }
            const productType = await product_type_repo_1.default.findAllActiveProductTypes(options);
            // 🟢 3. ເຊບລົງ Redis (ອາຍຸ 1 ຊົ່ວໂມງ)
            await redis_service_1.default.set(cacheKey, JSON.stringify(productType), 3600);
            return res.status(200).json({ productTypes: productType });
        }
        catch (error) {
            logger_1.logger.error('Error in getAllProducttypes controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງປະເພດສິນຄ້າ', error: error.message });
        }
    }
    async getProductTypeById(req, res) {
        try {
            const productTypeId = parseInt(req.params.id, 10);
            const cacheKey = `cache:product_types:detail:${productTypeId}`;
            // 🟢 ກວດສອບ Redis
            const cachedType = await redis_service_1.default.get(cacheKey);
            if (cachedType) {
                return res.status(200).json({ productTypes: JSON.parse(cachedType) });
            }
            const productType = await product_type_repo_1.default.findProductTypeById(productTypeId);
            // 🟢 ເຊບລົງ Redis
            if (productType) {
                await redis_service_1.default.set(cacheKey, JSON.stringify(productType), 3600);
            }
            return res.status(200).json({ productTypes: productType });
        }
        catch (error) {
            logger_1.logger.error('Error in getProductTypeById controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງປະເພດສິນຄ້າ', error: error.message });
        }
    }
    async updateProductType(req, res) {
        try {
            const productTypeId = parseInt(req.params.id, 10);
            const partnerId = req.userPayload?.userId;
            const data = req.body;
            const updatedProductType = await product_type_repo_1.default.updateProductType(productTypeId, partnerId, data);
            // 🟢 ລ້າງແຄຊ
            await redis_service_1.default.delByPattern('cache:product_types:*');
            // 💡 ເນື່ອງຈາກການແກ້ໄຂ "ປະເພດສິນຄ້າ" ອາດສົ່ງຜົນກະທົບຕໍ່ໜ້າລາຍຊື່ສິນຄ້າ (ຊື່ປະເພດປ່ຽນ) ຄວນລ້າງແຄຊ products ນຳ
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(200).json({ message: 'อัปเดตประเภทสินค้าเรียบร้อย', data: updatedProductType });
        }
        catch (error) {
            logger_1.logger.error('Error in updateProductType controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตประเภทสินค้า', error: error.message });
        }
    }
    async deActivatedProductType(req, res) {
        try {
            const productTypeId = parseInt(req.params.id, 10);
            console.log('productTypeId is :', productTypeId);
            const partnerId = req.userPayload?.userId;
            const updatedProductType = await product_type_repo_1.default.deleteProductType(productTypeId, partnerId);
            // 🟢 ລ້າງແຄຊ
            await redis_service_1.default.delByPattern('cache:product_types:*');
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(200).json({ message: 'ปิดใช้งานประเภทสินค้าเรียบร้อย', productType: updatedProductType });
        }
        catch (error) {
            logger_1.logger.error('Error in deActivatedProductType controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปิดใช้งานประเภทสินค้า', error: error.message });
        }
    }
}
exports.default = new ProductTypeController();
