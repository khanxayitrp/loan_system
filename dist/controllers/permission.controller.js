"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllUserPermissions = exports.assignUserPermissions = exports.getUserPermissions = exports.getFeaturesList = exports.saveBulkPermissions = exports.getCombinedPermissions = void 0;
const permission_service_1 = __importDefault(require("../services/permission.service"));
const redis_service_1 = __importDefault(require("../services/redis.service")); // 🟢 1. Import Redis Service
const getCombinedPermissions = async (req, res) => {
    try {
        const userIdsStr = req.query.userIds;
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
        const cachedData = await redis_service_1.default.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }
        const result = await permission_service_1.default.getCombinedPermissions(userIds);
        // 🟢 3. Set Cache (เก็บไว้ 1 วัน = 86400 วินาที)
        await redis_service_1.default.set(cacheKey, JSON.stringify(result), 86400);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getCombinedPermissions = getCombinedPermissions;
const saveBulkPermissions = async (req, res) => {
    try {
        const { users } = req.body;
        await permission_service_1.default.updateBulkPermissions(users);
        // 🟢 4. ล้างแคช Permission ทิ้งให้หมด เพราะมีการอัปเดตสิทธิ์ผู้ใช้จำนวนมาก
        await redis_service_1.default.delByPattern('cache:permissions:*');
        return res.status(200).json({ success: true, message: 'Permissions updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.saveBulkPermissions = saveBulkPermissions;
const getFeaturesList = async (_req, res) => {
    try {
        const cacheKey = 'cache:features:all';
        // 🟢 5. เช็ค Cache ก่อน (ข้อมูล Feature แทบจะไม่เปลี่ยนเลย)
        const cachedFeatures = await redis_service_1.default.get(cacheKey);
        if (cachedFeatures) {
            return res.status(200).json(JSON.parse(cachedFeatures));
        }
        const features = await permission_service_1.default.getAllFeatures();
        // 🟢 6. Set Cache (เก็บไว้ 7 วันเลยก็ได้ = 604800)
        await redis_service_1.default.set(cacheKey, JSON.stringify(features), 604800);
        return res.status(200).json(features);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getFeaturesList = getFeaturesList;
const getUserPermissions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        // 🟢 7. Check Cache ของ User แต่ละคน
        const cacheKey = `cache:permissions:user:${userId}`;
        const cachedUserPerms = await redis_service_1.default.get(cacheKey);
        if (cachedUserPerms) {
            return res.status(200).json(JSON.parse(cachedUserPerms));
        }
        const permissions = await permission_service_1.default.getUserPermissions(userId);
        // 🟢 8. Set Cache
        await redis_service_1.default.set(cacheKey, JSON.stringify(permissions), 86400);
        return res.status(200).json(permissions);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getUserPermissions = getUserPermissions;
const assignUserPermissions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { feature_ids } = req.body;
        console.log('Received feature_ids:', feature_ids);
        if (!Array.isArray(feature_ids)) {
            return res.status(400).json({ message: 'feature_ids must be an array' });
        }
        const invalidIds = feature_ids.filter(id => typeof id !== 'number' || isNaN(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ message: 'All feature_ids must be valid numbers', invalidIds });
        }
        await permission_service_1.default.assignUserPermissions(userId, feature_ids);
        // 🟢 9. ล้างแคช Permission เฉพาะของ User คนนี้ และแบบ Combined เผื่อไว้
        await redis_service_1.default.delByPattern('cache:permissions:*');
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.assignUserPermissions = assignUserPermissions;
const deleteAllUserPermissions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        await permission_service_1.default.deleteAllUserPermissions(userId);
        // 🟢 10. ล้างแคช
        await redis_service_1.default.delByPattern('cache:permissions:*');
        return res.status(200).json({ success: true, message: 'All permissions deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.deleteAllUserPermissions = deleteAllUserPermissions;
