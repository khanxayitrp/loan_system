import { Request, Response } from 'express'
import productRepo from '../repositories/product.repo'
import { logger } from '../utils/logger'
import { products } from '../models/products'
import { NotFoundError, ValidationError, handleErrorResponse } from '../utils/errors';
import { db } from '../models/init-models'

class ProductController {
    public static validateQueryParams(query: any): string[] {
        const errors: string[] = [];

        if (query.limit && (isNaN(Number(query.limit)) || Number(query.limit) < 1)) {
            errors.push('Limit must be a positive number');
        }

        if (query.page && (isNaN(Number(query.page)) || Number(query.page) < 1)) {
            errors.push('Page must be a positive number');
        }

        if (query.getAllData && !['true', 'false'].includes(query.getAllData as string)) {
            errors.push('getAllData must be true or false');
        }

        return errors;
    }

    public async createProduct(req: Request, res: Response) {
        try {
            if (!req.userPayload) {
                console.log('[CONTROLLER] No userPayload found - unauthenticated request');
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່'
                });
            }
            const userId = req.userPayload?.userId

            if (!userId) {
                return res.status(401).json({ message: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ' });
            }

            // ✅ ค้นหา partner record ที่เชื่อมกับ user นี้
            const partner = await db.partners.findOne({
                where: { user_id: userId },
                attributes: ['id']
            });

            if (!partner) {
                return res.status(403).json({
                    message: 'ຜູ້ໃຊ້ນີ້ບໍ່ມີສິດເປັນພານເນີ'
                });
            }
            const data = req.body;
            const mapData = {
                partner_id: partner.dataValues.id,
                productType_id: data.productType_id,
                product_name: data.product_name,
                brand: data.brand,
                model: data.model,
                price: data.price,
                interest_rate: data.interest_rate,
                image_url: data.image_url || null,
                // gallery: data.gallery || null,
                is_active: data.is_active,
            }
            const newProduct = await productRepo.createProduct(mapData);
            return res.status(201).json({ message: 'ສ້າງສິນຄ້າສຳເລັດ', data: newProduct });
        } catch (error: any) {
            logger.error('Error in createProductType controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງສິນຄ້າ', error: error.message });
        }
    }

    public async getProductById(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id, 10);
            const product = await productRepo.findProductById(productId)
            return res.status(200).json({ products: product });
        } catch (error: any) {
            logger.error('Error in getProductById controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງສິນຄ້າ', error: error.message });
        }
    }

    public async getAllProduct(req: Request, res: Response) {
        try {
            const {
                searchText,
                limit,
                page,
                getAllData,
                shop_id // ✅ เพิ่ม: รับ shop_id จาก query params
            } = req.query;

            // const userId = req.userPayload?.userId as number;

            //Validate parameters 
            const validationErrors = ProductController.validateQueryParams(req.query);
            if (validationErrors.length > 0) {
                res.status(400).json({ message: 'Invalid query parameters', validationErrors });
                return;
            }
            const options = {
                search: searchText as string,
                limit: Number(limit),
                page: Number(page),
                getAllData: getAllData === 'true', 
                shop_id: shop_id ? Number(shop_id) : undefined // ✅ เพิ่ม shop_id
            };
            const product = await productRepo.findAllActiveProducts(options);
            return res.status(200).json({ products: product });
        } catch (error: any) {
            logger.error('Error in getAllProduct controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງປະເພດສິນຄ້າ', error: error.message });
        }
    }
    public async updateProduct(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id, 10);
            const partnerId = req.userPayload?.userId as number;
            const data = req.body;
            const updateProduct = await productRepo.updateProduct(productId, partnerId, data);
            return res.status(200).json({ message: 'ອັບເດດສຶນຄ້າສຳເລັດ', data: updateProduct });
        } catch (error: any) {
            logger.error('Error in updateProduct controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການອັບເດດສິນຄ້າ', error: error.message });
        }
    }

    public async deActivatedOneProduct(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id, 10);
            console.log('productId is :', productId)
            const {is_active} = req.body
            console.log('check status for switch ', is_active)
            if (is_active === undefined || is_active === null) {
                throw new ValidationError('ກະລຸນາລະບູສະຖານະ is_active');
            }
            const partnerId = req.userPayload?.userId as number;
            const success = await productRepo.deleteOneProduct(productId, partnerId, is_active);
            if (!success) {
                throw new NotFoundError(
                    is_active === 1 ? 'ບໍ່ພົບສິນຄ້າທີ່ຕ້ອງການປິດໃຊ້ງານ' : 'ບໍ່ພົບສິນຄ້າທີ່ຕ້ອງການເປີດໃຊ້ງານ');
                // return res.status(404).json({ message });
            }
            return res.status(200).json({ success: true, message: is_active === 1 ? 'ປິດໃຊ້ງານສິນຄ້າສຳເລັດ' : 'ເປີດໃຊ້ງານສິນຄ້າສຳເລັດ' });
            // return res.status(200).json({ message: 'ປິດການໃຊ້ງານສິນຄ້າສຳເລັດ', product: updatedProduct });
        } catch (error: any) {
            logger.error('Error in deActivatedOneProduct controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການປິດການໃຊ້ງານສິນຄ້າ', error: error.message });
        }
    }

    public async deActivatedAllProductByPartnerId(req: Request, res: Response) {
        try {
            const partnerId = req.userPayload?.userId as number;
            const updatedProduct = await productRepo.deleteAllProductsByPartnerId(partnerId);
            return res.status(200).json({ message: 'ປິດການໃຊ້ງານສິນຄ້າສຳເລັດ', product: updatedProduct });
        } catch (error: any) {
            logger.error('Error in deActivatedAllProductByPartnerId controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດໃນການປິດການໃຊ້ງານສິນຄ້າ', error: error.message });
        }
    }
}

export default new ProductController();