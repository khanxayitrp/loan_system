"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCustomerToken = exports.optionalVerifyToken = exports.checkPermission = exports.isAuthorized = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = require("../models/users");
const auth_config_1 = __importDefault(require("../config/auth.config"));
const tokenBlacklist_service_1 = require("../services/tokenBlacklist.service");
const init_models_1 = require("../models/init-models");
// ============================================================================
// 🟢 1. ฟังก์ชันกลางสำหรับตรวจสอบ Token (Core Verification Logic)
// ============================================================================
const processTokenVerification = async (token, req, res, next) => {
    // 1. ตรวจสอบว่า Token ถูก Blacklist หรือไม่
    if ((0, tokenBlacklist_service_1.isTokenBlacklisted)(token)) {
        return res.status(401).json({ message: 'Token is blacklisted' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, auth_config_1.default.secret);
        const user = await users_1.users.findByPk(decoded.userId);
        // 2. ตรวจสอบ User
        if (!user || user.is_active === 0) {
            return res.status(401).json({ message: 'User is not active or does not exist' });
        }
        // ✅ Token ปกติและสมบูรณ์ แนบข้อมูลแล้วไปต่อ
        req.userPayload = decoded;
        return next();
    }
    catch (error) {
        // ❌ ถอด Logic Auto-Refresh ออกทั้งหมด
        // ส่ง Code: 'TOKEN_EXPIRED' กลับไปให้ Axios Interceptor ที่ฝั่ง Client จัดการต่อ
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                message: 'Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
};
// ============================================================================
// 🔴 2. Strict Auth (บังคับต้องมี Token และต้องถูกต้องเท่านั้น)
// ============================================================================
const verifyToken = async (req, res, next) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    await processTokenVerification(token, req, res, next);
};
exports.verifyToken = verifyToken;
const isAuthorized = (allowedRoles, allowedLevels = []) => {
    return (req, res, next) => {
        const user = req.userPayload;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        const hasRole = allowedRoles.includes(user.role);
        const hasLevel = allowedLevels.length === 0 || allowedLevels.includes((user.staff_level || 'none'));
        if (!hasRole || !hasLevel) {
            return res.status(403).json({ message: 'Forbidden: You do not have the required permissions.' });
        }
        next();
    };
};
exports.isAuthorized = isAuthorized;
const checkPermission = (requiredFeature) => {
    return (req, res, next) => {
        const user = req.userPayload;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        if (user.role === 'admin')
            return next();
        const hasPermission = user.permissions && user.permissions.includes(requiredFeature);
        if (!hasPermission) {
            return res.status(403).json({
                message: `Forbidden: You do not have permission for ${requiredFeature}`
            });
        }
        next();
    };
};
exports.checkPermission = checkPermission;
const optionalVerifyToken = async (req, res, next) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next();
    }
    await processTokenVerification(token, req, res, next);
};
exports.optionalVerifyToken = optionalVerifyToken;
// ============================================================================
// 🟢 3. สำหรับลูกค้าระบบหน้าบ้าน (Customer Portal)
// ============================================================================
const verifyCustomerToken = async (req, res, next) => {
    const token = req.cookies.customerToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No customer token provided.' });
    }
    if ((0, tokenBlacklist_service_1.isTokenBlacklisted)(token)) {
        return res.status(401).json({ message: 'Token is blacklisted' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, auth_config_1.default.secret);
        // ตรวจสอบว่าเป็น Token ของลูกค้าจริงๆ ไม่ใช่พนักงานเอา Token มาใช้มั่วซั่ว
        if (decoded.role !== 'customer') {
            return res.status(403).json({ message: 'Forbidden: Invalid token role.' });
        }
        // ดึงข้อมูลลูกค้าจากตาราง customers (สมมติชื่อโมเดลคือ Customer)
        const customer = await init_models_1.db.customers.findByPk(decoded.userId);
        if (!customer) {
            return res.status(401).json({ message: 'Customer does not exist' });
        }
        // แนบข้อมูลลูกค้าลงใน Request
        req.customerPayload = decoded;
        return next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Customer token expired.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ message: 'Invalid customer token.' });
    }
};
exports.verifyCustomerToken = verifyCustomerToken;
