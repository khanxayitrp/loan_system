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