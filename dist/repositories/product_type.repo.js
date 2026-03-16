"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("@/utils/logger");
const sequelize_1 = require("sequelize");
// 🟢 1. Import Helper ของเราเข้ามา
const auditLogger_1 = require("../utils/auditLogger");
class ProductTypeRepository {
    // 🟢 เพิ่มพารามิเตอร์ performedBy เพื่อรับ ID คนทำรายการ
    async createProductType(data, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const cleanProductType = { ...data };
            if (!cleanProductType.type_name || cleanProductType.type_name.trim() === '') {
                throw new Error('Product type name is required');
            }
            const existProductType = await init_models_1.db.product_types.findOne({
                where: { type_name: cleanProductType.type_name },
                transaction: t
            });
            if (existProductType) {
                logger_1.logger.error(`Product type name already exists: ${cleanProductType.type_name}`);
                throw new Error('Product type name already exists');
            }
            const partner = await init_models_1.db.partners.findOne({
                where: { user_id: cleanProductType.partner_id },
                transaction: t
            });
            if (!partner) {
                throw new Error('Partner not found for the given user ID');
            }
            const mapData = {
                partner_id: partner.dataValues.id,
                type_name: cleanProductType.type_name,
                description: cleanProductType.description || null,
                is_active: 1,
            };
            const newProductType = await init_models_1.db.product_types.create(mapData, { transaction: t });
            // 🟢 บันทึก Audit Log (CREATE)
            // ถ้า data.user_id ถูกส่งมาด้วย ให้ใช้ตัวนั้น หรือจะรับผ่าน performedBy ก็ได้
            const actualPerformedBy = data.user_id || performedBy;
            await (0, auditLogger_1.logAudit)('product_types', newProductType.id, 'CREATE', null, newProductType.toJSON(), actualPerformedBy, t);
            await t.commit();
            logger_1.logger.info(`Product type created with ID: ${newProductType.id}`);
            return newProductType;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error creating product type: ${error.message}`);
            throw error;
        }
    }
    async findProductTypeById(productTypeId) {
        return await init_models_1.db.product_types.findByPk(productTypeId);
    }
    async findAllActiveProductTypes(options) {
        const { searchText, limit, page, getAllData = false } = options;
        const parsedLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;
        const parsedPage = parseInt(String(page), 10) || 1;
        const offset = getAllData ? undefined : (parsedPage - 1) * parsedLimit;
        const queryLimit = getAllData ? undefined : parsedLimit;
        const whereClause = {
            is_active: 1,
        };
        if (searchText && searchText.trim()) {
            whereClause.type_name = {
                [sequelize_1.Op.like]: `%${searchText.trim()}%`,
            };
        }
        const result = await init_models_1.db.product_types.findAndCountAll({
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
    async findProductTypesByPartnerId(partnerId) {
        return await init_models_1.db.product_types.findAll({ where: { partner_id: partnerId, is_active: 1 } });
    }
    // 🟢 เพิ่มพารามิเตอร์ performedBy
    async updateProductType(productTypeId, partnerId, data, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const productType = await this.findProductTypeById(productTypeId);
            if (!productType) {
                logger_1.logger.error(`Product type with ID: ${productTypeId} not found`);
                await t.rollback();
                return null;
            }
            const partner = await init_models_1.db.partners.findOne({
                where: { user_id: partnerId },
                transaction: t
            });
            if (productType.partner_id !== partner?.dataValues.id) {
                logger_1.logger.error(`Product type with ID: ${productTypeId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to update this product type');
            }
            // 🟢 เก็บข้อมูลเดิมก่อนอัปเดต
            const oldData = productType.toJSON();
            const updatedProductType = await productType.update(data, {
                transaction: t
            });
            // 🟢 บันทึก Audit Log (UPDATE)
            await (0, auditLogger_1.logAudit)('product_types', productTypeId, 'UPDATE', oldData, data, performedBy, t);
            await t.commit();
            logger_1.logger.info(`Product type updated with ID: ${productTypeId}`);
            return updatedProductType;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error updating product type: ${error.message}`);
            throw error;
        }
    }
    // 🟢 เพิ่มพารามิเตอร์ performedBy
    async deleteProductType(productTypeId, partnerId, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const productType = await this.findProductTypeById(productTypeId);
            if (!productType) {
                logger_1.logger.error(`Product type with ID: ${productTypeId} not found`);
                await t.rollback();
                return false;
            }
            const partner = await init_models_1.db.partners.findOne({
                where: { user_id: partnerId },
                transaction: t
            });
            if (productType.partner_id !== partner?.dataValues.id) {
                logger_1.logger.error(`Product type with ID: ${productTypeId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to delete this product type');
            }
            // 🟢 เก็บข้อมูลเดิมก่อนอัปเดต
            const oldData = productType.toJSON();
            const updatePayload = { is_active: 0 };
            await productType.update(updatePayload, { transaction: t });
            // 🟢 บันทึก Audit Log (ถือเป็นการ UPDATE สถานะให้ถูกลบ)
            await (0, auditLogger_1.logAudit)('product_types', productTypeId, 'UPDATE', oldData, updatePayload, performedBy, t);
            await t.commit();
            logger_1.logger.info(`Product type deleted (soft delete) with ID: ${productTypeId}`);
            return true;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error deleting product type: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new ProductTypeRepository();
