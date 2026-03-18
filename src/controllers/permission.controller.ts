import { Request, Response } from 'express';
import permissionService from '../services/permission.service';
import redisService from '../services/redis.service'; // 🟢 1. Import Redis Service

export const getCombinedPermissions = async (req: Request, res: Response) => {
  try {
    const userIdsStr = req.query.userIds as string;
    if (!userIdsStr) {
      return res.status(400).json({ message: 'userIds query param required' });
    }
    // เรียง ID จากน้อยไปมากเสมอ เพื่อให้ Key ตรงกันแม้ส่งสลับตำแหน่งกัน
    const userIds = userIdsStr.split(',').map(Number).filter(id => !isNaN(id)).sort();
    if (userIds.length === 0) {
      return res.status(400).json({ message: 'Invalid userIds' });
    }

    // 🟢 2. Check Cache
    const cacheKey = `cache:permissions:combined:${userIds.join(',')}`;
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    const result = await permissionService.getCombinedPermissions(userIds);
    
    // 🟢 3. Set Cache (เก็บไว้ 1 วัน = 86400 วินาที)
    await redisService.set(cacheKey, JSON.stringify(result), 86400);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveBulkPermissions = async (req: Request, res: Response) => {
  try {
    const { users } = req.body; 
    await permissionService.updateBulkPermissions(users);

    // 🟢 4. ล้างแคช Permission ทิ้งให้หมด เพราะมีการอัปเดตสิทธิ์ผู้ใช้จำนวนมาก
    await redisService.delByPattern('cache:permissions:*');

    return res.status(200).json({ success: true, message: 'Permissions updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFeaturesList = async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'cache:features:all';

    // 🟢 5. เช็ค Cache ก่อน (ข้อมูล Feature แทบจะไม่เปลี่ยนเลย)
    const cachedFeatures = await redisService.get(cacheKey);
    if (cachedFeatures) {
        return res.status(200).json(JSON.parse(cachedFeatures));
    }

    const features = await permissionService.getAllFeatures();
    
    // 🟢 6. Set Cache (เก็บไว้ 7 วันเลยก็ได้ = 604800)
    await redisService.set(cacheKey, JSON.stringify(features), 604800);

    return res.status(200).json(features);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // 🟢 7. Check Cache ของ User แต่ละคน
    const cacheKey = `cache:permissions:user:${userId}`;
    const cachedUserPerms = await redisService.get(cacheKey);
    if (cachedUserPerms) {
        return res.status(200).json(JSON.parse(cachedUserPerms));
    }

    const permissions = await permissionService.getUserPermissions(userId);
    
    // 🟢 8. Set Cache
    await redisService.set(cacheKey, JSON.stringify(permissions), 86400);

    return res.status(200).json(permissions);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const assignUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { feature_ids } = req.body; 
    
    console.log('Received feature_ids:', feature_ids) 
    
    if (!Array.isArray(feature_ids)) {
      return res.status(400).json({ message: 'feature_ids must be an array' });
    }
    
    const invalidIds = feature_ids.filter(id => typeof id !== 'number' || isNaN(id))
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: 'All feature_ids must be valid numbers', invalidIds });
    }

    await permissionService.assignUserPermissions(userId, feature_ids);

    // 🟢 9. ล้างแคช Permission เฉพาะของ User คนนี้ และแบบ Combined เผื่อไว้
    await redisService.delByPattern('cache:permissions:*');

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteAllUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    await permissionService.deleteAllUserPermissions(userId);

    // 🟢 10. ล้างแคช
    await redisService.delByPattern('cache:permissions:*');

    return res.status(200).json({ success: true, message: 'All permissions deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};