import { products, productsAttributes, productsCreationAttributes } from "@/models/products";
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op, Sequelize, where } from 'sequelize';

class ProductRepository {
    async createProduct(data: productsCreationAttributes): Promise<products> {
        try {
            const cleanProduct = { ...data };

            // if (!cleanProduct.id || cleanProduct.id === 0) {
            //     throw new Error('Product ID is required');
            // }
            if (!cleanProduct.partner_id || cleanProduct.partner_id === 0) {
                throw new Error('Product partner ID is required');
            }

            const existProduct = await db.products.findOne({ where: { partner_id: cleanProduct.partner_id, product_name: cleanProduct.product_name } });
            if (existProduct) {
                logger.error(`Product with This Partner product already exists: ${cleanProduct.product_name}`);
                throw new Error('Product with ID already exists');
            }

            const mapData: any = {
                // id: cleanProduct.id,
                partner_id: cleanProduct.partner_id,
                productType_id: cleanProduct.productType_id,
                product_name: cleanProduct.product_name,
                // description: cleanProduct.description,
                brand: cleanProduct.brand || null,
                model: cleanProduct.model || null,
                price: cleanProduct.price,
                interest_rate: cleanProduct.interest_rate,
                image_url: cleanProduct.image_url || null,
                // gallery: cleanProduct.gallery || null,
                is_active: 1,
            };

            console.log('MapData to save', mapData)
            const newProduct = await db.products.create(mapData);
            logger.info(`Product created with ID: ${newProduct.id}`);
            return newProduct;
        } catch (error) {
            logger.error(`Error creating product: ${(error as Error).message}`);
            throw error;
        }
    }
    async findProductById(productId: number): Promise<products | null> {
        return await db.products.findByPk(productId);
    }
    async findProductsByPartnerId(partnerId: number): Promise<products[]> {
        return await db.products.findAll({ where: { partner_id: partnerId, is_active: 1 } });
    }
    async updateProduct(productId: number, partnerId: number, data: Partial<productsAttributes>): Promise<products | null> {
        try {
            const product = await this.findProductById(productId);
            if (!product) {
                logger.error(`Product with ID: ${productId} not found`);
                return null;
            }
            const partner = await db.partners.findOne({ where: { user_id: partnerId } })

            if (product.partner_id !== partner?.dataValues.id) {
                logger.error(`Product type with ID: ${productId} does not belong to partner ID: ${partnerId}`);
                throw new Error('Unauthorized to delete this product type');
            }
            const updatedProduct = await product.update(data, {
                where: { id: productId, partner_id: partner!.dataValues.id },
                returning: true
            });
            logger.info(`Product updated with ID: ${productId}`);
            return updatedProduct;
        } catch (error) {
            logger.error(`Error updating product: ${(error as Error).message}`);
            throw error;
        }
    }
    async deleteOneProduct(productId: number, partnerId: number, status: number): Promise<boolean> {
        try {
            const product = await this.findProductById(productId);
            if (!product) {
                logger.error(`Product with ID: ${productId} not found for deletion`);
                return false;
            }

            const partner = await db.partners.findOne({ where: { user_id: partnerId } })

            if (product.partner_id !== partner?.dataValues.id) {
                logger.error(`Product with ID: ${productId} does not belong to partner ID: ${partnerId}`);
                throw new Error('Unauthorized to switch Status this product');
            }
            const deleteCount = await product.update({ is_active: status }, { where: { id: productId, partner_id: partner!.dataValues.id } });
            logger.info(`Product switch Status with ID: ${partnerId}`);
            // logger.info(`Product deleted with ID: ${productId}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting product: ${(error as Error).message}`);
            throw error;
        }
    }
    async findAllActiveProducts(options: {
        searchText?: string,
        limit?: number,
        page?: number,
        getAllData?: boolean,
        shop_id?: number
    }) {
        const { searchText, limit, page, getAllData = false, shop_id } = options;
        const parsedLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;
        const parsedPage = parseInt(String(page), 10) || 1;
        // ถ้า getAllData = true → ดึงทั้งหมด ไม่แบ่งหน้า
        const offset = getAllData ? undefined : (parsedPage - 1) * parsedLimit;
        const queryLimit = getAllData ? undefined : parsedLimit;

        // สร้างเงื่อนไข where
        const whereClause: any = {
            //  partner_id: partner?.dataValues.id,
        };

        // ✅ กรอง shop_id ถ้ามี
        if (shop_id) {
            whereClause.partner_id = shop_id; // หรือ shop_id ขึ้นอยู่กับชื่อ column
        }

        // ถ้ามี searchText → ค้นหาในชื่อ (หรือ field อื่นที่ต้องการ)
        if (searchText && searchText.trim()) {
            whereClause.product_name = {
                [Op.like]: `%${searchText.trim()}%`,
            };
            // ถ้าต้องการค้นหาหลาย field เช่น code หรือ description
            // whereClause[Op.or] = [
            //   { name: { [Op.like]: `%${searchText.trim()}%` } },
            //   { description: { [Op.like]: `%${searchText.trim()}%` } },
            // ];
        }
        const result = await db.products.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.product_types,
                    as: 'productType',
                    attributes: ['id', 'type_name']
                }
            ],
            limit: queryLimit,
            offset,
            order: [['product_name', 'ASC']], // หรือเรียงตาม field ที่ต้องการ เช่น created_at DESC
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

    async findProductsByType(productTypeId: number): Promise<products[]> {
        return await db.products.findAll({ where: { productType_id: productTypeId, is_active: 1 } });
    }

    async findProductsByTypeAndPartner(productTypeId: number, partnerId: number): Promise<products[]> {
        return await db.products.findAll({ where: { productType_id: productTypeId, partner_id: partnerId, is_active: 1 } });
    }

    async findProductsByPriceRange(minPrice: number, maxPrice: number): Promise<products[]> {
        return await db.products.findAll({ where: { price: { [Op.between]: [minPrice, maxPrice] }, is_active: 1 } });
    }

    async deleteAllProductsByPartnerId(partnerId: number): Promise<number> {
        try {
            const partner = await db.partners.findOne({ where: { user_id: partnerId } })
            const product = await db.products.findAll({ where: { partner_id: partner!.dataValues.id } });
            if (product.length === 0) {
                logger.error(`No products found for partner ID: ${partnerId} to delete`);
                return 0;
            }
            const deleteCount = await db.products.update({ is_active: 0 }, { where: { partner_id: partner!.dataValues.id } });
            logger.info(`Deleted ${deleteCount[0]} products for partner ID: ${partnerId}`);
            return deleteCount[0];

        } catch (error) {
            logger.error(`Error deleting products for partner ID: ${partnerId} - ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new ProductRepository();