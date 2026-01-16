
import { users, usersAttributes, usersCreationAttributes } from '../models/users';
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op, Sequelize, QueryTypes, where } from 'sequelize';

class UserRepository {
    async createUser(data: usersCreationAttributes): Promise<users> {
        try {
            const CleanUser = {...data};

            const existUser = await db.users.findOne({ where: { username: CleanUser.username} });

            if (existUser) {
                throw new Error('Username already exists');
            }
            const newUser = await db.users.create(CleanUser)
            logger.info(`User created with ID: ${newUser.id}`);
            return newUser;
        } catch (error) {
            logger.error(`Error creating user: ${(error as Error).message}`);
            throw error;
            
        }
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

}

export default new UserRepository();