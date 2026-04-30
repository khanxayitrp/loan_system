"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provinceDistrictService = void 0;
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
class ProvinceDistrictService {
    async getAllProvince() {
        try {
            const provinces = await init_models_1.db.provinces.findAll();
            return provinces;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching provinces: ${error}`);
            throw error;
        }
    }
    async getAllDistrictByProvinceId(provinceId) {
        try {
            const districts = await init_models_1.db.districts.findAll({
                where: {
                    province_id: provinceId
                }
            });
            return districts;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching districts for province ${provinceId}: ${error}`);
            throw error;
        }
    }
    async getProvinceById(id) {
        try {
            const province = await init_models_1.db.provinces.findByPk(id);
            return province;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching province  with id ${id}: ${error}`);
            throw error;
        }
    }
    async getDistrictById(id) {
        try {
            const district = await init_models_1.db.districts.findByPk(id);
            return district;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching district  with id ${id}: ${error}`);
            throw error;
        }
    }
}
exports.provinceDistrictService = new ProvinceDistrictService();
