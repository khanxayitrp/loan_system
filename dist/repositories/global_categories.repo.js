"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalCategoriesRepository = void 0;
const global_categories_1 = require("../models/global_categories"); // ปรับ Path ให้ตรงกับโปรเจกต์ของคุณ
const init_models_1 = require("../models/init-models"); // ปรับ Path ให้ตรงกับโปรเจกต์ของคุณ
class GlobalCategoriesRepository {
    // ดึงข้อมูลทั้งหมด (รวม products ด้วยก็ได้ หากต้องการ)
    async findAll() {
        return await init_models_1.db.global_categories.findAll({
        // include: [{ model: products, as: 'products' }] // Uncomment ถัาอยากให้ดึงสินค้าที่อยู่ในหมวดหมู่นี้มาด้วย
        });
    }
    // ดึงข้อมูลตาม ID
    async findById(id) {
        return await global_categories_1.global_categories.findByPk(id);
    }
    // ดึงข้อมูลตาม Prefix Code
    async findByPrefixCode(prefixCode) {
        return await init_models_1.db.global_categories.findOne({
            where: { prefix_code: prefixCode }
        });
    }
    // ดึงเฉพาะหมวดหมู่ที่เปิดใช้งานอยู่ (is_active = 1)
    async findActiveCategories() {
        return await init_models_1.db.global_categories.findAll({
            where: { is_active: 1 }
        });
    }
    // สร้างหมวดหมู่ใหม่
    async create(data) {
        return await init_models_1.db.global_categories.create(data);
    }
    // อัปเดตข้อมูล
    async update(id, data) {
        const category = await init_models_1.db.global_categories.findByPk(id);
        if (!category)
            return null;
        return await category.update(data);
    }
    // ลบข้อมูล
    async delete(id) {
        const category = await init_models_1.db.global_categories.findByPk(id);
        if (!category)
            return false;
        await category.destroy();
        return true;
    }
}
exports.GlobalCategoriesRepository = GlobalCategoriesRepository;
