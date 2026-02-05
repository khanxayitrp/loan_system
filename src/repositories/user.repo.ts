
import { users, usersAttributes, usersCreationAttributes } from '../models/users';
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import bcrypt from 'bcryptjs';
import { Op, Sequelize, QueryTypes, where } from 'sequelize';

class UserRepository {
    async createUser(data: usersCreationAttributes): Promise<users> {
        try {
            const CleanUser = { ...data };

            const existUser = await db.users.findOne({ where: { username: CleanUser.username } });

            if (existUser) {
                throw new Error('Username already exists');
            }

            // 2. Hash Password
            const hashedPassword = await bcrypt.hash(CleanUser.password, 10);
            CleanUser.password = hashedPassword;
            const newUser = await db.users.create(CleanUser)
            logger.info(`User created with ID: ${newUser.id}`);
            return newUser;
        } catch (error) {
            logger.error(`Error creating user: ${(error as Error).message}`);
            throw error;

        }
    }
    // async findAllUsers(): Promise<users[]> {
    //     return await db.users.findAll({

    //         attributes: { exclude: ['password'] },
    //         order: [['id', 'desc']],
    //         include: [
    //             {
    //                 model: db.user_permissions,
    //                 attributes: ['can_access'],
    //                 include: [
    //                     {
    //                         model: db.features,
    //                         attributes: ['feature_name', 'description'],
    //                     },
    //                 ],
    //             },
    //         ],
    //     });
    // }
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

    async updateUser(userId: number, data: Partial<usersAttributes>): Promise<users | null> {
        try {
            const user = await this.findUserById(userId);
            if (!user) {
                logger.error(`User with ID: ${userId} not found`);
                return null;
            }

            const updatedUser = await user.update(data, {
                where: { id: userId },
                returning: true
            });
            logger.info(`User with ID: ${userId} updated successfully`);
            return updatedUser;
        } catch (error) {
            logger.error(`Error updating user with ID: ${userId} - ${(error as Error).message}`);
            throw error;
        }
    }
    async changeStatusUser(userId: number, status: number) {
        try {
            const user = await this.findUserById(userId);
            if (!user) {
                logger.error(`User with ID: ${userId} not found`);
                return false;
            }
            if (status === 1) {
                await user.update({ is_active: 1 });
                logger.info(`User with ID: ${userId} activated successfully`);
                return true;
            } else {
                await user.update({ is_active: 0 });
                logger.info(`User with ID: ${userId} deactivated successfully`);
                return true;
            }
        } catch (error) {
            logger.error(`Error deactivating user with ID: ${userId} - ${(error as Error).message}`);
            throw error;
        }
    }

}

export default new UserRepository();