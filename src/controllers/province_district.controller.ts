import { Request, Response, NextFunction } from "express";
import { provinceDistrictService } from "../services/province_district.service";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import redisService from "../services/redis.service";

class ProvinceDistrictController {

    public async getAllProvince(req: Request, res: Response, next: NextFunction) {
        try {
            const cacheKey = 'all_provinces';
            const cachedProvinces = await redisService.get(cacheKey);
            if (cachedProvinces) {
                logger.info('Provinces fetched from cache');
                return res.status(200).json(JSON.parse(cachedProvinces));
            }
            const provinces = await provinceDistrictService.getAllProvince();
            await redisService.set(cacheKey, JSON.stringify(provinces), 3600);
            logger.info('Provinces fetched from database and cached');
            return res.status(200).json(provinces);
        } catch (error) {
            logger.error("Error in getAllProvince:", error);
            next(error);
        }
    }
    public async getAllDistrictByProvinceId(req: Request, res: Response, next: NextFunction) {
        try {
            const provinceId = req.params.provinceId
            if (!provinceId || provinceId.trim() === '') {
                throw new BadRequestError('provinceId ບໍ່ຖືກຕ້ອງ');
            }
            const cacheKey = `districts_province_${provinceId}`;
            const cachedDistricts = await redisService.get(cacheKey);
            if (cachedDistricts) {
                logger.info(`Districts for province ${provinceId} fetched from cache`);
                return res.status(200).json(JSON.parse(cachedDistricts));
            }

            const districts = await provinceDistrictService.getAllDistrictByProvinceId(provinceId);
            await redisService.set(cacheKey, JSON.stringify(districts), 3600);
            logger.info(`Districts for province ${provinceId} fetched from database and cached`);
            return res.status(200).json(districts);
        } catch (error) {
            logger.error("Error in getAllDistrictByProvinceId:", error);
            next(error);
        }
    }
    public async getProvinceById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id, 10); 
            if (!id || isNaN(id)) {
                throw new BadRequestError('id ບໍ່ຖືກຕ້ອງ');
            }   
            const province = await provinceDistrictService.getProvinceById(id);
            if (!province) {
                return res.status(404).json({ success: false, message: 'Province not found' });
            }
            return res.status(200).json(province);
        } catch (error) {
            logger.error("Error in getProvinceById:", error);
            next(error);
        }
    }

    public async getDistrictById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id, 10);
            if (!id || isNaN(id)) {
                throw new BadRequestError('id ບໍ່ຖືກຕ້ອງ');
            }
            const district = await provinceDistrictService.getDistrictById(id);
            if (!district) {
                return res.status(404).json({ success: false, message: 'District not found' });
            }
            return res.status(200).json(district);
        } catch (error) {
            logger.error("Error in getDistrictById:", error);
            next(error);
        }
    }
}

export const provinceDistrictController = new ProvinceDistrictController();