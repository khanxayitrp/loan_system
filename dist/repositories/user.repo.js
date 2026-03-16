"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// 🟢 1. Import Helper ของเราเข้ามา
const auditLogger_1 = require("../utils/auditLogger");
class UserRepository {
    // 🟢 อัปเดตให้รับ parameter performedBy เพิ่มเติม
    async createUser(data, performedBy = 1) {
        // เพิ่ม Transaction เพื่อความปลอดภัยตอนบันทึกคู่กับ Audit Log
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const CleanUser = { ...data };
            const existUser = await init_models_1.db.users.findOne({
                where: { username: CleanUser.username },
                transaction: t
            });
            if (existUser) {
                throw new Error('Username already exists');
            }
            // 2. Hash Password
            const hashedPassword = await bcryptjs_1.default.hash(CleanUser.password, 10);
            CleanUser.password = hashedPassword;
            const newUser = await init_models_1.db.users.create(CleanUser, { transaction: t });
            // 🟢 บันทึก Audit Log (ลบรหัสผ่านออกก่อนบันทึก Log เพื่อความปลอดภัย)
            const logData = newUser.toJSON();
            delete logData.password;
            await (0, auditLogger_1.logAudit)('users', newUser.id, 'CREATE', null, logData, performedBy, t);
            await t.commit();
            logger_1.logger.info(`User created with ID: ${newUser.id}`);
            return newUser;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }
    async findAllUsers() {
        const usersWithFeatures = await init_models_1.db.users.findAll({
            attributes: { exclude: ['password'] },
            order: [['id', 'desc']],
            include: [
                {
                    model: init_models_1.db.user_permissions,
                    as: 'user_permissions', // ✅ must match association alias
                    attributes: ['can_access'],
                    include: [
                        {
                            model: init_models_1.db.features,
                            as: 'feature', // ✅ must match association alias
                            attributes: ['id', 'feature_name', 'description']
                        }
                    ]
                }
            ]
        });
        // Flatten
        return usersWithFeatures.map(u => ({
            ...u.get({ plain: true }),
            features: u.user_permissions.map(p => ({
                ...p.feature,
                can_access: p.can_access
            }))
        }));
    }
    async findUserByUsername(username) {
        return await init_models_1.db.users.findOne({ where: { username } });
    }
    async findUserById(userId) {
        return await init_models_1.db.users.findByPk(userId);
    }
    // 🟢 อัปเดตให้รับ parameter performedBy เพิ่มเติม
    async updateUser(userId, data, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const user = await init_models_1.db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger_1.logger.error(`User with ID: ${userId} not found`);
                await t.rollback();
                return null;
            }
            // 🛑 โลจิกป้องกันการเปลี่ยน Role (Protect Role Modification)
            if (data.role && data.role !== user.role) {
                logger_1.logger.warn(`Attempt to change role for user ID: ${userId} blocked. Role modification is not allowed via standard update.`);
                throw new Error("ບໍ່ອະນຸຍາດໃຫ້ປ່ຽນແປງ Role (Role cannot be changed directly)");
            }
            const oldData = user.toJSON();
            delete oldData.password; // ไม่ควรเก็บรหัสผ่านลง Log
            const updatePayload = { ...data };
            // เข้ารหัสรหัสผ่านใหม่ถ้ามีการส่งมา
            if (updatePayload.password) {
                const hashedPassword = await bcryptjs_1.default.hash(updatePayload.password, 10);
                updatePayload.password = hashedPassword;
            }
            // อัปเดตข้อมูล 
            const updatedUser = await user.update(updatePayload, {
                transaction: t
            });
            // 🟢 บันทึก Audit Log (ลบรหัสผ่านออกก่อนเทียบค่า)
            const newData = { ...updatePayload };
            delete newData.password;
            await (0, auditLogger_1.logAudit)('users', userId, 'UPDATE', oldData, newData, performedBy, t);
            await t.commit();
            logger_1.logger.info(`User with ID: ${userId} updated successfully`);
            return updatedUser;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error updating user with ID: ${userId} - ${error.message}`);
            throw error;
        }
    }
    // 🟢 อัปเดตให้รับ parameter performedBy เพิ่มเติม
    async changeStatusUser(userId, status, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const user = await init_models_1.db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger_1.logger.error(`User with ID: ${userId} not found`);
                await t.rollback();
                return false;
            }
            const oldData = user.toJSON();
            delete oldData.password;
            const updatePayload = { is_active: status };
            await user.update(updatePayload, { transaction: t });
            // 🟢 บันทึก Audit Log
            await (0, auditLogger_1.logAudit)('users', userId, 'UPDATE', oldData, updatePayload, performedBy, t);
            await t.commit();
            const actionText = status === 1 ? 'activated' : 'deactivated';
            logger_1.logger.info(`User with ID: ${userId} ${actionText} successfully`);
            return true;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error deactivating user with ID: ${userId} - ${error.message}`);
            throw error;
        }
    }
}
exports.default = new UserRepository();
