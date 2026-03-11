import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize'; // 🟢 เพิ่ม Op เข้ามาเผื่อใช้งาน

// 🟢 1. Import Helper ของเราเข้ามา
import { logAudit } from '../utils/auditLogger';

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
      featureCounts,
      details
    };
  }

  /**
   * บันทึกสิทธิ์แบบกลุ่ม (Overwrite Mode สำหรับแต่ละ user แยกกัน)
   * 🟢 เพิ่ม performedBy เพื่อเก็บ Audit Log
   */
  async updateBulkPermissions(payload: { userId: number; featureIds: number[] }[], performedBy: number = 1): Promise<boolean> {
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
        
        // 🟢 ดึงข้อมูลสิทธิ์เดิมเก็บไว้ทำ Audit Log
        const oldPermissions = await db.user_permissions.findAll({ where: { user_id: userId }, transaction });
        const oldFeatureIds = oldPermissions.map(p => p.feature_id);

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

        // 🟢 บันทึก Audit Log (ใช้ userId เป็น recordId เพราะเป็นการแก้ไขสิทธิ์ของ User คนนั้นๆ)
        await logAudit(
            'user_permissions', 
            userId, 
            'UPDATE', 
            { features: oldFeatureIds }, 
            { features: featureIds }, 
            performedBy, 
            transaction
        );

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

  /**
   * ✅ ดึงสิทธิ์ของผู้ใช้เฉพาะคน
   */
  async getUserPermissions(userId: number) {
    const permissions = await db.user_permissions.findAll({
      where: { user_id: userId },
      include: [{
        model: db.features,
        attributes: ['id', 'feature_name', 'description']
      }],
      raw: true,
      nest: true
    });

    return permissions.map((p: any) => ({
      user_id: p.user_id,
      feature_id: p.feature.id,
      can_access: p.can_access,
      feature: {
        id: p.feature.id,
        feature_name: p.feature.feature_name,
        description: p.feature.description
      }
    }));
  }

  /**
   * ✅ กำหนดสิทธิ์ให้ผู้ใช้เฉพาะคน (Overwrite mode)
   * 🟢 เพิ่ม performedBy เพื่อเก็บ Audit Log
   */
  async assignUserPermissions(userId: number, featureIds: number[], performedBy: number = 1): Promise<boolean> {
    const transaction = await db.sequelize.transaction();
    try {
      // Validate feature IDs exist
      if (featureIds.length > 0) {
        const existingFeatures = await db.features.count({
          where: { id: featureIds },
          transaction // เพิ่ม transaction เข้าไปให้ครอบคลุม
        });
        if (existingFeatures !== featureIds.length) {
          throw new Error('Some feature IDs do not exist');
        }
      }

      // 🟢 ดึงข้อมูลสิทธิ์เดิมเก็บไว้ทำ Audit Log
      const oldPermissions = await db.user_permissions.findAll({ where: { user_id: userId }, transaction });
      const oldFeatureIds = oldPermissions.map(p => p.feature_id);

      // Delete old permissions
      await db.user_permissions.destroy({
        where: { user_id: userId },
        transaction
      });

      // Insert new permissions
      if (featureIds.length > 0) {
        const data = featureIds.map(fId => ({
          user_id: userId,
          feature_id: fId,
          can_access: 1
        }));
        await db.user_permissions.bulkCreate(data, { transaction });
      }

      // 🟢 บันทึก Audit Log 
      await logAudit(
          'user_permissions', 
          userId, 
          'UPDATE', 
          { features: oldFeatureIds }, 
          { features: featureIds }, 
          performedBy, 
          transaction
      );

      logger.info(`Permissions assigned for user ${userId}: features=${featureIds.join(',')}`);
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Assign User Permissions Error:', error);
      throw error;
    }
  }

  /**
   * ✅ ลบสิทธิ์ทั้งหมดของผู้ใช้เฉพาะคน
   * 🟢 เพิ่ม performedBy เพื่อเก็บ Audit Log
   */
  async deleteAllUserPermissions(userId: number, performedBy: number = 1): Promise<boolean> {
    const transaction = await db.sequelize.transaction();
    try {
      
      // 🟢 ดึงข้อมูลสิทธิ์เดิมเก็บไว้ทำ Audit Log
      const oldPermissions = await db.user_permissions.findAll({ where: { user_id: userId }, transaction });
      const oldFeatureIds = oldPermissions.map(p => p.feature_id);

      await db.user_permissions.destroy({
        where: { user_id: userId },
        transaction
      });
      
      // 🟢 บันทึก Audit Log (ถือเป็นการอัปเดตสิทธิ์ให้กลายเป็น Array ว่าง)
      await logAudit(
          'user_permissions', 
          userId, 
          'DELETE', 
          { features: oldFeatureIds }, 
          { features: [] }, 
          performedBy, 
          transaction
      );

      logger.info(`All permissions deleted for user ${userId}`);
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Delete All User Permissions Error:', error);
      throw error;
    }
  }
}

export default new PermissionService();