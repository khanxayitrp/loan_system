import { users, usersAttributes, usersCreationAttributes } from '../models/users';
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { Op, Sequelize, QueryTypes, where } from 'sequelize';

// 🟢 1. Import Helper ສຳລັບ Audit Log
import { logAudit } from '../utils/auditLogger';

// 🟢 2. Import Custom Errors ທີ່ເຮົາສ້າງໄວ້
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

class UserRepository {
    
    // ==========================================
    // 🟢 ສ້າງຜູ້ໃຊ້ໃໝ່
    // ==========================================
    async createUser(data: any, performedBy: number = 1): Promise<users> {
        const t = await db.sequelize.transaction();
        try {
            const CleanUser = { ...data };

            // ກວດສອບ Username ຊ້ຳ
            const existUser = await db.users.findOne({ 
                where: { username: CleanUser.username },
                transaction: t
            });

            if (existUser) {
                // 🛑 ໃຊ້ BadRequestError ແທນ Error ທຳມະດາ
                throw new BadRequestError('Username ນີ້ມີໃນລະບົບແລ້ວ (Username already exists)');
            }

            // Hash Password
            const hashedPassword = await bcrypt.hash(CleanUser.password, 10);
            CleanUser.password = hashedPassword;
            
            // ບັນທຶກຜູ້ໃຊ້ໃໝ່
            const newUser = await db.users.create(CleanUser, { transaction: t });
            
            // 📝 ບັນທຶກ Audit Log (ລຶບລະຫັດຜ່ານອອກກ່ອນ)
            const logData = newUser.toJSON();
            delete (logData as any).password;
            
            await logAudit('users', newUser.id, 'CREATE', null, logData, performedBy, t);

            await t.commit();
            logger.info(`User created with ID: ${newUser.id}`);
            return newUser;
        } catch (error) {
            await t.rollback();
            logger.error(`Error creating user: ${(error as Error).message}`);
            throw error; // ໂຍນໄປໃຫ້ Controller/Middleware ຈັດການຕໍ່
        }
    }
    
    // ==========================================
    // 🟢 ດຶງຂໍ້ມູນຜູ້ໃຊ້ທັງໝົດພ້ອມສິດການເຂົ້າເຖິງ
    // ==========================================
    async findAllUsers(): Promise<any[]> {
        const usersWithFeatures = await db.users.findAll({
            attributes: { exclude: ['password'] },
            order: [['id', 'desc']],
            include: [
                {
                    model: db.user_permissions,
                    as: 'user_permissions',
                    attributes: ['can_access'],
                    include: [
                        {
                            model: db.features,
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
    async findUserByUsername(username: string): Promise<users | null> {
        return await db.users.findOne({ where: { username } });
    }

    // ==========================================
    // 🟢 ຄົ້ນຫາຜູ້ໃຊ້ດ້ວຍ ID
    // ==========================================
    async findUserById(userId: number): Promise<users | null> {
        const user = await db.users.findByPk(userId);
        if (!user) {
            // 🛑 ໃຊ້ NotFoundError
            throw new NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
        }
        return user;
    }

    // ==========================================
    // 🟢 ອັບເດດຂໍ້ມູນຜູ້ໃຊ້
    // ==========================================
    async updateUser(userId: number, data: any, performedBy: number = 1): Promise<users | null> {
        const t = await db.sequelize.transaction();
        try {
            const user = await db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger.error(`User with ID: ${userId} not found`);
                // 🛑 ໃຊ້ NotFoundError
                throw new NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
            }

            // 🛑 ປ້ອງກັນການປ່ຽນ Role (Protect Role Modification)
            if (data.role && data.role !== user.role) {
                logger.warn(`Attempt to change role for user ID: ${userId} blocked. Role modification is not allowed via standard update.`);
                // 🛑 ໃຊ້ ForbiddenError
                throw new ForbiddenError("ບໍ່ອະນຸຍາດໃຫ້ປ່ຽນແປງ Role ໂດຍກົງ (Role cannot be changed directly)");
            }

            const oldData = user.toJSON();
            delete (oldData as any).password; // ບໍ່ເກັບລະຫັດຜ່ານລົງ Log ເກົ່າ

            const updatePayload = { ...data };

            // ເຂົ້າລະຫັດຜ່ານໃໝ່ຖ້າມີການສົ່ງມາ
            if (updatePayload.password) {
                const hashedPassword = await bcrypt.hash(updatePayload.password, 10);
                updatePayload.password = hashedPassword;
            }

            // ອັບເດດຂໍ້ມູນລົງຖານຂໍ້ມູນ
            const updatedUser = await user.update(updatePayload, { 
                transaction: t 
            });

            // 📝 ບັນທຶກ Audit Log
            const newData = { ...updatePayload };
            delete newData.password; // ບໍ່ເກັບລະຫັດຜ່ານລົງ Log ໃໝ່
            
            await logAudit('users', userId, 'UPDATE', oldData, newData, performedBy, t);

            await t.commit();
            logger.info(`User with ID: ${userId} updated successfully`);
            return updatedUser;

        } catch (error) {
            await t.rollback();
            logger.error(`Error updating user with ID: ${userId} - ${(error as Error).message}`);
            throw error;
        }
    }
    
    // ==========================================
    // 🟢 ປ່ຽນສະຖານະຜູ້ໃຊ້ (Active/Inactive)
    // ==========================================
    async changeStatusUser(userId: number, status: number, performedBy: number = 1) {
        const t = await db.sequelize.transaction();
        try {
            const user = await db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger.error(`User with ID: ${userId} not found`);
                // 🛑 ໃຊ້ NotFoundError
                throw new NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
            }

            const oldData = user.toJSON();
            delete (oldData as any).password;

            const updatePayload = { is_active: status };
            await user.update(updatePayload, { transaction: t });

            // 📝 ບັນທຶກ Audit Log
            await logAudit('users', userId, 'UPDATE', oldData, updatePayload, performedBy, t);

            await t.commit();
            const actionText = status === 1 ? 'activated' : 'deactivated';
            logger.info(`User with ID: ${userId} ${actionText} successfully`);
            return true;
            
        } catch (error) {
            await t.rollback();
            logger.error(`Error changing status user with ID: ${userId} - ${(error as Error).message}`);
            throw error;
        }
    }
    // ==========================================
    // 🟢 ลบผู้ใช้งาน (Soft Delete)
    // ==========================================
    async deleteUser(userId: number, performedBy: number = 1): Promise<boolean> {
        const t = await db.sequelize.transaction();
        try {
            // ค้นหา User (ไม่ต้องใส่ paranoid: false เพราะเราต้องการลบเฉพาะคนที่ยังไม่ถูกลบ)
            const user = await db.users.findByPk(userId, { transaction: t });
            
            if (!user) {
                logger.error(`User with ID: ${userId} not found for deletion`);
                // 🛑 โยน NotFoundError ถ้าหาไม่เจอ
                throw new NotFoundError(`ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ລະຫັດ: ${userId}`);
            }

            // 🛡️ ป้องกันไม่ให้แอดมินลบบัญชีตัวเอง (Optional: ช่วยป้องกันความผิดพลาด)
            if (userId === performedBy) {
                throw new BadRequestError("ບໍ່ສາມາດລຶບບັນຊີຂອງຕົນເອງໄດ້ (Cannot delete your own account)");
            }

            const oldData = user.toJSON();
            delete (oldData as any).password; // ไม่บันทึกรหัสผ่านลง Log

            // 🗑️ สั่งลบ: เนื่องจากเราเปิดโหมด `paranoid: true` ใน Model ไว้แล้ว 
            // Sequelize จะไม่อัปเดตคำสั่ง DELETE จริงๆ แต่จะทำ `UPDATE deleted_at = NOW()` ให้อัตโนมัติ
            await user.destroy({ transaction: t });

            // 📝 บันทึก Audit Log
            await logAudit('users', userId, 'DELETE', oldData, null, performedBy, t);

            await t.commit();
            logger.info(`User with ID: ${userId} deleted (soft delete) successfully`);
            return true;

        } catch (error) {
            await t.rollback();
            logger.error(`Error deleting user with ID: ${userId} - ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new UserRepository();