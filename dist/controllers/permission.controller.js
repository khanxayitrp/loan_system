"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllUserPermissions = exports.assignUserPermissions = exports.getUserPermissions = exports.getFeaturesList = exports.saveBulkPermissions = exports.getCombinedPermissions = void 0;
const permission_service_1 = __importDefault(require("../services/permission.service"));
const getCombinedPermissions = async (req, res) => {
    try {
        const userIdsStr = req.query.userIds;
        if (!userIdsStr) {
            return res.status(400).json({ message: 'userIds query param required' });
        }
        const userIds = userIdsStr.split(',').map(Number).filter(id => !isNaN(id));
        if (userIds.length === 0) {
            return res.status(400).json({ message: 'Invalid userIds' });
        }
        const result = await permission_service_1.default.getCombinedPermissions(userIds);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getCombinedPermissions = getCombinedPermissions;
const saveBulkPermissions = async (req, res) => {
    try {
        const { users } = req.body; // { users: [{userId:1, featureIds:[10,11]}, ...] }
        await permission_service_1.default.updateBulkPermissions(users);
        return res.status(200).json({ success: true, message: 'Permissions updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.saveBulkPermissions = saveBulkPermissions;
const getFeaturesList = async (_req, res) => {
    try {
        const features = await permission_service_1.default.getAllFeatures();
        return res.status(200).json(features);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getFeaturesList = getFeaturesList;
// ✅ เพิ่ม: ดึงสิทธิ์ของผู้ใช้เฉพาะคน
const getUserPermissions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const permissions = await permission_service_1.default.getUserPermissions(userId);
        return res.status(200).json(permissions);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getUserPermissions = getUserPermissions;
// ✅ เพิ่ม: กำหนดสิทธิ์ให้ผู้ใช้เฉพาะคน
const assignUserPermissions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { feature_ids } = req.body; // 👈 ชื่อ field ต้องตรงกับ frontend
        console.log('Received feature_ids:', feature_ids); // Debug log
        if (!Array.isArray(feature_ids)) {
            return res.status(400).json({ message: 'feature_ids must be an array' });
        }
        // ✅ ตรวจสอบว่าทุก element เป็นตัวเลข
        const invalidIds = feature_ids.filter(id => typeof id !== 'number' || isNaN(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                message: 'All feature_ids must be valid numbers',
                invalidIds
            });
        }
        await permission_service_1.default.assignUserPermissions(userId, feature_ids);
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.assignUserPermissions = assignUserPermissions;
// ✅ เพิ่ม: ลบสิทธิ์ทั้งหมดของผู้ใช้เฉพาะคน
const deleteAllUserPermissions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        await permission_service_1.default.deleteAllUserPermissions(userId);
        return res.status(200).json({ success: true, message: 'All permissions deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.deleteAllUserPermissions = deleteAllUserPermissions;
