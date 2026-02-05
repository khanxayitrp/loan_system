import { product_types } from './../models/product_types';
import { Request, Response } from 'express';
import ProductTypeRepo from '../repositories/product_type.repo';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, InternalServerError, handleErrorResponse } from '../utils/errors';

class ProductTypeController {

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
    public async createProductType(req: Request, res: Response) {
        try {
            const data = req.body;
            const newProductType = await ProductTypeRepo.createProductType(data);
            return res.status(201).json({ message: 'สร้างประเภทสินค้าเรียบร้อย', productType: newProductType });
        } catch (error: any) {
            logger.error('Error in createProductType controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างประเภทสินค้า', error: error.message });
        }
    }
    public async getAllProducttypes(req: Request, res: Response) {
        try {
            const {
                searchText,
                limit,
                page,
                getAllData
            } = req.query;

            //Validate parameters 
            const validationErrors = ProductTypeController.validateQueryParams(req.query);
            if (validationErrors.length > 0) {
                res.status(400).json({ message: 'Invalid query parameters', validationErrors});
                return;
            }
            const options = {
                search: searchText as string,
                limit: Number(limit),
                page: Number(page),
                getAllData: getAllData === 'true'
            };
            const productType = await ProductTypeRepo.findAllActiveProductTypes(options);
            return res.status(200).json({ productTypes: productType });  
        } catch (error: any) {
            logger.error('Error in getAllProducttypes controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า', error: error.message });
        }
    }
    // /**
    //      * Validate query parameters
    //      */
    // private validateQueryParams(query: any): string[] {
    //     const errors: string[] = [];

    //     if (query.limit && (isNaN(Number(query.limit)) || Number(query.limit) < 1)) {
    //         errors.push('Limit must be a positive number');
    //     }

    //     if (query.page && (isNaN(Number(query.page)) || Number(query.page) < 1)) {
    //         errors.push('Page must be a positive number');
    //     }

    //     if (query.getAllData && !['true', 'false'].includes(query.getAllData)) {
    //         errors.push('getAllData must be true or false');
    //     }

    //     return errors;
    // }
    public async getProductTypeById(req: Request, res: Response) {
        try {
            const productTypeId = parseInt(req.params.id, 10);
            const productType = await ProductTypeRepo.findProductTypeById(productTypeId);
            return res.status(200).json({ productTypes: productType });
        } catch (error: any) {
            logger.error('Error in getProductTypeById controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า', error: error.message });
        }
    }
    public async updateProductType(req: Request, res: Response) {
        try {
            
            const productTypeId = parseInt(req.params.id, 10);
            const partnerId = req.userPayload?.userId as number;
            const data = req.body;
            
            const updatedProductType = await ProductTypeRepo.updateProductType(productTypeId, partnerId, data);
            return res.status(200).json({ message: 'อัปเดตประเภทสินค้าเรียบร้อย', productType: updatedProductType });
        } catch (error: any) {
            logger.error('Error in updateProductType controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตประเภทสินค้า', error: error.message });
        }
    }
    public async deActivatedProductType(req: Request, res: Response) {
        try {
            const productTypeId = parseInt(req.params.id, 10);
            const partnerId = req.userPayload?.userId as number;
            const updatedProductType = await ProductTypeRepo.deleteProductType(productTypeId, partnerId);
            return res.status(200).json({ message: 'ปิดใช้งานประเภทสินค้าเรียบร้อย', productType: updatedProductType });
        } catch (error: any) {
            logger.error('Error in deActivatedProductType controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปิดใช้งานประเภทสินค้า', error: error.message });
        }
    }
}

export default new ProductTypeController();