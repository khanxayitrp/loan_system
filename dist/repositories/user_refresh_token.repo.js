"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
class UserRefreshTokenRepository {
    async revokeToken(token) {
        try {
            const tokenRecord = await init_models_1.db.user_refresh_tokens.findOne({ where: { token } });
            if (!tokenRecord) {
                logger_1.logger.error(`Token not found: ${token}`);
                return false;
            }
            await tokenRecord.update({ revoked: 1 }, { where: { token } });
            logger_1.logger.info(`Token revoked: ${token}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error revoking token: ${error.message}`);
            throw error;
        }
    }
    async createToken(data) {
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
            const formattedData = {
                user_id: data.user_id,
                token: data.token?.trim(),
                revokes: 0,
                expires_at: data.expires_at
            };
            const newToken = await init_models_1.db.user_refresh_tokens.create(formattedData);
            logger_1.logger.info(`Refresh token created for user ID: ${data.user_id}`);
            return newToken;
        }
        catch (error) {
            logger_1.logger.error(`Error creating refresh token: ${error.message}`);
            throw error;
        }
    }
    async findValidToken(token) {
        return await init_models_1.db.user_refresh_tokens.findOne({ where: { token, revoked: 0 } });
    }
}
exports.default = new UserRefreshTokenRepository();
