import { user_refresh_tokens, user_refresh_tokensAttributes, user_refresh_tokensCreationAttributes } from '../models/user_refresh_tokens';
import { db } from '../models/init-models';
import { Op, Sequelize, where } from 'sequelize';
import { logger } from '@/utils/logger';

class UserRefreshTokenRepository {
    async revokeToken(token: string): Promise<boolean> {
        try {
            const tokenRecord = await db.user_refresh_tokens.findOne({ where: { token } });
            if (!tokenRecord) {
                logger.error(`Token not found: ${token}`);
                return false;
            }
            await tokenRecord.update({ revoked: 1 }, { where: { token } });
            logger.info(`Token revoked: ${token}`);
            return true;
        } catch (error) {
            logger.error(`Error revoking token: ${(error as Error).message}`);
            throw error;
        }
    }

    async createToken(data: user_refresh_tokensCreationAttributes): Promise<user_refresh_tokens> {
         try {
            if (!data.user_id || data.user_id === 0) {
                throw new Error('User ID is required');
            }

            if (!data.token || data.token.trim() === "") {
                throw new Error('Token is required');
            }

            if (!data.expires_at) {
                throw new Error('Expires at is required');
            }

            const formattedData: any = {
                user_id: data.user_id,
                token: data.token?.trim(),
                revokes: 0,
                expires_at: data.expires_at
            }


            const newToken = await db.user_refresh_tokens.create(formattedData);
            logger.info(`Refresh token created for user ID: ${data.user_id}`);
            return newToken;
        } catch (error) {
            logger.error(`Error creating refresh token: ${(error as Error).message}`);
            throw error;
        }
    }

    async findValidToken(token: string): Promise<user_refresh_tokens | null> {
        return await db.user_refresh_tokens.findOne({ where: { token, revoked: 0 } });
    }
}
export default new UserRefreshTokenRepository();