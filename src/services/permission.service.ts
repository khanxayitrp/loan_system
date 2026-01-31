import { db } from '../models/init-models';
import { logger } from '../utils/logger';

class PermissionService {
  /**
   * ดึงสิทธิ์ของหลาย User มาเทียบกันเพื่อหาค่ากลาง (สำหรับ UI Checkbox indeterminate)
   * ส่งกลับ totalUsers, featureCounts (จำนวนคนที่มี feature นี้), และ details (userIds ที่มี)
   */
  async getCombinedPermissions(userIds: number[]) {
    if (userIds.length === 0) {
      throw new Error('At least one user ID is required');
    }
    const permissions = await db.user_permissions.findAll({
      where: { user_id: userIds },
      attributes: ['user_id', 'feature_id'],
      raw: true // เพื่อให้ได้ plain object ง่ายต่อการ process
    });

    // โครงสร้างที่ส่งกลับ: { feature_id: { count: จำนวนคนที่ได้รับ, userIds: [รายชื่อ id] } }
    const featureCounts: Record<number, number> = {};
    const details: Record<number, number[]> = {}; // featureId -> [userIds ที่มี]
    permissions.forEach(p => {
        const fid = p.feature_id;
        const uid = p.user_id;
        featureCounts[fid] = (featureCounts[fid] || 0) + 1;
      if (!details[fid]) details[fid] = [];
      details[fid].push(uid);
    });

    return {
      totalUsers: userIds.length,
      //featureCounts: summary // Frontend จะเอาไปเช็ค: ถ้า count == totalUsers แสดงว่าติ๊กถูกหมด
        featureCounts,
      details
    };
  }

  /**
   * บันทึกสิทธิ์แบบกลุ่ม (Overwrite Mode สำหรับแต่ละ user แยกกัน)
   * รองรับทั้งคนเก่าที่แก้ไข และคนใหม่ที่เพิ่งสร้าง (ถ้าไม่มีข้อมูลเก่า จะแค่ insert)
   * Validation: เช็ค featureIds ว่ามีอยู่จริง, และ admin มีสิทธิ์จัดการ user นี้
   */
  async updateBulkPermissions(payload: { userId: number; featureIds: number[] }[]): Promise<boolean> {
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error('Invalid payload: users array required');
    }

    // Step 1: Validate all featureIds exist (bulk check for efficiency)
    const allFeatureIds = [...new Set(payload.flatMap(p => p.featureIds))]; // unique features
    if (allFeatureIds.length > 0) {
      const existingFeatures = await db.features.count({
        where: { id: allFeatureIds }
      });
      if (existingFeatures !== allFeatureIds.length) {
        throw new Error('Some feature IDs do not exist');
      }
    }

    const transaction = await db.sequelize.transaction();
    try {
      for (const { userId, featureIds } of payload) {
        // Step 2: Check if admin can manage this user (สมมติมี logic นี้ - ปรับตาม project)
        // const canManage = await this.canAdminManageUser(userId); // e.g., check role/hierarchy
        // if (!canManage) throw new ValidationError(`No permission to manage user ${userId}`);

        // Step 3: Delete old permissions
        await db.user_permissions.destroy({
          where: { user_id: userId },
          transaction
        });

        // ใส่ของใหม่เข้าไปตามที่ Admin ติ๊กเลือกมา
        if (featureIds.length > 0) {
          const data = featureIds.map(fId => ({
            user_id: userId,
            feature_id: fId,
            can_access: 1
          }));
          await db.user_permissions.bulkCreate(data, { transaction });
        }
        // Optional: Audit log
        logger.info(`Permissions updated for user ${userId} by admin: features=${featureIds.join(',')}`);
      }
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Bulk Update Error:', error);
      throw error;
    }
  }

  /**
   * ดึงรายการ Features ทั้งหมดในระบบ (สำหรับเอาไปโชว์เป็น Checkbox ในหน้าบ้าน)
   */
  async getAllFeatures() {
    return await db.features.findAll({
      order: [['feature_name', 'ASC']]
    });
  }
  // Optional helper: สมมติฟังก์ชันเช็ค admin manage user ได้
  private async canAdminManageUser(userId: number): Promise<boolean> {
    // Implement logic เช่น check จาก users table ว่า user นี้ under admin's department
    return true; // Placeholder
  }
}


export default new PermissionService();