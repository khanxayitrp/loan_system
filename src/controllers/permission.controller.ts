import { Request, Response } from 'express';
import permissionService from '../services/permission.service';

export const getCombinedPermissions = async (req: Request, res: Response) => {
  try {
    const userIdsStr = req.query.userIds as string;
    if (!userIdsStr) {
      return res.status(400).json({ message: 'userIds query param required' });
    }
    const userIds = userIdsStr.split(',').map(Number).filter(id => !isNaN(id));
    if (userIds.length === 0) {
      return res.status(400).json({ message: 'Invalid userIds' });
    }

    const result = await permissionService.getCombinedPermissions(userIds);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveBulkPermissions = async (req: Request, res: Response) => {
  try {
    const { users } = req.body; // { users: [{userId:1, featureIds:[10,11]}, ...] }
    await permissionService.updateBulkPermissions(users);
    return res.status(200).json({ success: true, message: 'Permissions updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFeaturesList = async (_req: Request, res: Response) => {
  try {
    const features = await permissionService.getAllFeatures();
    return res.status(200).json(features);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ เพิ่ม: ดึงสิทธิ์ของผู้ใช้เฉพาะคน
export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const permissions = await permissionService.getUserPermissions(userId);
    return res.status(200).json(permissions);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ เพิ่ม: กำหนดสิทธิ์ให้ผู้ใช้เฉพาะคน
export const assignUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { feature_ids } = req.body; // 👈 ชื่อ field ต้องตรงกับ frontend
    
    console.log('Received feature_ids:', feature_ids) // Debug log
    
    if (!Array.isArray(feature_ids)) {
      return res.status(400).json({ message: 'feature_ids must be an array' });
    }
    
    // ✅ ตรวจสอบว่าทุก element เป็นตัวเลข
    const invalidIds = feature_ids.filter(id => typeof id !== 'number' || isNaN(id))
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        message: 'All feature_ids must be valid numbers',
        invalidIds 
      });
    }

    await permissionService.assignUserPermissions(userId, feature_ids);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ เพิ่ม: ลบสิทธิ์ทั้งหมดของผู้ใช้เฉพาะคน
export const deleteAllUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    await permissionService.deleteAllUserPermissions(userId);
    return res.status(200).json({ success: true, message: 'All permissions deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};