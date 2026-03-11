import { users, usersAttributes, usersCreationAttributes } from '../models/users';
import { db } from '../models/init-models';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { Op, Sequelize, QueryTypes, where } from 'sequelize';

// 🟢 1. Import Helper ของเราเข้ามา
import { logAudit } from '../utils/auditLogger';

class UserRepository {
    // 🟢 อัปเดตให้รับ parameter performedBy เพิ่มเติม
    async createUser(data: any, performedBy: number = 1): Promise<users> {
        // เพิ่ม Transaction เพื่อความปลอดภัยตอนบันทึกคู่กับ Audit Log
        const t = await db.sequelize.transaction();
        try {
            const CleanUser = { ...data };

            const existUser = await db.users.findOne({ 
                where: { username: CleanUser.username },
                transaction: t
            });

            if (existUser) {
                throw new Error('Username already exists');
            }

            // 2. Hash Password
            const hashedPassword = await bcrypt.hash(CleanUser.password, 10);
            CleanUser.password = hashedPassword;
            
            const newUser = await db.users.create(CleanUser, { transaction: t });
            
            // 🟢 บันทึก Audit Log (ลบรหัสผ่านออกก่อนบันทึก Log เพื่อความปลอดภัย)
            const logData = newUser.toJSON();
            delete (logData as any).password;
            
            await logAudit('users', newUser.id, 'CREATE', null, logData, performedBy, t);

            await t.commit();
            logger.info(`User created with ID: ${newUser.id}`);
            return newUser;
        } catch (error) {
            await t.rollback();
            logger.error(`Error creating user: ${(error as Error).message}`);
            throw error;
        }
    }
    
    async findAllUsers(): Promise<any[]> {
        const usersWithFeatures = await db.users.findAll({
            attributes: { exclude: ['password'] },
            order: [['id', 'desc']],
            include: [
                {
                    model: db.user_permissions,
                    as: 'user_permissions',          // ✅ must match association alias
                    attributes: ['can_access'],
                    include: [
                        {
                            model: db.features,
                            as: 'feature',     // ✅ must match association alias
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

    async findUserByUsername(username: string): Promise<users | null> {
        return await db.users.findOne({ where: { username } });
    }

    async findUserById(userId: number): Promise<users | null> {
        return await db.users.findByPk(userId);
    }

    // 🟢 อัปเดตให้รับ parameter performedBy เพิ่มเติม
    async updateUser(userId: number, data: any, performedBy: number = 1): Promise<users | null> {
        const t = await db.sequelize.transaction();
        try {
            const user = await db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger.error(`User with ID: ${userId} not found`);
                await t.rollback();
                return null;
            }

            // 🛑 โลจิกป้องกันการเปลี่ยน Role (Protect Role Modification)
            if (data.role && data.role !== user.role) {
                logger.warn(`Attempt to change role for user ID: ${userId} blocked. Role modification is not allowed via standard update.`);
                throw new Error("ບໍ່ອະນຸຍາດໃຫ້ປ່ຽນແປງ Role (Role cannot be changed directly)");
            }

            const oldData = user.toJSON();
            delete (oldData as any).password; // ไม่ควรเก็บรหัสผ่านลง Log

            const updatePayload = { ...data };

            // เข้ารหัสรหัสผ่านใหม่ถ้ามีการส่งมา
            if (updatePayload.password) {
                const hashedPassword = await bcrypt.hash(updatePayload.password, 10);
                updatePayload.password = hashedPassword;
            }

            // อัปเดตข้อมูล 
            const updatedUser = await user.update(updatePayload, { 
                transaction: t 
            });

            // 🟢 บันทึก Audit Log (ลบรหัสผ่านออกก่อนเทียบค่า)
            const newData = { ...updatePayload };
            delete newData.password;
            
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
    
    // 🟢 อัปเดตให้รับ parameter performedBy เพิ่มเติม
    async changeStatusUser(userId: number, status: number, performedBy: number = 1) {
        const t = await db.sequelize.transaction();
        try {
            const user = await db.users.findByPk(userId, { transaction: t });
            if (!user) {
                logger.error(`User with ID: ${userId} not found`);
                await t.rollback();
                return false;
            }

            const oldData = user.toJSON();
            delete (oldData as any).password;

            const updatePayload = { is_active: status };
            await user.update(updatePayload, { transaction: t });

            // 🟢 บันทึก Audit Log
            await logAudit('users', userId, 'UPDATE', oldData, updatePayload, performedBy, t);

            await t.commit();
            const actionText = status === 1 ? 'activated' : 'deactivated';
            logger.info(`User with ID: ${userId} ${actionText} successfully`);
            return true;
            
        } catch (error) {
            await t.rollback();
            logger.error(`Error deactivating user with ID: ${userId} - ${(error as Error).message}`);
            throw error;
        }
    }

}

export default new UserRepository();