"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// 🟢 1. Import Helper ສຳລັບ Audit Log
const auditLogger_1 = require("../utils/auditLogger");
// 🟢 2. Import Custom Errors ທີ່ເຮົາສ້າງໄວ້
const errors_1 = require("../utils/errors");
class UserRepository {
    // ==========================================
    // 🟢 ສ້າງຜູ້ໃຊ້ໃໝ່
    // ==========================================
    async createUser(data, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const CleanUser = { ...data };
            // ກວດສອບ Username ຊ້ຳ
            const existUser = await init_models_1.db.users.findOne({
                where: { username: CleanUser.username },
                transaction: t
            });
            if (existUser) {
                // 🛑 ໃຊ້ BadRequestError ແທນ Error ທຳມະດາ
                throw new errors_1.BadRequestError('Username ນີ້ມີໃນລະບົບແລ້ວ (Username already exists)');
            }
            // Hash Password
            const hashedPassword = await bcryptjs_1.default.hash(CleanUser.password, 10);
            CleanUser.password = hashedPassword;
            // ບັນທຶກຜູ້ໃຊ້ໃໝ່
            const newUser = await init_models_1.db.users.create(CleanUser, { transaction: t });
            // 📝 ບັນທຶກ Audit Log (ລຶບລະຫັດຜ່ານອອກກ່ອນ)
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
            throw error; // ໂຍນໄປໃຫ້ Controller/Middleware ຈັດການຕໍ່
        }
    }
    // ==========================================
    // 🟢 ດຶງຂໍ້ມູນຜູ້ໃຊ້ທັງໝົດພ້ອມສິດການເຂົ້າເຖິງ
    // ==========================================
    async findAllUsers() {
        const usersWithFeatures = await init_models_1.db.users.findAll({
            attributes: { exclude: ['password'] },
            order: [['id', 'desc']],
            include: [
                {
                    model: init_models_1.db.user_permissions,
                    as: 'user_permissions',
                    attributes: ['can_access'],
                    include: [
                        {
                            model: init_models_1.db.features,
                            as: 'feature',
                            attributes: ['id', 'feature_name', 'description']
                        }
                    ]
                }
            ]
        });
        // Flatten data structure ໃຫ້ອ່ານງ່າຍຂຶ້ນ
        return usersWithFeatures.map(u => ({
            ...u.get({ plain: true }),
            features: u.user_permissions.map(p => ({
                ...p.feature,
                can_access: p.can_access
            }))
        }));
    }
    // ==========================================
    // 🟢 ຄົ້ນຫາຜູ້ໃຊ້ດ້ວຍ Username
    // ==========================================
    async findUserByUsername(username) {
        return await init_models_1.db.users.findOne({ where: { username } });
    }
    // ==========================================
    // 🟢 ຄົ້ນຫາຜູ້ໃຊ້ດ້ວຍ ID
    // ==========================================
    async findUserById(userId) {
        const user = await init_models_1.db.users.findByPk(userId);
        if (!user) {
            // 🛑 ໃຊ້ NotFoundError
            throw new errors_1.NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
        }
        return user;
    }
    // ==========================================
    // 🟢 ອັບເດດຂໍ້ມູນຜູ້ໃຊ້
    // ==========================================
    async updateUser(userId, data, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const user = await init_models_1.db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger_1.logger.error(`User with ID: ${userId} not found`);
                // 🛑 ໃຊ້ NotFoundError
                throw new errors_1.NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
            }
            // 🛑 ປ້ອງກັນການປ່ຽນ Role (Protect Role Modification)
            if (data.role && data.role !== user.role) {
                logger_1.logger.warn(`Attempt to change role for user ID: ${userId} blocked. Role modification is not allowed via standard update.`);
                // 🛑 ໃຊ້ ForbiddenError
                throw new errors_1.ForbiddenError("ບໍ່ອະນຸຍາດໃຫ້ປ່ຽນແປງ Role ໂດຍກົງ (Role cannot be changed directly)");
            }
            const oldData = user.toJSON();
            delete oldData.password; // ບໍ່ເກັບລະຫັດຜ່ານລົງ Log ເກົ່າ
            const updatePayload = { ...data };
            // ເຂົ້າລະຫັດຜ່ານໃໝ່ຖ້າມີການສົ່ງມາ
            if (updatePayload.password) {
                const hashedPassword = await bcryptjs_1.default.hash(updatePayload.password, 10);
                updatePayload.password = hashedPassword;
            }
            // ອັບເດດຂໍ້ມູນລົງຖານຂໍ້ມູນ
            const updatedUser = await user.update(updatePayload, {
                transaction: t
            });
            // 📝 ບັນທຶກ Audit Log
            const newData = { ...updatePayload };
            delete newData.password; // ບໍ່ເກັບລະຫັດຜ່ານລົງ Log ໃໝ່
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
    // ==========================================
    // 🟢 ປ່ຽນສະຖານະຜູ້ໃຊ້ (Active/Inactive)
    // ==========================================
    async changeStatusUser(userId, status, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const user = await init_models_1.db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger_1.logger.error(`User with ID: ${userId} not found`);
                // 🛑 ໃຊ້ NotFoundError
                throw new errors_1.NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
            }
            const oldData = user.toJSON();
            delete oldData.password;
            const updatePayload = { is_active: status };
            await user.update(updatePayload, { transaction: t });
            // 📝 ບັນທຶກ Audit Log
            await (0, auditLogger_1.logAudit)('users', userId, 'UPDATE', oldData, updatePayload, performedBy, t);
            await t.commit();
            const actionText = status === 1 ? 'activated' : 'deactivated';
            logger_1.logger.info(`User with ID: ${userId} ${actionText} successfully`);
            return true;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error changing status user with ID: ${userId} - ${error.message}`);
            throw error;
        }
    }
    // ==========================================
    // 🟢 ลบผู้ใช้งาน (Soft Delete)
    // ==========================================
    async deleteUser(userId, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            // ค้นหา User (ไม่ต้องใส่ paranoid: false เพราะเราต้องการลบเฉพาะคนที่ยังไม่ถูกลบ)
            const user = await init_models_1.db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger_1.logger.error(`User with ID: ${userId} not found for deletion`);
                // 🛑 โยน NotFoundError ถ้าหาไม่เจอ
                throw new errors_1.NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
            }
            // 🛡️ ป้องกันไม่ให้แอดมินลบบัญชีตัวเอง (Optional: ช่วยป้องกันความผิดพลาด)
            if (userId === performedBy) {
                throw new errors_1.BadRequestError("ບໍ່ສາມາດລຶບບັນຊີຂອງຕົນເອງໄດ້ (Cannot delete your own account)");
            }
            const oldData = user.toJSON();
            delete oldData.password; // ไม่บันทึกรหัสผ่านลง Log
            // 🗑️ สั่งลบ: เนื่องจากเราเปิดโหมด `paranoid: true` ใน Model ไว้แล้ว 
            // Sequelize จะไม่อัปเดตคำสั่ง DELETE จริงๆ แต่จะทำ `UPDATE deleted_at = NOW()` ให้อัตโนมัติ
            await user.destroy({ transaction: t });
            // 📝 บันทึก Audit Log
            await (0, auditLogger_1.logAudit)('users', userId, 'DELETE', oldData, null, performedBy, t);
            await t.commit();
            logger_1.logger.info(`User with ID: ${userId} deleted (soft delete) successfully`);
            return true;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error deleting user with ID: ${userId} - ${error.message}`);
            throw error;
        }
    }
}
exports.default = new UserRepository();
