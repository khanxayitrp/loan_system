"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("@/utils/logger");
const sequelize_1 = require("sequelize");
const auditLogger_1 = require("../utils/auditLogger");
class ProductRepository {
    // ==========================================
    // 🟢 HELPER FUNCTION: ສຳລັບບັນທຶກ Audit Log
    // ==========================================
    // private async logAudit(
    //     tableName: string,
    //     recordId: number,
    //     action: 'CREATE' | 'UPDATE' | 'DELETE',
    //     oldValues: any,
    //     newValues: any,
    //     performedBy: number,
    //     t?: Transaction
    // ) {
    //     let changedColumns: any = undefined;
    //     if (action === 'UPDATE' && oldValues && newValues) {
    //         const changes: string[] = [];
    //         for (const key in newValues) {
    //             if (newValues[key] !== undefined && oldValues[key] != newValues[key]) {
    //                 changes.push(key);
    //             }
    //         }
    //         if (changes.length === 0) return;
    //         changedColumns = changes;
    //     }
    //     const logOptions = t ? { transaction: t } : {};
    //     await db.audit_logs.create({
    //         table_name: tableName,
    //         record_id: recordId,
    //         action: action,
    //         old_values: oldValues || undefined,
    //         new_values: newValues || undefined,
    //         changed_columns: changedColumns,
    //         performed_by: performedBy
    //     }, logOptions);
    // }
    async createProduct(data) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const cleanProduct = { ...data };
            if (!cleanProduct.partner_id || cleanProduct.partner_id === 0) {
                throw new Error('Product partner ID is required');
            }
            const existProduct = await init_models_1.db.products.findOne({
                where: { partner_id: cleanProduct.partner_id, product_name: cleanProduct.product_name },
                transaction: t
            });
            if (existProduct) {
                logger_1.logger.error(`Product with This Partner product already exists: ${cleanProduct.product_name}`);
                throw new Error('Product with ID already exists');
            }
            // 🟢 อัปเดต MapData ให้ตรงกับตารางจริงใน Database 100%
            const mapData = {
                partner_id: cleanProduct.partner_id,
                productType_id: cleanProduct.productType_id,
                global_category_id: cleanProduct.global_category_id || null, // เพิ่ม
                product_name: cleanProduct.product_name,
                description: cleanProduct.description || null,
                brand: cleanProduct.brand || null,
                model: cleanProduct.model || null,
                price: cleanProduct.price,
                image_url: cleanProduct.image_url || null,
                is_active: cleanProduct.is_active !== undefined ? cleanProduct.is_active : 1,
                system_sku: cleanProduct.system_sku || null, // เพิ่ม (ปกติ Gen จาก Controller)
                merchant_sku: cleanProduct.merchant_sku || null, // เพิ่ม
                stock_quantity: cleanProduct.stock_quantity || 0, // เพิ่ม
                reserved_stock: cleanProduct.reserved_stock || 0, // เพิ่ม
                allowed_loan_type: cleanProduct.allowed_loan_type || 'both' // เพิ่ม
            };
            const newProduct = await init_models_1.db.products.create(mapData, { transaction: t });
            // 🟢 ບັນທຶກ Audit Log (CREATE)
            const performedBy = data.user_id || data.performed_by || 1;
            await (0, auditLogger_1.logAudit)('products', newProduct.id, 'CREATE', null, newProduct.toJSON(), performedBy, t);
            await t.commit();
            logger_1.logger.info(`Product created with ID: ${newProduct.id}`);
            return newProduct;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error creating product: ${error.message}`);
            throw error;
        }
    }
    async findProductById(productId, options) {
        return await init_models_1.db.products.findByPk(productId, {
            transaction: options?.transaction,
            lock: options?.lock,
            include: [
                {
                    model: init_models_1.db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: init_models_1.db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                },
                {
                    model: init_models_1.db.product_gallery,
                    as: 'product_galleries',
                    attributes: ['id', 'image_url']
                },
                {
                    model: init_models_1.db.global_categories,
                    as: 'global_category',
                    attributes: ['id', 'category_name', 'prefix_code']
                },
                {
                    model: init_models_1.db.product_variants,
                    as: 'product_variants',
                    attributes: ['id', 'merchant_sku', 'color', 'size_or_capacity', 'weight_gram', 'price', 'stock_quantity', 'image_url']
                }
            ]
        });
    }
    async findProductsByPartnerId(partnerId) {
        return await init_models_1.db.products.findAll({ where: { partner_id: partnerId, is_active: 1 },
            include: [
                {
                    model: init_models_1.db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: init_models_1.db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ]
        });
    }
    async updateProduct(productId, partnerId, data) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const product = await this.findProductById(productId, {
                transaction: t,
                lock: t.LOCK.UPDATE, // 🟢 เพิ่ม Lock เพื่อ
            });
            if (!product) {
                logger_1.logger.error(`Product with ID: ${productId} not found`);
                await t.rollback();
                return null;
            }
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: partnerId }, transaction: t });
            if (product.partner_id !== partner?.dataValues.id) {
                logger_1.logger.error(`Product type with ID: ${productId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to update this product');
            }
            const oldData = product.toJSON();
            // ກອງເອົາແຕ່ຂໍ້ມູນທີ່ຈະອັບເດດແທ້ໆ
            const updateData = {};
            const allowedFields = [
                'productType_id', 'global_category_id', 'product_name',
                'description', 'brand', 'model', 'price', 'image_url',
                'merchant_sku', 'stock_quantity', 'reserved_stock', 'allowed_loan_type'
            ];
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    updateData[field] = data[field];
                }
            }
            const updatedProduct = await product.update(updateData, {
                where: { id: productId, partner_id: partner.dataValues.id },
                transaction: t
            });
            // 🟢 ບັນທຶກ Audit Log (UPDATE)
            const performedBy = data.user_id || data.performed_by || 1;
            await (0, auditLogger_1.logAudit)('products', productId, 'UPDATE', oldData, updateData, performedBy, t);
            await t.commit();
            logger_1.logger.info(`Product updated with ID: ${productId}`);
            return updatedProduct;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error updating product: ${error.message}`);
            throw error;
        }
    }
    async deleteOneProduct(productId, partnerId, status, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const product = await this.findProductById(productId);
            if (!product) {
                logger_1.logger.error(`Product with ID: ${productId} not found for deletion`);
                await t.rollback();
                return false;
            }
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: partnerId }, transaction: t });
            if (product.partner_id !== partner?.dataValues.id) {
                logger_1.logger.error(`Product with ID: ${productId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to switch Status this product');
            }
            const oldData = product.toJSON();
            const updateData = { is_active: status };
            await product.update(updateData, {
                where: { id: productId, partner_id: partner.dataValues.id },
                transaction: t
            });
            // 🟢 ບັນທຶກ Audit Log (UPDATE - Switch Status)
            await (0, auditLogger_1.logAudit)('products', productId, 'UPDATE', oldData, updateData, performedBy, t);
            await t.commit();
            logger_1.logger.info(`Product switch Status with ID: ${productId}`);
            return true;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error deleting product: ${error.message}`);
            throw error;
        }
    }
    async updateMultipleProductStatus(productIds, partnerId, status, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            // 1. ຫາ partner_id ຕົວຈິງຈາກ user_id
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: partnerId }, transaction: t });
            if (!partner) {
                logger_1.logger.error(`Partner not found for user ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized');
            }
            // 🟢 ດຶງຂໍ້ມູນເກົ່າທັງໝົດທີ່ກຳລັງຈະຖືກປ່ຽນສະຖານະ ເພື່ອມາເກັບ Log
            const productsToUpdate = await init_models_1.db.products.findAll({
                where: {
                    id: { [sequelize_1.Op.in]: productIds },
                    partner_id: partner.dataValues.id
                },
                transaction: t
            });
            // 2. ອັບເດດສະຖານະພ້ອມກັນຫຼາຍລາຍການ 
            const [updateCount] = await init_models_1.db.products.update({ is_active: status }, {
                where: {
                    id: { [sequelize_1.Op.in]: productIds },
                    partner_id: partner.dataValues.id
                },
                transaction: t
            });
            // 🟢 ບັນທຶກ Audit Log ສຳລັບແຕ່ລະສິນຄ້າທີ່ຖືກປ່ຽນສະຖານະ (Loop ເກັບ Log)
            for (const prod of productsToUpdate) {
                const oldData = prod.toJSON();
                await (0, auditLogger_1.logAudit)('products', prod.id, 'UPDATE', oldData, { is_active: status }, performedBy, t);
            }
            await t.commit();
            logger_1.logger.info(`Bulk updated status to ${status} for ${updateCount} products by partner ID: ${partnerId}`);
            return updateCount;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error in updateMultipleProductStatus: ${error.message}`);
            throw error;
        }
    }
    async findAllActiveProducts(options) {
        const { search, searchText, limit, page, getAllData = false, shop_id, is_active, productType_id } = options;
        const actualSearch = search || searchText;
        const parsedLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;
        const parsedPage = parseInt(String(page), 10) || 1;
        const offset = getAllData ? undefined : (parsedPage - 1) * parsedLimit;
        const queryLimit = getAllData ? undefined : parsedLimit;
        const whereClause = {};
        if (shop_id) {
            whereClause.partner_id = shop_id;
        }
        if (is_active !== undefined && !isNaN(is_active)) {
            whereClause.is_active = Number(is_active);
        }
        if (productType_id !== undefined && !isNaN(productType_id)) {
            whereClause.productType_id = Number(productType_id);
        }
        if (actualSearch && actualSearch.trim()) {
            const searchKeyword = `%${actualSearch.trim()}%`;
            whereClause[sequelize_1.Op.or] = [
                { product_name: { [sequelize_1.Op.like]: searchKeyword } },
                { brand: { [sequelize_1.Op.like]: searchKeyword } },
                { model: { [sequelize_1.Op.like]: searchKeyword } }
            ];
        }
        const result = await init_models_1.db.products.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: init_models_1.db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: init_models_1.db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ],
            limit: queryLimit,
            offset,
            order: [['created_at', 'DESC']],
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
    async findProductsByType(productTypeId) {
        return await init_models_1.db.products.findAll({ where: {
                productType_id: productTypeId, is_active: 1
            },
            include: [
                {
                    model: init_models_1.db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: init_models_1.db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ]
        });
    }
    async findProductsByTypeAndPartner(productTypeId, partnerId) {
        return await init_models_1.db.products.findAll({ where: { productType_id: productTypeId, partner_id: partnerId, is_active: 1 },
            include: [
                {
                    model: init_models_1.db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: init_models_1.db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ]
        });
    }
    async findProductsByPriceRange(minPrice, maxPrice) {
        return await init_models_1.db.products.findAll({ where: { price: { [sequelize_1.Op.between]: [minPrice, maxPrice] }, is_active: 1 },
            include: [
                {
                    model: init_models_1.db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: init_models_1.db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ]
        });
    }
    async deleteAllProductsByPartnerId(partnerId, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: partnerId }, transaction: t });
            // 🟢 ດຶງຂໍ້ມູນເກົ່າທັງໝົດທີ່ກຳລັງຈະຖືກປ່ຽນສະຖານະ ເພື່ອມາເກັບ Log
            const productsToUpdate = await init_models_1.db.products.findAll({
                where: { partner_id: partner.dataValues.id },
                transaction: t
            });
            if (productsToUpdate.length === 0) {
                logger_1.logger.error(`No products found for partner ID: ${partnerId} to delete`);
                await t.rollback();
                return 0;
            }
            const deleteCount = await init_models_1.db.products.update({ is_active: 0 }, { where: { partner_id: partner.dataValues.id }, transaction: t });
            // 🟢 ບັນທຶກ Audit Log ສຳລັບແຕ່ລະສິນຄ້າທີ່ຖືກປ່ຽນສະຖານະ (Loop ເກັບ Log)
            for (const prod of productsToUpdate) {
                const oldData = prod.toJSON();
                await (0, auditLogger_1.logAudit)('products', prod.id, 'UPDATE', oldData, { is_active: 0 }, performedBy, t);
            }
            await t.commit();
            logger_1.logger.info(`Deleted ${deleteCount[0]} products for partner ID: ${partnerId}`);
            return deleteCount[0];
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error deleting products for partner ID: ${partnerId} - ${error.message}`);
            throw error;
        }
    }
}
exports.default = new ProductRepository();
