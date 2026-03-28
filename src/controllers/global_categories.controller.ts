import { Request, Response } from 'express';
import { GlobalCategoriesRepository } from '../repositories/global_categories.repo';

const repository = new GlobalCategoriesRepository();

export class GlobalCategoriesController {
  
  // GET: ดึงข้อมูลทั้งหมด
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await repository.findAll();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
  }

  // GET: ดึงข้อมูลตาม ID
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await repository.findById(id);
      
      if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      
      res.status(200).json(category);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
  }

  // GET: ดึงข้อมูลตาม Prefix Code
  static async getByPrefix(req: Request, res: Response): Promise<void> {
    try {
      const prefix = req.params.prefix;
      const category = await repository.findByPrefixCode(prefix);
      
      if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      
      res.status(200).json(category);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
  }

  // POST: สร้างหมวดหมู่ใหม่
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const newCategory = await repository.create(req.body);
      res.status(201).json(newCategory);
    } catch (error: any) {
      // ดักจับ Error กรณี prefix_code ซ้ำ
      if (error.name === 'SequelizeUniqueConstraintError') {
         res.status(400).json({ message: 'Prefix code must be unique' });
         return;
      }
      res.status(500).json({ message: 'Error creating category', error: error.message });
    }
  }

  // PUT: อัปเดตข้อมูล
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updatedCategory = await repository.update(id, req.body);
      
      if (!updatedCategory) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      
      res.status(200).json(updatedCategory);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating category', error: error.message });
    }
  }

  // DELETE: ลบข้อมูล
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const isDeleted = await repository.delete(id);
      
      if (!isDeleted) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }
      
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
  }
}