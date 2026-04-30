"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provinceDistrictController = void 0;
const province_district_service_1 = require("../services/province_district.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const redis_service_1 = __importDefault(require("../services/redis.service"));
class ProvinceDistrictController {
    async getAllProvince(req, res, next) {
        try {
            const cacheKey = 'all_provinces';
            const cachedProvinces = await redis_service_1.default.get(cacheKey);
            if (cachedProvinces) {
                logger_1.logger.info('Provinces fetched from cache');
                return res.status(200).json(JSON.parse(cachedProvinces));
            }
            const provinces = await province_district_service_1.provinceDistrictService.getAllProvince();
            await redis_service_1.default.set(cacheKey, JSON.stringify(provinces), 3600);
            logger_1.logger.info('Provinces fetched from database and cached');
            return res.status(200).json(provinces);
        }
        catch (error) {
            logger_1.logger.error("Error in getAllProvince:", error);
            next(error);
        }
    }
    async getAllDistrictByProvinceId(req, res, next) {
        try {
            const provinceId = req.params.provinceId;
            if (!provinceId || provinceId.trim() === '') {
                throw new errors_1.BadRequestError('provinceId ບໍ່ຖືກຕ້ອງ');
            }
            const cacheKey = `districts_province_${provinceId}`;
            const cachedDistricts = await redis_service_1.default.get(cacheKey);
            if (cachedDistricts) {
                logger_1.logger.info(`Districts for province ${provinceId} fetched from cache`);
                return res.status(200).json(JSON.parse(cachedDistricts));
            }
            const districts = await province_district_service_1.provinceDistrictService.getAllDistrictByProvinceId(provinceId);
            await redis_service_1.default.set(cacheKey, JSON.stringify(districts), 3600);
            logger_1.logger.info(`Districts for province ${provinceId} fetched from database and cached`);
            return res.status(200).json(districts);
        }
        catch (error) {
            logger_1.logger.error("Error in getAllDistrictByProvinceId:", error);
            next(error);
        }
    }
    async getProvinceById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (!id || isNaN(id)) {
                throw new errors_1.BadRequestError('id ບໍ່ຖືກຕ້ອງ');
            }
            const province = await province_district_service_1.provinceDistrictService.getProvinceById(id);
            if (!province) {
                return res.status(404).json({ success: false, message: 'Province not found' });
            }
            return res.status(200).json(province);
        }
        catch (error) {
            logger_1.logger.error("Error in getProvinceById:", error);
            next(error);
        }
    }
    async getDistrictById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (!id || isNaN(id)) {
                throw new errors_1.BadRequestError('id ບໍ່ຖືກຕ້ອງ');
            }
            const district = await province_district_service_1.provinceDistrictService.getDistrictById(id);
            if (!district) {
                return res.status(404).json({ success: false, message: 'District not found' });
            }
            return res.status(200).json(district);
        }
        catch (error) {
            logger_1.logger.error("Error in getDistrictById:", error);
            next(error);
        }
    }
}
exports.provinceDistrictController = new ProvinceDistrictController();
