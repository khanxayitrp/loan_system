import { product_types, product_typesAttributes, product_typesCreationAttributes } from '../models/product_types';
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op } from 'sequelize';

class ProductTypeRepository {
    async createProductType(data: product_typesCreationAttributes): Promise<product_types> {
        try {
            const cleanProductType = { ...data };
            if (!cleanProductType.type_name || cleanProductType.type_name.trim() === '') {
                throw new Error('Product type name is required');
            }
            const existProductType = await db.product_types.findOne({ where: { type_name: cleanProductType.type_name } });
            if (existProductType) {
                logger.error(`Product type name already exists: ${cleanProductType.type_name}`);
                throw new Error('Product type name already exists');
            }

            const partner = await db.partners.findOne({where: {user_id: cleanProductType.partner_id}})
            console.log('partner is ', partner)
            const mapData: any = {
                partner_id: partner!.dataValues.id,
                type_name: cleanProductType.type_name,
                description: cleanProductType.description || null,
                is_active: 1,
            }
            const newProductType = await db.product_types.create(mapData);
            logger.info(`Product type created with ID: ${newProductType.id}`);
            return newProductType;
        } catch (error) {
            logger.error(`Error creating product type: ${(error as Error).message}`);
            throw error;
        }
    }
    async findProductTypeById(productTypeId: number): Promise<product_types | null> {
        return await db.product_types.findByPk(productTypeId);
    }

    async findAllActiveProductTypes(options: {
        searchText?: string,
        limit?: number,
        page?: number,
        getAllData?: boolean
    }) {
        const { searchText, limit, page, getAllData = false } = options;
        const parsedLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;
        const parsedPage = parseInt(String(page), 10) || 1;
        // ถ้า getAllData = true → ดึงทั้งหมด ไม่แบ่งหน้า
        const offset = getAllData ? undefined : (parsedPage - 1) * parsedLimit;
        const queryLimit = getAllData ? undefined : parsedLimit;

        // สร้างเงื่อนไข where
        const whereClause: any = {
            is_active: 1,
        };

        // ถ้ามี searchText → ค้นหาในชื่อ (หรือ field อื่นที่ต้องการ)
        if (searchText && searchText.trim()) {
            whereClause.type_name = {
                [Op.like]: `%${searchText.trim()}%`,
            };
            // ถ้าต้องการค้นหาหลาย field เช่น code หรือ description
            // whereClause[Op.or] = [
            //   { name: { [Op.like]: `%${searchText.trim()}%` } },
            //   { description: { [Op.like]: `%${searchText.trim()}%` } },
            // ];
        }

        const result = await db.product_types.findAndCountAll({
            where: whereClause,
            limit: queryLimit,
            offset,
            order: [['type_name', 'ASC']], // หรือเรียงตาม field ที่ต้องการ เช่น created_at DESC
            // attributes: ['id', 'name', 'code', 'description'] // ถ้าต้องการเลือกเฉพาะบาง field
        });

        // ถ้า getAllData = true → return แค่ rows
        if (getAllData) {
            return {
                data: result.rows,
                total: result.count,
            };
        }

        // ปกติ return แบบ pagination
        return {
            data: result.rows,
            total: result.count,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(result.count / parsedLimit),
        };
    }

    async findProductTypesByPartnerId(partnerId: number): Promise<product_types[]> {
        return await db.product_types.findAll({ where: { partner_id: partnerId, is_active: 1 } });
    }

    async updateProductType(productTypeId: number, partnerId: number, data: Partial<product_typesAttributes>): Promise<product_types | null> {
        try {
            const productType = await this.findProductTypeById(productTypeId);
            if (!productType) {
                logger.error(`Product type with ID: ${productTypeId} not found`);
                return null;
            }

            const partner = await db.partners.findOne({where: {user_id: partnerId}})
            
             if (productType.partner_id !== partner?.dataValues.id) {
                logger.error(`Product type with ID: ${productTypeId} does not belong to partner ID: ${partnerId}`);
                throw new Error('Unauthorized to delete this product type');
            }

            const updatedProductType = await productType.update(data, {
                where: { id: productTypeId, partner_id: partner!.dataValues.id },
                returning: true
            });
            logger.info(`Product type updated with ID: ${productTypeId}`);
            return updatedProductType;
        } catch (error) {
            logger.error(`Error updating product type: ${(error as Error).message}`);
            throw error;
        }
    }
    async deleteProductType(productTypeId: number, partnerId: number): Promise<boolean> {
        try {
            const productType = await this.findProductTypeById(productTypeId);
            if (!productType) {
                logger.error(`Product type with ID: ${productTypeId} not found`);
                return false;
            }
           
            const partner = await db.partners.findOne({where: {user_id: partnerId}})

             if (productType.partner_id !== partner?.dataValues.id) {
                logger.error(`Product type with ID: ${productTypeId} does not belong to partner ID: ${partnerId}`);
                throw new Error('Unauthorized to delete this product type');
            }
            const deleteCount = await productType.update({ is_active: 0 }, { where: { id: productTypeId, partner_id: partner!.dataValues.id } });
            logger.info(`Product type deleted with ID: ${productTypeId}`);
            return true;

        } catch (error) {
            logger.error(`Error deleting product type: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new ProductTypeRepository();