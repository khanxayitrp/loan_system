"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const product_repo_1 = __importDefault(require("../repositories/product.repo"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const init_models_1 = require("../models/init-models");
const redis_service_1 = __importDefault(require("../services/redis.service"));
const xlsx = __importStar(require("xlsx"));
// 🟢 1. Import ระบบ Audit Log เข้ามา
const auditLogger_1 = require("../utils/auditLogger");
const sequelize_1 = require("sequelize");
class ProductController {
    // =======================================================
    // 🛠️ 1. ตรวจสอบ Query Params
    // =======================================================
    static validateQueryParams(query) {
        const errors = [];
        if (query.limit && (isNaN(Number(query.limit)) || Number(query.limit) < 1))
            errors.push('Limit must be a positive number');
        if (query.page && (isNaN(Number(query.page)) || Number(query.page) < 1))
            errors.push('Page must be a positive number');
        if (query.getAllData && !['true', 'false'].includes(query.getAllData))
            errors.push('getAllData must be true or false');
        return errors;
    }
    // =======================================================
    // 🛠️ 2. สร้าง System SKU (Logic เดิมที่ถูกต้อง)
    // =======================================================
    static async generateSystemSku(partnerId, globalCategoryId, modelName, variantName) {
        const pId = String(partnerId).padStart(3, '0');
        let prefix = 'LOC';
        if (globalCategoryId) {
            try {
                const category = await init_models_1.db.global_categories.findOne({
                    where: { id: globalCategoryId },
                    attributes: ['prefix_code']
                });
                if (category?.prefix_code)
                    prefix = category.prefix_code.toUpperCase();
            }
            catch (err) {
                logger_1.logger.warn('Could not fetch global_category for SKU generation', { error: err });
            }
        }
        const modelCode = (modelName || 'BASE').toUpperCase().replace(/\s+/g, '').substring(0, 10);
        if (variantName) {
            const vCode = variantName.toUpperCase().replace(/\s+/g, '').substring(0, 10);
            return `${pId}-${prefix}-${modelCode}-${vCode}`;
        }
        else {
            const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `${pId}-${prefix}-${modelCode}-${uniqueSuffix}`;
        }
    }
    // =======================================================
    // 🟢 3. สร้างสินค้าใหม่ (With Transaction, Robust Variants & Audit Log)
    // =======================================================
    async createProduct(req, res, next) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const userId = req.userPayload?.userId;
            if (!userId)
                throw new errors_1.UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່');
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: userId }, attributes: ['id'] });
            if (!partner)
                throw new errors_1.UnauthorizedError('ຜູ້ໃຊ້ນີ້ບໍ່ມີສິດເປັນພານເນີ');
            const { variants, ...data } = req.body;
            if (!data.product_name)
                throw new errors_1.ValidationError('ກະລຸນາລະບຸຊື່ສິນຄ້າ');
            const baseSystemSku = await ProductController.generateSystemSku(partner.id, data.global_category_id || null, data.model);
            const productData = {
                ...data,
                partner_id: partner.id,
                system_sku: baseSystemSku,
                reserved_stock: 0,
                is_active: data.is_active ?? 1
            };
            // บันทึกสินค้าหลัก
            const newProduct = await init_models_1.db.products.create(productData, { transaction: t });
            // 🟢 บันทึก Audit Log สำหรับสินค้าหลัก (CREATE)
            await (0, auditLogger_1.logAudit)('products', newProduct.id, 'CREATE', null, newProduct.toJSON(), userId, t);
            // จัดการ Variants (ถ้ามี)
            if (variants && Array.isArray(variants) && variants.length > 0) {
                const variantsToInsert = await Promise.all(variants.map(async (v) => {
                    const variantCode = `${v.color || ''}${v.size_or_capacity || ''}`;
                    const variantSku = variantCode
                        ? await ProductController.generateSystemSku(partner.id, data.global_category_id, data.model, variantCode)
                        : `${baseSystemSku}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
                    return {
                        product_id: newProduct.id,
                        system_sku: variantSku,
                        merchant_sku: v.merchant_sku || null,
                        color: v.color || null,
                        size_or_capacity: v.size_or_capacity || null,
                        weight_gram: v.weight_gram || 0,
                        price: v.price || data.price,
                        stock_quantity: v.stock_quantity || 0,
                        image_url: v.image_url || null
                    };
                }));
                const createdVariants = await init_models_1.db.product_variants.bulkCreate(variantsToInsert, { transaction: t });
                // 🟢 บันทึก Audit Log สำหรับ Variants (วนลูปเก็บทีละตัว)
                for (const variant of createdVariants) {
                    await (0, auditLogger_1.logAudit)('product_variants', variant.id || 0, 'CREATE', null, variant.toJSON(), userId, t);
                }
            }
            await t.commit();
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(201).json({
                success: true,
                message: 'ສ້າງສິນຄ້າສຳເລັດ',
                data: newProduct
            });
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error('Create Product Error:', error);
            next(error);
        }
    }
    // =======================================================
    // 🟢 4. นำเข้าสินค้าจาก Excel (With Transaction & Audit Log)
    // =======================================================
    // =======================================================
    // 🟢 4. นำเข้าสินค้าจาก Excel (With Transaction & Smart Grouping)
    // =======================================================
    async importProductsFromExcel(req, res, next) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const userId = req.userPayload?.userId;
            if (!userId)
                throw new errors_1.UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່');
            if (!req.file)
                throw new errors_1.ValidationError('ກະລຸນາອັບໂຫຼດໄຟລ໌ Excel');
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: userId }, attributes: ['id'] });
            if (!partner)
                throw new errors_1.UnauthorizedError('ຜູ້ໃຊ້ນີ້ບໍ່ມີສິດເປັນພານເນີ');
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
            if (!rawData?.length)
                throw new errors_1.ValidationError('ບໍ່ພົບຂໍ້ມູນໃນໄຟລ໌ Excel');
            // 🌟 1. จัดกลุ่มอัจฉริยะ: ใช้ Parent SKU ก่อน ถ้าไม่มีให้ใช้ "ชื่อสินค้า" เป็นตัวจัดกลุ่มแทน
            const groupedProducts = new Map();
            rawData.forEach((row) => {
                // ดึงค่า SKU หรือ ชื่อสินค้า มาเป็น Key ในการจัดกลุ่ม
                const groupKey = row['Parent_Merchant_SKU'] || row['ລະຫັດສິນຄ້າຮ້ານ (ຫຼັກ)'] || row['Product_Name'] || row['ຊື່ສິນຄ້າ'];
                if (groupKey && String(groupKey).trim() !== '') {
                    const keyString = String(groupKey).trim();
                    if (!groupedProducts.has(keyString))
                        groupedProducts.set(keyString, []);
                    groupedProducts.get(keyString).push(row);
                }
            });
            let importedCount = 0;
            for (const [groupKey, rows] of groupedProducts.entries()) {
                // หาแถวแรกสุดที่มีชื่อสินค้า (บางทีแถวแรกร้านค้าอาจจะเว้นชื่อสินค้าไว้ แต่ใส่ในแถวที่ 2)
                const mainRow = rows.find(r => r['Product_Name'] || r['ຊື່ສິນຄ້າ']) || rows[0];
                const productName = String(mainRow['Product_Name'] || mainRow['ຊື່ສິນຄ້າ'] || '');
                if (!productName)
                    continue; // ถ้าหาชื่อสินค้าไม่เจอเลย ให้ข้ามกลุ่มนี้ไป
                let globalCategoryId = null;
                const prefixCode = mainRow['Global_Cat_Prefix'] || mainRow['ຕົວຫຍໍ້ໝວດໝູ່ຫຼັກ'];
                if (prefixCode) {
                    const category = await init_models_1.db.global_categories.findOne({
                        where: { prefix_code: prefixCode },
                        attributes: ['id']
                    });
                    if (category)
                        globalCategoryId = category.id;
                }
                const model = String(mainRow['Model'] || mainRow['ລຸ້ນ'] || '');
                const basePrice = Number(mainRow['Price'] || mainRow['ລາຄາ'] || 0);
                // คำนวณสต๊อกรวมจากทุกแถวในกลุ่ม
                const totalStock = rows.reduce((sum, r) => sum + Number(r['Stock'] || r['ສະຕັອກ'] || 0), 0);
                const baseSystemSku = await ProductController.generateSystemSku(partner.id, globalCategoryId, model);
                // บันทึกสินค้าหลัก
                const newProduct = await init_models_1.db.products.create({
                    partner_id: partner.id,
                    productType_id: Number(mainRow['Local_Cat_ID'] || mainRow['ລະຫັດປະເພດສິນຄ້າ'] || 1),
                    global_category_id: globalCategoryId || undefined,
                    system_sku: baseSystemSku,
                    merchant_sku: mainRow['Parent_Merchant_SKU'] || mainRow['ລະຫັດສິນຄ້າຮ້ານ (ຫຼັກ)'] || null, // ใช้ SKU ถ้ามี
                    product_name: productName,
                    brand: String(mainRow['Brand'] || mainRow['ຍີ່ຫໍ້'] || ''),
                    model: model,
                    price: basePrice,
                    stock_quantity: totalStock,
                    allowed_loan_type: mainRow['Allowed_Loan_Type'] || mainRow['ປະເພດການຜ່ອນ'] || 'both',
                    description: String(mainRow['ລາຍລະອຽດ'] || ''),
                    is_active: 1
                }, { transaction: t });
                // 🟢 บันทึก Audit Log สำหรับสินค้าที่ Import (CREATE)
                await (0, auditLogger_1.logAudit)('products', newProduct.id, 'CREATE', null, newProduct.toJSON(), userId, t);
                const variants = [];
                for (const row of rows) {
                    const variantSku = row['Variant_Merchant_SKU'] || row['ລະຫັດສິນຄ້າຮ້ານ (ຍ່ອຍ)'];
                    const color = row['Color'] || row['ສີ'];
                    const size = row['Size_Capacity'] || row['ຂະໜາດ/ຄວາມຈຸ'];
                    // 🌟 สร้าง Variant เมื่อมีข้อมูลระบุความต่าง หรือเป็นสินค้าชิ้นเดียวที่บังคับสร้าง Variant
                    if (color || size || variantSku || rows.length === 1) {
                        const vCode = `${color || ''}${size || ''}`;
                        const vSystemSku = await ProductController.generateSystemSku(partner.id, globalCategoryId, model, vCode);
                        variants.push({
                            product_id: newProduct.id,
                            system_sku: vSystemSku,
                            merchant_sku: variantSku || null,
                            color: color || null,
                            size_or_capacity: size || null,
                            price: Number(row['Price'] || row['ລາຄາ'] || basePrice),
                            stock_quantity: Number(row['Stock'] || row['ສະຕັອກ'] || 0),
                            weight_gram: Number(row['Weight_Gram'] || row['ນ້ຳໜັກ(ກຣາມ)'] || 0),
                            image_url: row['Image_URL'] || row['ລິ້ງຮູບພາບ'] || null
                        });
                    }
                }
                if (variants.length > 0) {
                    const createdVariants = await init_models_1.db.product_variants.bulkCreate(variants, { transaction: t });
                    // 🟢 บันทึก Audit Log สำหรับ Variants ที่ Import
                    for (const variant of createdVariants) {
                        await (0, auditLogger_1.logAudit)('product_variants', variant.id || 0, 'CREATE', null, variant.toJSON(), userId, t);
                    }
                }
                importedCount++;
            }
            await t.commit();
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(201).json({ success: true, message: 'ນຳເຂົ້າສິນຄ້າສຳເລັດ', importedCount });
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error('Import Product Error:', error);
            // ====================================================================
            // 🌟 ดักจับ Error รหัส SKU ซ้ำกัน (ครอบคลุมทั้งตารางหลัก และ ตารางย่อย)
            // ====================================================================
            if (error.name === 'SequelizeUniqueConstraintError') {
                const duplicateError = error.errors?.find((e) => e.path === 'unique_merchant_sku' || // ของตาราง variants
                    e.path === 'product_variants.unique_merchant_sku' || // ของตาราง variants (บางเวอร์ชัน)
                    e.path === 'unique_product_merchant_sku' || // 🟢 เพิ่มของตาราง products
                    e.path === 'products.unique_product_merchant_sku' // 🟢 เพิ่มของตาราง products (บางเวอร์ชัน)
                );
                if (duplicateError) {
                    // ตัดเอาเฉพาะรหัส SKU มาแสดง (เอาตัวเลข ID ด้านหน้าออก)
                    const rawValue = duplicateError.value || '';
                    const skuOnly = rawValue.includes('-') ? rawValue.split('-').slice(1).join('-') : rawValue;
                    // ส่ง Status 400 พร้อมข้อความแจ้งเตือนภาษาลาว
                    return res.status(400).json({
                        success: false,
                        message: `ພົບລະຫັດສິນຄ້າຊ້ຳກັນ: '${skuOnly}' ໃນຖານຂໍ້ມູນ ຫຼື ໄຟລ໌ Excel. ກະລຸນາກວດສອບ ແລະ ແກ້ໄຂລະຫັດ Merchant SKU ບໍ່ໃຫ້ຊ້ຳກັນ.`
                    });
                }
            }
            // ถ้าเป็น Error อื่นๆ ให้โยนไปหา Error Handler หลัก
            next(error);
        }
    }
    // public async importProductsFromExcel(req: Request, res: Response, next: NextFunction) {
    //     const t = await db.sequelize.transaction();
    //     try {
    //         const userId = req.userPayload?.userId;
    //         if (!userId) throw new UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່');
    //         if (!req.file) throw new ValidationError('ກະລຸນາອັບໂຫຼດໄຟລ໌ Excel');
    //         const partner = await db.partners.findOne({ where: { user_id: userId }, attributes: ['id'] });
    //         if (!partner) throw new UnauthorizedError('ຜູ້ໃຊ້ນີ້ບໍ່ມີສິດເປັນພານເນີ');
    //         const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    //         const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    //         if (!rawData?.length) throw new ValidationError('ບໍ່ພົບຂໍ້ມູນໃນໄຟລ໌ Excel');
    //         const groupedProducts = new Map<string, any[]>();
    //         rawData.forEach((row: any) => {
    //             const parentSku = row['Parent_Merchant_SKU'] || row['ລະຫັດສິນຄ້າຮ້ານ (ຫຼັກ)'];
    //             if (parentSku) {
    //                 if (!groupedProducts.has(parentSku)) groupedProducts.set(parentSku, []);
    //                 groupedProducts.get(parentSku)!.push(row);
    //             }
    //         });
    //         let importedCount = 0;
    //         for (const [parentSku, rows] of groupedProducts.entries()) {
    //             const mainRow = rows[0];
    //             let globalCategoryId = null;
    //             const prefixCode = mainRow['Global_Cat_Prefix'] || mainRow['ຕົວຫຍໍ້ໝວດໝູ່ຫຼັກ'];
    //             if (prefixCode) {
    //                 const category: any = await db.global_categories.findOne({
    //                     where: { prefix_code: prefixCode },
    //                     attributes: ['id']
    //                 });
    //                 if (category) globalCategoryId = category.id;
    //             }
    //             const model = String(mainRow['Model'] || mainRow['ລຸ້ນ'] || '');
    //             const productName = String(mainRow['Product_Name'] || mainRow['ຊື່ສິນຄ້າ'] || '');
    //             if (!productName) continue;
    //             const basePrice = Number(mainRow['Price'] || mainRow['ລາຄາ'] || 0);
    //             const totalStock = rows.reduce((sum, r) => sum + Number(r['Stock'] || r['ສະຕັອກ'] || 0), 0);
    //             const baseSystemSku = await ProductController.generateSystemSku(partner.id, globalCategoryId, model);
    //             // บันทึกสินค้าหลัก
    //             const newProduct = await db.products.create({
    //                 partner_id: partner.id,
    //                 productType_id: Number(mainRow['Local_Cat_ID'] || mainRow['ລະຫັດປະເພດສິນຄ້າ'] || 1),
    //                 global_category_id: globalCategoryId || undefined,
    //                 system_sku: baseSystemSku,
    //                 merchant_sku: parentSku,
    //                 product_name: productName,
    //                 brand: String(mainRow['Brand'] || mainRow['ຍີ່ຫໍ້'] || ''),
    //                 model: model,
    //                 price: basePrice,
    //                 stock_quantity: totalStock,
    //                 allowed_loan_type: mainRow['Allowed_Loan_Type'] || mainRow['ປະເພດການຜ່ອນ'] || 'both',
    //                 description: String(mainRow['ລາຍລະອຽດ'] || ''),
    //                 is_active: 1
    //             }, { transaction: t });
    //             // 🟢 บันทึก Audit Log สำหรับสินค้าที่ Import (CREATE)
    //             await logAudit('products', newProduct.id, 'CREATE', null, newProduct.toJSON(), userId, t);
    //             const variants = [];
    //             for (const row of rows) {
    //                 const variantSku = row['Variant_Merchant_SKU'] || row['ລະຫັດສິນຄ້າຮ້ານ (ຍ່ອຍ)'];
    //                 const color = row['Color'] || row['ສີ'];
    //                 const size = row['Size_Capacity'] || row['ຂະໜາດ/ຄວາມຈຸ'];
    //                 if (color || size || variantSku) {
    //                     const vCode = `${color || ''}${size || ''}`;
    //                     const vSystemSku = await ProductController.generateSystemSku(partner.id, globalCategoryId, model, vCode);
    //                     variants.push({
    //                         product_id: newProduct.id,
    //                         system_sku: vSystemSku,
    //                         merchant_sku: variantSku || null,
    //                         color: color || null,
    //                         size_or_capacity: size || null,
    //                         price: Number(row['Price'] || row['ລາຄາ'] || basePrice),
    //                         stock_quantity: Number(row['Stock'] || row['ສະຕັອກ'] || 0),
    //                         weight_gram: Number(row['ນ້ຳໜັກ(ກຣາມ)'] || 0),
    //                         image_url: row['Image_URL'] || row['ລິ້ງຮູບພາບ'] || null
    //                     });
    //                 }
    //             }
    //             if (variants.length > 0) {
    //                 const createdVariants = await db.product_variants.bulkCreate(variants, { transaction: t });
    //                 // 🟢 บันทึก Audit Log สำหรับ Variants ที่ Import
    //                 for (const variant of createdVariants) {
    //                     await logAudit('product_variants', variant.id || 0, 'CREATE', null, variant.toJSON(), userId, t);
    //                 }
    //             }
    //             importedCount++;
    //         }
    //         await t.commit();
    //         await redisService.delByPattern('cache:products:*');
    //         return res.status(201).json({ success: true, message: 'ນຳເຂົ້າສິນຄ້າສຳເລັດ', importedCount });
    //     } catch (error: any) {
    //         await t.rollback();
    //         logger.error('Import Product Error:', error);
    //         next(error);
    //     }
    // }
    // =======================================================
    // 🟢 5. ดึงข้อมูล (Get By ID & All)
    // =======================================================
    async getProductById(req, res, next) {
        try {
            const productId = parseInt(req.params.id, 10);
            const cacheKey = `cache:products:detail:${productId}`;
            const cached = await redis_service_1.default.get(cacheKey);
            if (cached)
                return res.status(200).json({ success: true, data: JSON.parse(cached) });
            const product = await product_repo_1.default.findProductById(productId);
            if (!product)
                throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນສິນຄ້າ');
            await redis_service_1.default.set(cacheKey, JSON.stringify(product), 3600);
            return res.status(200).json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllProduct(req, res, next) {
        try {
            console.log('✅ เข้ามาถึง ProductController แล้ว', req.query);
            const validationErrors = ProductController.validateQueryParams(req.query);
            if (validationErrors.length > 0)
                throw new errors_1.ValidationError(validationErrors.join(', '));
            const { search, searchText, status, type, limit, page, getAllData, shop_id } = req.query;
            // const options = {
            //     search: (search || searchText) as string,
            //     limit: Number(limit),
            //     page: Number(page),
            //     getAllData: getAllData === 'true',
            //     shop_id: shop_id ? Number(shop_id) : undefined,
            //     is_active: status !== undefined ? Number(status) : undefined,
            //     productType_id: type !== undefined ? Number(type) : undefined
            // };
            // 🟢 แก้ไขการเช็คค่าว่างเพื่อป้องกัน Number("") กลายเป็น 0
            const options = {
                search: (search || searchText),
                limit: Number(limit),
                page: Number(page),
                getAllData: getAllData === 'true',
                // เช็คให้ชัวร์ว่าไม่ใช่ค่าว่างก่อนนำไปแปลงเป็น Number
                shop_id: (shop_id !== undefined && shop_id !== '') ? Number(shop_id) : undefined,
                is_active: (status !== undefined && status !== '') ? Number(status) : undefined,
                productType_id: (type !== undefined && type !== '') ? Number(type) : undefined
            };
            const cacheKey = `cache:products:list:${JSON.stringify(options)}`;
            const cached = await redis_service_1.default.get(cacheKey);
            if (cached)
                return res.status(200).json({ success: true, data: JSON.parse(cached) });
            const result = await product_repo_1.default.findAllActiveProducts(options);
            await redis_service_1.default.set(cacheKey, JSON.stringify(result), 3600);
            return res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    // =======================================================
    // 🟢 6. อัปเดตข้อมูล (Update & Status Change)
    // =======================================================
    async updateProduct(req, res, next) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const productId = parseInt(req.params.id, 10);
            const userId = req.userPayload?.userId;
            // 1. ตรวจสอบสิทธิ์พาร์ทเนอร์
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: userId }, attributes: ['id'] });
            if (!partner)
                throw new errors_1.UnauthorizedError('ຜູ້ໃຊ້ນີ້ບໍ່ມີສິດເປັນພານເນີ');
            // 2. ค้นหาสินค้าเดิมที่จะแก้ไข
            const product = await init_models_1.db.products.findOne({
                where: { id: productId, partner_id: partner.id },
                transaction: t
            });
            if (!product) {
                throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນສິນຄ້າ ຫຼື ທ່ານບໍ່ມີສິດແກ້ໄຂ');
            }
            const { variants, ...updateData } = req.body;
            const oldProductData = product.toJSON();
            // 3. อัปเดตข้อมูลสินค้าหลัก (กรองเฉพาะฟิลด์ที่อนุญาต)
            const allowedFields = [
                'productType_id', 'global_category_id', 'product_name',
                'description', 'brand', 'model', 'price', 'image_url',
                'merchant_sku', 'stock_quantity', 'reserved_stock', 'allowed_loan_type', 'is_active'
            ];
            const filteredUpdateData = {};
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    filteredUpdateData[field] = updateData[field];
                }
            }
            await product.update(filteredUpdateData, { transaction: t });
            // 🟢 บันทึก Audit Log สำหรับสินค้าหลัก (UPDATE)
            await (0, auditLogger_1.logAudit)('products', productId, 'UPDATE', oldProductData, filteredUpdateData, userId, t);
            // ==========================================
            // 🌟 4. จัดการ Variants (Smart Sync: Update / Create / Delete)
            // ==========================================
            if (variants && Array.isArray(variants)) {
                const incomingIds = [];
                const baseSystemSku = product.system_sku;
                for (const v of variants) {
                    const variantPayload = {
                        product_id: productId,
                        merchant_sku: v.merchant_sku || null,
                        color: v.color || null,
                        size_or_capacity: v.size_or_capacity || null,
                        weight_gram: v.weight_gram || 0,
                        price: v.price || filteredUpdateData.price || product.price,
                        stock_quantity: v.stock_quantity || 0,
                        image_url: v.image_url || null
                    };
                    if (v.id) {
                        // 🛠️ 4.1 มี ID แสดงว่าเป็นของเดิม -> อัปเดต
                        const existingVariant = await init_models_1.db.product_variants.findOne({
                            where: { id: v.id, product_id: productId },
                            transaction: t
                        });
                        if (existingVariant) {
                            const oldVariantData = existingVariant.toJSON();
                            await existingVariant.update(variantPayload, { transaction: t });
                            incomingIds.push(existingVariant.id); // จดจำ ID ที่ถูกอัปเดตไว้
                            // บันทึก Audit Log
                            await (0, auditLogger_1.logAudit)('product_variants', existingVariant.id, 'UPDATE', oldVariantData, variantPayload, userId, t);
                        }
                    }
                    else {
                        // 🛠️ 4.2 ไม่มี ID แสดงว่าเพิ่มตัวเลือกมาใหม่ -> สร้างใหม่ (CREATE)
                        const variantCode = `${v.color || ''}${v.size_or_capacity || ''}`;
                        const variantSku = variantCode
                            ? await ProductController.generateSystemSku(partner.id, product.global_category_id ?? null, product.model || '', variantCode)
                            : `${baseSystemSku}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
                        const newVariant = await init_models_1.db.product_variants.create({
                            ...variantPayload,
                            system_sku: variantSku
                        }, { transaction: t });
                        incomingIds.push(newVariant.id); // จดจำ ID ใหม่ที่เพิ่งสร้าง
                        // บันทึก Audit Log
                        await (0, auditLogger_1.logAudit)('product_variants', newVariant.id, 'CREATE', null, newVariant.toJSON(), userId, t);
                    }
                }
                // 🛠️ 4.3 จัดการลบ Variants เก่าทิ้ง (ตัวเลือกที่ถูกลบออกจากหน้าเว็บ)
                // ค้นหา Variants ที่เป็นของสินค้านี้ แต่ "ไม่อยู่ใน" incomingIds
                const deleteCondition = { product_id: productId };
                if (incomingIds.length > 0) {
                    deleteCondition.id = { [sequelize_1.Op.notIn]: incomingIds };
                }
                const variantsToDelete = await init_models_1.db.product_variants.findAll({ where: deleteCondition, transaction: t });
                // บันทึก Audit Log ให้ตัวที่จะถูกลบ
                for (const item of variantsToDelete) {
                    await (0, auditLogger_1.logAudit)('product_variants', item.id, 'DELETE', item.toJSON(), null, userId, t);
                }
                // สั่งลบออกจาก Database ของจริง
                await init_models_1.db.product_variants.destroy({ where: deleteCondition, transaction: t });
            }
            await t.commit();
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(200).json({
                success: true,
                message: 'ອັບເດດສິນຄ້າສຳເລັດ',
                data: product
            });
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error('Update Product Error:', error);
            next(error);
        }
    }
    async deActivatedOneProduct(req, res, next) {
        try {
            const { is_active } = req.body;
            if (is_active === undefined)
                throw new errors_1.ValidationError('ກະລຸນາລະບຸສະຖານະ is_active');
            const success = await product_repo_1.default.deleteOneProduct(parseInt(req.params.id), req.userPayload?.userId, is_active);
            if (!success)
                throw new errors_1.NotFoundError('ບໍ່ພົບສິນຄ້າ ຫຼື ທ່ານບໍ່ມີສິດແກ້ໄຂ');
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(200).json({ success: true, message: is_active === 1 ? 'ເປີດໃຊ້ງານສຳເລັດ' : 'ປິດໃຊ້ງານສຳເລัด' });
        }
        catch (error) {
            next(error);
        }
    }
    async updateMultipleProductStatus(req, res, next) {
        try {
            const { productIds, is_active } = req.body;
            if (!Array.isArray(productIds) || !productIds.length)
                throw new errors_1.ValidationError('productIds ຕ້ອງເປັນ Array');
            const updatedCount = await product_repo_1.default.updateMultipleProductStatus(productIds, req.userPayload?.userId, is_active);
            if (updatedCount === 0)
                throw new errors_1.NotFoundError('ບໍ່ມີรายการที่อัปเดตได้');
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(200).json({ success: true, message: `ອັບເດດສຳເລັດ ${updatedCount} ລາຍການ`, data: { updatedCount } });
        }
        catch (error) {
            next(error);
        }
    }
    // =======================================================
    // 🟢 9. ปิดการใช้งานสินค้าทั้งหมดของร้านค้า
    // =======================================================
    async deActivatedAllProductByPartnerId(req, res, next) {
        try {
            const userId = req.userPayload?.userId;
            if (!userId)
                throw new errors_1.UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່');
            const partner = await init_models_1.db.partners.findOne({ where: { user_id: userId }, attributes: ['id'] });
            if (!partner)
                throw new errors_1.UnauthorizedError('ບໍ່ພົບຂໍ້ມູນพานเนอร์');
            const updatedCount = await product_repo_1.default.deleteAllProductsByPartnerId(partner.id);
            await redis_service_1.default.delByPattern('cache:products:*');
            return res.status(200).json({
                success: true,
                message: 'ປິດການໃຊ້ງານສິນຄ້າທັງໝົດສຳເລັດ',
                data: { updatedCount }
            });
        }
        catch (error) {
            logger_1.logger.error('Error in deActivatedAllProductByPartnerId:', error);
            next(error);
        }
    }
}
exports.default = new ProductController();
