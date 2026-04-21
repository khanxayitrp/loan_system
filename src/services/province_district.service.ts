import { db } from "../models/init-models"
import { logger } from "../utils/logger"

class ProvinceDistrictService {


    async getAllProvince() {
        try {
            const provinces = await db.provinces.findAll()
            return provinces
        } catch (error) {
            logger.error(`Error fetching provinces: ${error}`)
            throw error
        }
    }

    async getAllDistrictByProvinceId(provinceId: string) {
        try {
            const districts = await db.districts.findAll({
                where: {
                    province_id: provinceId
                }
            })
            return districts
        } catch (error) {
            logger.error(`Error fetching districts for province ${provinceId}: ${error}`)
            throw error
        }
    }


    async getProvinceById(id: number) {
        try {
            const province = await db.provinces.findByPk(id)
            return province
        } catch (error) {
            logger.error(`Error fetching province  with id ${id}: ${error}`)
            throw error
        }
    }

    async getDistrictById(id: number) {
        try {
            const district = await db.districts.findByPk(id)
            return district
        } catch (error) {
            logger.error(`Error fetching district  with id ${id}: ${error}`)
            throw error
        }   
    }
}


export const provinceDistrictService = new ProvinceDistrictService()