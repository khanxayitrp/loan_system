import { 
  global_categories, 
  global_categoriesAttributes, 
  global_categoriesCreationAttributes 
} from '../models/global_categories'; // ปรับ Path ให้ตรงกับโปรเจกต์ของคุณ
import { products } from '../models/products'; // สมมติว่าต้องการ include products
import { db } from '../models/init-models'; // ปรับ Path ให้ตรงกับโปรเจกต์ของคุณ

export class GlobalCategoriesRepository {
  
  // ดึงข้อมูลทั้งหมด (รวม products ด้วยก็ได้ หากต้องการ)
  async findAll(): Promise<global_categories[]> {
    return await db.global_categories.findAll({
      // include: [{ model: products, as: 'products' }] // Uncomment ถัาอยากให้ดึงสินค้าที่อยู่ในหมวดหมู่นี้มาด้วย
    });
  }

  // ดึงข้อมูลตาม ID
  async findById(id: number): Promise<global_categories | null> {
    return await global_categories.findByPk(id);
  }

  // ดึงข้อมูลตาม Prefix Code
  async findByPrefixCode(prefixCode: string): Promise<global_categories | null> {
    return await db.global_categories.findOne({ 
      where: { prefix_code: prefixCode } 
    });
  }

  // ดึงเฉพาะหมวดหมู่ที่เปิดใช้งานอยู่ (is_active = 1)
  async findActiveCategories(): Promise<global_categories[]> {
    return await db.global_categories.findAll({ 
      where: { is_active: 1 } 
    });
  }

  // สร้างหมวดหมู่ใหม่
  async create(data: global_categoriesCreationAttributes): Promise<global_categories> {
    return await db.global_categories.create(data);
  }

  // อัปเดตข้อมูล
  async update(id: number, data: Partial<global_categoriesAttributes>): Promise<global_categories | null> {
    const category = await db.global_categories.findByPk(id);
    if (!category) return null;

    return await category.update(data);
  }

  // ลบข้อมูล
  async delete(id: number): Promise<boolean> {
    const category = await db.global_categories.findByPk(id);
    if (!category) return false;

    await category.destroy();
    return true;
  }
}