import { products, productsAttributes, productsCreationAttributes } from "@/models/products";
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op, Sequelize, where, Transaction } from 'sequelize';
import { logAudit } from '../utils/auditLogger';

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

    async createProduct(data: any): Promise<products> {
        const t = await db.sequelize.transaction();
        try {
            const cleanProduct = { ...data };

            if (!cleanProduct.partner_id || cleanProduct.partner_id === 0) {
                throw new Error('Product partner ID is required');
            }

            const existProduct = await db.products.findOne({ 
                where: { partner_id: cleanProduct.partner_id, product_name: cleanProduct.product_name },
                transaction: t 
            });
            if (existProduct) {
                logger.error(`Product with This Partner product already exists: ${cleanProduct.product_name}`);
                throw new Error('Product with ID already exists');
            }

            // 🟢 อัปเดต MapData ให้ตรงกับตารางจริงใน Database 100%
            const mapData: any = {
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

            const newProduct = await db.products.create(mapData, { transaction: t });

            // 🟢 ບັນທຶກ Audit Log (CREATE)
            const performedBy = data.user_id || data.performed_by || 1;
            await logAudit('products', newProduct.id, 'CREATE', null, newProduct.toJSON(), performedBy, t);

            await t.commit();
            logger.info(`Product created with ID: ${newProduct.id}`);
            return newProduct;
        } catch (error) {
            await t.rollback();
            logger.error(`Error creating product: ${(error as Error).message}`);
            throw error;
        }
    }

    async findProductById(productId: number, options?: { transaction?: Transaction, lock?: any }): Promise<products | null> {
        return await db.products.findByPk(productId, {
            transaction: options?.transaction,
            lock: options?.lock,
            include: [
                {
                    model: db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                },
                {
                    model: db.product_gallery,
                    as: 'product_galleries',
                    attributes: ['id', 'image_url']
                },
                {
                    model: db.global_categories,
                    as: 'global_category',
                    attributes: ['id', 'category_name', 'prefix_code']
                },
                {
                    model: db.product_variants,
                    as: 'product_variants',
                    attributes: ['id', 'merchant_sku', 'color', 'size_or_capacity', 'weight_gram', 'price', 'stock_quantity', 'image_url']
                }
            ]
        });
    }

    async findProductsByPartnerId(partnerId: number): Promise<products[]> {
        return await db.products.findAll({ where: { partner_id: partnerId, is_active: 1 },
            include: [
                {
                    model: db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ] 
        });
    }

    async updateProduct(productId: number, partnerId: number, data: any): Promise<products | null> {
        const t = await db.sequelize.transaction();
        try {
            const product = await this.findProductById(productId, {
                transaction: t,
                lock: t.LOCK.UPDATE, // 🟢 เพิ่ม Lock เพื่อ
            });
            if (!product) {
                logger.error(`Product with ID: ${productId} not found`);
                await t.rollback();
                return null;
            }
            const partner = await db.partners.findOne({ where: { user_id: partnerId }, transaction: t })

            if (product.partner_id !== partner?.dataValues.id) {
                logger.error(`Product type with ID: ${productId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to update this product');
            }

            const oldData = product.toJSON();
            
            // ກອງເອົາແຕ່ຂໍ້ມູນທີ່ຈະອັບເດດແທ້ໆ
            const updateData: any = {};
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
                where: { id: productId, partner_id: partner!.dataValues.id },
                transaction: t
            });

            // 🟢 ບັນທຶກ Audit Log (UPDATE)
            const performedBy = data.user_id || data.performed_by || 1;
            await logAudit('products', productId, 'UPDATE', oldData, updateData, performedBy, t);

            await t.commit();
            logger.info(`Product updated with ID: ${productId}`);
            return updatedProduct;
        } catch (error) {
            await t.rollback();
            logger.error(`Error updating product: ${(error as Error).message}`);
            throw error;
        }
    }

    async deleteOneProduct(productId: number, partnerId: number, status: number, performedBy: number = 1): Promise<boolean> {
        const t = await db.sequelize.transaction();
        try {
            const product = await this.findProductById(productId);
            if (!product) {
                logger.error(`Product with ID: ${productId} not found for deletion`);
                await t.rollback();
                return false;
            }

            const partner = await db.partners.findOne({ where: { user_id: partnerId }, transaction: t })

            if (product.partner_id !== partner?.dataValues.id) {
                logger.error(`Product with ID: ${productId} does not belong to partner ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized to switch Status this product');
            }

            const oldData = product.toJSON();
            const updateData = { is_active: status };

            await product.update(updateData, { 
                where: { id: productId, partner_id: partner!.dataValues.id },
                transaction: t 
            });

            // 🟢 ບັນທຶກ Audit Log (UPDATE - Switch Status)
            await logAudit('products', productId, 'UPDATE', oldData, updateData, performedBy, t);

            await t.commit();
            logger.info(`Product switch Status with ID: ${productId}`);
            return true;
        } catch (error) {
            await t.rollback();
            logger.error(`Error deleting product: ${(error as Error).message}`);
            throw error;
        }
    }

    async updateMultipleProductStatus(productIds: number[], partnerId: number, status: number, performedBy: number = 1): Promise<number> {
        const t = await db.sequelize.transaction();
        try {
            // 1. ຫາ partner_id ຕົວຈິງຈາກ user_id
            const partner = await db.partners.findOne({ where: { user_id: partnerId }, transaction: t });
            if (!partner) {
                logger.error(`Partner not found for user ID: ${partnerId}`);
                await t.rollback();
                throw new Error('Unauthorized');
            }

            // 🟢 ດຶງຂໍ້ມູນເກົ່າທັງໝົດທີ່ກຳລັງຈະຖືກປ່ຽນສະຖານະ ເພື່ອມາເກັບ Log
            const productsToUpdate = await db.products.findAll({
                where: {
                    id: { [Op.in]: productIds },
                    partner_id: partner.dataValues.id
                },
                transaction: t
            });

            // 2. ອັບເດດສະຖານະພ້ອມກັນຫຼາຍລາຍການ 
            const [updateCount] = await db.products.update(
                { is_active: status },
                {
                    where: {
                        id: { [Op.in]: productIds },
                        partner_id: partner.dataValues.id
                    },
                    transaction: t
                }
            );

            // 🟢 ບັນທຶກ Audit Log ສຳລັບແຕ່ລະສິນຄ້າທີ່ຖືກປ່ຽນສະຖານະ (Loop ເກັບ Log)
            for (const prod of productsToUpdate) {
                const oldData = prod.toJSON();
                await logAudit('products', prod.id, 'UPDATE', oldData, { is_active: status }, performedBy, t);
            }

            await t.commit();
            logger.info(`Bulk updated status to ${status} for ${updateCount} products by partner ID: ${partnerId}`);
            return updateCount; 

        } catch (error) {
            await t.rollback();
            logger.error(`Error in updateMultipleProductStatus: ${(error as Error).message}`);
            throw error;
        }
    }

    async findAllActiveProducts(options: {
        search?: string,            
        searchText?: string,        
        limit?: number,
        page?: number,
        getAllData?: boolean,
        shop_id?: number,
        is_active?: number,         
        productType_id?: number     
    }) {
        const { search, searchText, limit, page, getAllData = false, shop_id, is_active, productType_id } = options;

        const actualSearch = search || searchText;
        const parsedLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;
        const parsedPage = parseInt(String(page), 10) || 1;

        const offset = getAllData ? undefined : (parsedPage - 1) * parsedLimit;
        const queryLimit = getAllData ? undefined : parsedLimit;

        const whereClause: any = {};

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
            whereClause[Op.or] = [
                { product_name: { [Op.like]: searchKeyword } },
                { brand: { [Op.like]: searchKeyword } },
                { model: { [Op.like]: searchKeyword } }
            ];
        }

        const result = await db.products.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: db.partners,
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

    async findProductsByType(productTypeId: number): Promise<products[]> {
        return await db.products.findAll(
            { where: 
                { 
                    productType_id: productTypeId, is_active: 1 

                }, 
                include: [
                    {
                        model: db.product_types,
                        as: 'productType',
                        attributes: ['id', 'type_name']
                    },
                    {
                        model: db.partners,
                        as: 'partner',
                        attributes: ['id', 'shop_name']
                    }
                ]
            });
    }

    async findProductsByTypeAndPartner(productTypeId: number, partnerId: number): Promise<products[]> {
        return await db.products.findAll({ where: { productType_id: productTypeId, partner_id: partnerId, is_active: 1 },
            include: [
                {
                    model: db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ] 
            });
    }

    async findProductsByPriceRange(minPrice: number, maxPrice: number): Promise<products[]> {
        return await db.products.findAll({ where: { price: { [Op.between]: [minPrice, maxPrice] }, is_active: 1 },
            include: [
                {
                    model: db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                },
                {
                    model: db.partners,
                    as: 'partner',
                    attributes: ['id', 'shop_name']
                }
            ] 
        });
    }

    async deleteAllProductsByPartnerId(partnerId: number, performedBy: number = 1): Promise<number> {
        const t = await db.sequelize.transaction();
        try {
            const partner = await db.partners.findOne({ where: { user_id: partnerId }, transaction: t })
            
            // 🟢 ດຶງຂໍ້ມູນເກົ່າທັງໝົດທີ່ກຳລັງຈະຖືກປ່ຽນສະຖານະ ເພື່ອມາເກັບ Log
            const productsToUpdate = await db.products.findAll({ 
                where: { partner_id: partner!.dataValues.id },
                transaction: t 
            });
            
            if (productsToUpdate.length === 0) {
                logger.error(`No products found for partner ID: ${partnerId} to delete`);
                await t.rollback();
                return 0;
            }

            const deleteCount = await db.products.update(
                { is_active: 0 }, 
                { where: { partner_id: partner!.dataValues.id }, transaction: t }
            );

            // 🟢 ບັນທຶກ Audit Log ສຳລັບແຕ່ລະສິນຄ້າທີ່ຖືກປ່ຽນສະຖານະ (Loop ເກັບ Log)
            for (const prod of productsToUpdate) {
                const oldData = prod.toJSON();
                await logAudit('products', prod.id, 'UPDATE', oldData, { is_active: 0 }, performedBy, t);
            }

            await t.commit();
            logger.info(`Deleted ${deleteCount[0]} products for partner ID: ${partnerId}`);
            return deleteCount[0];

        } catch (error) {
            await t.rollback();
            logger.error(`Error deleting products for partner ID: ${partnerId} - ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new ProductRepository();