import { products, productsAttributes, productsCreationAttributes } from "@/models/products";
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op, Sequelize, where } from 'sequelize';

class ProductRepository {
    async createProduct(data: productsCreationAttributes): Promise<products> {
        try {
            const cleanProduct = { ...data };

            if (!cleanProduct.id || cleanProduct.id === 0) {
                throw new Error('Product ID is required');
            }
            if (!cleanProduct.partner_id || cleanProduct.partner_id === 0) {
                throw new Error('Product partner ID is required');
            }

            const existProduct = await db.products.findOne({ where: { id: cleanProduct.id } });
            if (existProduct) {
                logger.error(`Product with ID already exists: ${cleanProduct.id}`);
                throw new Error('Product with ID already exists');
            }

            const mapData: any = {
                // id: cleanProduct.id,
                partner_id: cleanProduct.partner_id,
                product_type_id: cleanProduct.product_type_id || null,
                product_name: cleanProduct.product_name,
                description: cleanProduct.description,
                price: cleanProduct.price,
                interest_rate: cleanProduct.interest_rate,
                image_url: cleanProduct.image_url || null,
                gallery: cleanProduct.gallery || null,
                is_active: 1,
            };
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
    async updateProduct(productId: number, data: Partial<productsAttributes>): Promise<products | null> {
        try {
            const product = await this.findProductById(productId);
            if (!product) {
                logger.error(`Product with ID: ${productId} not found`);
                return null;
            }
            const updatedProduct = await product.update(data, {
                where: { id: productId },
                returning: true
            });
            logger.info(`Product updated with ID: ${productId}`);
            return updatedProduct;
        } catch (error) {
            logger.error(`Error updating product: ${(error as Error).message}`);
            throw error;
        }
    }
    async deleteOneProduct(productId: number): Promise<boolean> {
        try {
            const product = await this.findProductById(productId);
            if (!product) {
                logger.error(`Product with ID: ${productId} not found for deletion`);
                return false;
            }
            const deleteCount = await product.update({ is_active: 0 }, { where: { id: productId } });
            logger.info(`Product deleted with ID: ${productId}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting product: ${(error as Error).message}`);
            throw error;
        }
    }
    async findAllActiveProducts(): Promise<products[]> {
        return await db.products.findAll({ where: { is_active: 1 } });
    }

    async findProductsByType(productTypeId: number): Promise<products[]> {
        return await db.products.findAll({ where: { product_type_id: productTypeId, is_active: 1 } });
    }

    async findProductsByTypeAndPartner(productTypeId: number, partnerId: number): Promise<products[]> {
        return await db.products.findAll({ where: { product_type_id: productTypeId, partner_id: partnerId, is_active: 1 } });
    }

    async findProductsByPriceRange(minPrice: number, maxPrice: number): Promise<products[]> {
        return await db.products.findAll({ where: { price: { [Op.between]: [minPrice, maxPrice] }, is_active: 1 } });
    }

    async deleteAllProductsByPartnerId(partnerId: number): Promise<number> {
        try {
            const product = await db.products.findAll({ where: { partner_id: partnerId } });
            if (product.length === 0) {
                logger.error(`No products found for partner ID: ${partnerId} to delete`);
                return 0;
            }
            const deleteCount = await db.products.update({ is_active: 0 }, { where: { partner_id: partnerId } });
            logger.info(`Deleted ${deleteCount[0]} products for partner ID: ${partnerId}`);
            return deleteCount[0];

        } catch (error) {
            logger.error(`Error deleting products for partner ID: ${partnerId} - ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new ProductRepository();