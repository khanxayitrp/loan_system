import { product_types, product_typesAttributes, product_typesCreationAttributes } from '../models/product_types';
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op, Transaction } from 'sequelize';

// 🟢 1. Import Helper ของเราเข้ามา
import { logAudit } from '../utils/auditLogger';

class ProductTypeRepository {
    
    // 🟢 เพิ่มพารามิเตอร์ performedBy เพื่อรับ ID คนทำรายการ
    async createProductType(data: any, performedBy: number = 1): Promise<product_types> {
        const t = await db.sequelize.transaction();
        try {
            const cleanProductType = { ...data };
            if (!cleanProductType.type_name || cleanProductType.type_name.trim() === '') {
                throw new Error('Product type name is required');
            }
            
            const existProductType = await db.product_types.findOne({ 
                where: { type_name: cleanProductType.type_name },
                transaction: t
            });
            
            if (existProductType) {
                logger.error(`Product type name already exists: ${cleanProductType.type_name}`);
                throw new Error('Product type name already exists');
            }

            const partner = await db.partners.findOne({
                where: { user_id: cleanProductType.partner_id },
                transaction: t
            });
            
            if (!partner) {
                throw new Error('Partner not found for the given user ID');
            }

            const mapData: any = {
                partner_id: partner.dataValues.id,
                type_name: cleanProductType.type_name,
                description: cleanProductType.description || null,
                is_active: 1,
            };
            
            const newProductType = await db.product_types.create(mapData, { transaction: t });
            
            // 🟢 บันทึก Audit Log (CREATE)
            // ถ้า data.user_id ถูกส่งมาด้วย ให้ใช้ตัวนั้น หรือจะรับผ่าน performedBy ก็ได้
            const actualPerformedBy = data.user_id || performedBy;
            await logAudit('product_types', newProductType.id, 'CREATE', null, newProductType.toJSON(), actualPerformedBy, t);

            await t.commit();
            logger.info(`Product type created with ID: ${newProductType.id}`);
            return newProductType;
        } catch (error) {
            await t.rollback();
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
        
        const offset = getAllData ? undefined : (parsedPage - 1) * parsedLimit;
        const queryLimit = getAllData ? undefined : parsedLimit;

        const whereClause: any = {
            is_active: 1,
        };

        if (searchText && searchText.trim()) {
            whereClause.type_name = {
                [Op.like]: `%${searchText.trim()}%`,
            };
        }

        const result = await db.product_types.findAndCountAll({
            where: whereClause,
            limit: queryLimit,
            offset,
            order: [['type_name', 'ASC']], 
        });

        if (getAllData) {
            return {
                data: result.rows,
                total: result.count,
            };
        }

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

    // 🟢 เพิ่มพารามิเตอร์ performedBy
    async updateProductType(productTypeId: number, partnerId: number, data: any, performedBy: number = 1): Promise<product_types | null> {
        const t = await db.sequelize.transaction();
        try {
            const productType = await this.findProductTypeById(productTypeId);
            if (!productType) {
                logger.error(`Product type with ID: ${productTypeId} not found`);
                await t.rollback();
                return null;
            }

            const partner = await db.partners.findOne({
                where: { user_id: partnerId },
                transaction: t
            });
            
            if (productType.partner_id !== partner?.dataValues.id) {
                logger.error(`Product type with ID: ${productTypeId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to update this product type');
            }

            // 🟢 เก็บข้อมูลเดิมก่อนอัปเดต
            const oldData = productType.toJSON();

            const updatedProductType = await productType.update(data, {
                transaction: t
            });

            // 🟢 บันทึก Audit Log (UPDATE)
            await logAudit('product_types', productTypeId, 'UPDATE', oldData, data, performedBy, t);

            await t.commit();
            logger.info(`Product type updated with ID: ${productTypeId}`);
            return updatedProductType;
        } catch (error) {
            await t.rollback();
            logger.error(`Error updating product type: ${(error as Error).message}`);
            throw error;
        }
    }

    // 🟢 เพิ่มพารามิเตอร์ performedBy
    async deleteProductType(productTypeId: number, partnerId: number, performedBy: number = 1): Promise<boolean> {
        const t = await db.sequelize.transaction();
        try {
            const productType = await this.findProductTypeById(productTypeId);
            if (!productType) {
                logger.error(`Product type with ID: ${productTypeId} not found`);
                await t.rollback();
                return false;
            }
            
            const partner = await db.partners.findOne({
                where: { user_id: partnerId },
                transaction: t
            });

            if (productType.partner_id !== partner?.dataValues.id) {
                logger.error(`Product type with ID: ${productTypeId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to delete this product type');
            }

            // 🟢 เก็บข้อมูลเดิมก่อนอัปเดต
            const oldData = productType.toJSON();
            const updatePayload = { is_active: 0 };

            await productType.update(updatePayload, { transaction: t });

            // 🟢 บันทึก Audit Log (ถือเป็นการ UPDATE สถานะให้ถูกลบ)
            await logAudit('product_types', productTypeId, 'UPDATE', oldData, updatePayload, performedBy, t);

            await t.commit();
            logger.info(`Product type deleted (soft delete) with ID: ${productTypeId}`);
            return true;

        } catch (error) {
            await t.rollback();
            logger.error(`Error deleting product type: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new ProductTypeRepository();