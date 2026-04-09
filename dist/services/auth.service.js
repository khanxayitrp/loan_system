"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const users_1 = require("../models/users");
const token_service_1 = __importDefault(require("./token.service")); // เรียกใช้ TokenService ที่คุณทำไว้
const init_models_1 = require("../models/init-models");
// 🟢 1. Import Helper ของเราเข้ามา
const auditLogger_1 = require("../utils/auditLogger");
const errors_1 = require("../utils/errors");
class AuthService {
    // 🟢 เพิ่มการรับ Transaction และ performedBy เข้ามา
    async createDefaultPermissions(userId, role, performedBy, t) {
        try {
            const defaultPermissionsByRole = {
                admin: [
                    'user_view', 'user_create', 'user_manage', 'permission_manage',
                    'loan_view_all', 'loan_view_assigned', 'loan_create', 'loan_approve', 'user_changepass'
                ],
                staff: [
                    'loan_view_all', 'loan_view_assigned', 'loan_create', 'loan_approve', 'user_changepass'
                ],
                partner: [
                    'partner_manage', 'shop_view_report', 'user_changepass'
                ],
                customer: [
                    'view_profile', 'loan_request', 'view_own_loans',
                ]
            };
            const permissionCodes = defaultPermissionsByRole[role] || [];
            if (permissionCodes.length === 0) {
                console.log(`[Auth SERVICE] No default permissions for role: ${role}`);
                return;
            }
            const featuresList = await init_models_1.db.features.findAll({
                where: { feature_name: permissionCodes },
                transaction: t
            });
            if (featuresList.length === 0) {
                console.log('[AUTH SERVICE] No features found for permission codes:', permissionCodes);
                return;
            }
            // สร้าง user_permissions records
            const userPermissions = featuresList.map(feature => ({
                user_id: userId,
                feature_id: feature.id,
                can_access: 1
            }));
            await init_models_1.db.user_permissions.bulkCreate(userPermissions, { transaction: t });
            // 🟢 บันทึก Audit Log (CREATE Permissions)
            const featureIds = userPermissions.map(p => p.feature_id);
            await (0, auditLogger_1.logAudit)('user_permissions', userId, 'CREATE', null, { features: featureIds }, performedBy, t);
            console.log(`[AUTH SERVICE] Created ${userPermissions.length} default permissions for user ${userId}`);
        }
        catch (error) {
            console.error('[AUTH SERVICE] Error creating default permissions:', error);
            throw error;
        }
    }
    /**
     * สำหรับลูกค้าสมัครสมาชิกเองผ่านหน้าเว็บ/แอป
     */
    async signUp(userData) {
        const transaction = await init_models_1.db.sequelize.transaction();
        try {
            // 1. ตรวจสอบว่า Username ซ้ำหรือไม่
            const existingUser = await init_models_1.db.users.findOne({ where: { username: userData.username }, transaction });
            if (existingUser) {
                throw new errors_1.ConflictError('ຊື່ຜູ້ໃຊ້ງານນີ້ຖືກໃຊ້ແລ້ວ');
            }
            // 2. Hash Password
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
            // 3. สร้าง User ใหม่ (บังคับ role เป็น customer)
            const newUser = await init_models_1.db.users.create({
                username: userData.username,
                password: hashedPassword,
                full_name: userData.full_name,
                role: userData.role || 'customer',
                staff_level: userData.staff_level || 'none',
                is_active: 1
            }, { transaction });
            // 🟢 บันทึก Audit Log (ลบ Password ออกก่อนเก็บ)
            const logData = newUser.toJSON();
            delete logData.password;
            // ให้ performedBy เป็น ID ของตัวเอง (เพราะสมัครเอง)
            await (0, auditLogger_1.logAudit)('users', newUser.id, 'CREATE', null, logData, newUser.id, transaction);
            // 4. มอบสิทธิ์พื้นฐาน (Default Features)
            const defaultFeatures = ['view_profile', 'loan_request', 'view_own_loans'];
            const features = await init_models_1.db.features.findAll({
                where: { feature_name: defaultFeatures },
                transaction
            });
            if (features.length > 0) {
                const permissionsData = features.map(f => ({
                    user_id: newUser.id,
                    feature_id: f.id,
                    can_access: 1
                }));
                await init_models_1.db.user_permissions.bulkCreate(permissionsData, { transaction });
                // 🟢 บันทึก Audit Log สำหรับสิทธิ์
                const featureIds = permissionsData.map(p => p.feature_id);
                await (0, auditLogger_1.logAudit)('user_permissions', newUser.id, 'CREATE', null, { features: featureIds }, newUser.id, transaction);
            }
            // บันทึกทุกอย่างลง Database
            await transaction.commit();
            // คืนค่า User (ไม่ส่ง password กลับไป)
            const { password, ...userWithoutPassword } = newUser.get({ plain: true });
            return userWithoutPassword;
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // 2. เข้าสู่ระบบ (Sign In) - ไม่มีการเปลี่ยนแปลงข้อมูล จึงไม่ต้องเก็บ Audit Log
    async signIn(username, pass) {
        const user = await init_models_1.db.users.findOne({
            where: { username, is_active: 1 },
            include: [{
                    model: init_models_1.db.user_permissions,
                    as: 'user_permissions',
                    where: { can_access: 1 },
                    required: false,
                    include: [{
                            model: init_models_1.db.features,
                            as: 'feature'
                        }]
                }]
        });
        if (!user || !(await bcryptjs_1.default.compare(pass, user.password))) {
            return null;
        }
        const userPermissions = user.user_permissions || [];
        const permissions = userPermissions.map((p) => p.feature?.feature_name).filter(Boolean);
        const tokens = await token_service_1.default.generateAuthTokens({
            user_id: user.id,
            role: user.role,
            staff_level: user.staff_level,
            permissions: permissions
        });
        return { user, tokens };
    }
    async getUserById(userId) {
        return await users_1.users.findByPk(userId);
    }
    // 3. ออกจากระบบ (Sign Out)
    async signOut(refreshToken) {
        await token_service_1.default.revokeRefreshToken(refreshToken);
    }
    // 4. การต่ออายุ Token (Refresh)
    async refreshTokens(token) {
        const isValid = await token_service_1.default.isRefreshTokenValid(token);
        if (!isValid)
            return null;
        const payload = token_service_1.default.verifyToken(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
        await token_service_1.default.revokeRefreshToken(token);
        return await token_service_1.default.generateAuthTokens({
            user_id: payload.userId,
            role: payload.role,
            staff_level: payload.staff_level ?? '',
            permissions: payload.permissions ?? []
        });
    }
    /**
     * 5. ฟังก์ชันสำหรับ Admin เพื่อสร้าง User (Staff, Partner)
     * 🟢 เพิ่มการรับ performedBy และจัดการด้วย Transaction
     */
    async registerUser(userData, performedBy = 1) {
        const transaction = await init_models_1.db.sequelize.transaction();
        try {
            const existingUser = await init_models_1.db.users.findOne({
                where: { username: userData.username },
                transaction
            });
            if (existingUser) {
                throw new errors_1.ConflictError('ຊື່ຜູ້ໃຊ້ງານນີ້ຖືກໃຊ້ແລ້ວ');
            }
            console.log('Creating user with data:', userData);
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
            const newUser = await init_models_1.db.users.create({
                ...userData,
                password: hashedPassword,
                is_active: 1,
            }, { transaction });
            // 🟢 บันทึก Audit Log (ลบ Password ออกก่อนเก็บ)
            const logData = newUser.toJSON();
            delete logData.password;
            await (0, auditLogger_1.logAudit)('users', newUser.id, 'CREATE', null, logData, performedBy, transaction);
            // ✅ 4. สร้าง default permissions พร้อมส่ง Transaction และคนทำรายการเข้าไปด้วย
            await this.createDefaultPermissions(newUser.id, userData.role, performedBy, transaction);
            await transaction.commit();
            return newUser;
        }
        catch (error) {
            await transaction.rollback();
            // throw new Error(error.message);
            throw error;
        }
    }
    /**
     * 6. ฟังก์ชันให้ User เปลี่ยนรหัสผ่านด้วยตัวเอง
     * 🟢 เพิ่ม Transaction และ Audit Log แบบปิดบังรหัสผ่าน
     */
    async changePassword(userId, oldPass, newPass) {
        const transaction = await init_models_1.db.sequelize.transaction();
        try {
            const user = await init_models_1.db.users.findByPk(userId, { transaction });
            if (!user)
                throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
            const isMatch = await bcryptjs_1.default.compare(oldPass, user.password);
            if (!isMatch) {
                throw new errors_1.UnauthorizedError('ລະຫັດຜ່ານເກົ່າບໍ່ຖືກຕ້ອງ');
            }
            const hashedNewPassword = await bcryptjs_1.default.hash(newPass, 10);
            await user.update({ password: hashedNewPassword }, { transaction });
            // 🟢 บันทึก Audit Log ว่ามีการเปลี่ยนรหัสผ่าน (สร้าง Object หลอกขึ้นมาแทนที่จะเก็บค่า Hash จริงๆ)
            await (0, auditLogger_1.logAudit)('users', userId, 'UPDATE', { password_changed: false }, { password_changed: true }, userId, // ตัวเองเป็นคนเปลี่ยน
            transaction);
            // ยกเลิก Token เก่าทั้งหมดเพื่อให้ล็อกอินใหม่
            await token_service_1.default.revokeAllUserTokens(userId);
            await transaction.commit();
            return true;
        }
        catch (error) {
            await transaction.rollback();
            // throw new Error(error.message);
            throw error; // ส่ง error ตรงๆ เพื่อให้ controller จัดการและส่ง response ที่เหมาะสม
        }
    }
    async getFirstLoggedInUser(userId) {
        return await init_models_1.db.user_refresh_tokens.count({
            where: { user_id: userId }
        });
    }
}
exports.default = new AuthService();
