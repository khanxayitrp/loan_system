"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_config_1 = __importDefault(require("../config/auth.config"));
const db_config_1 = require("../config/db.config");
const init_models_1 = require("../models/init-models");
const { user_refresh_tokens: refresh_token } = (0, init_models_1.initModels)(db_config_1.sequelize);
class TokenService {
    generateToken(userId, role, staffLevel, permissions, secret, expiresIn) {
        const payload = { userId, role, staff_level: staffLevel, permissions }; // เก็บเป็น array ของสิทธิ์
        const options = { expiresIn };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    async generateAuthTokens(user) {
        const accessTokenExpires = new Date(Date.now() + auth_config_1.default.jwtExpiration * 60 * 1000);
        const refreshTokenExpires = new Date(Date.now() + auth_config_1.default.jwtRefreshExpiration * 60 * 1000);
        const accessToken = this.generateToken(user.user_id, user.role, user.staff_level, user.permissions, auth_config_1.default.secret, auth_config_1.default.jwtExpiration * 60);
        const refreshToken = this.generateToken(user.user_id, user.role, user.staff_level, user.permissions, auth_config_1.default.refresh, auth_config_1.default.jwtRefreshExpiration * 60);
        await refresh_token.create({
            user_id: user.user_id,
            token: refreshToken,
            expires_at: refreshTokenExpires,
            revoked: 0
        });
        return {
            access: {
                token: accessToken,
                expires: accessTokenExpires
            },
            refresh: {
                token: refreshToken,
                expires: refreshTokenExpires
            }
        };
    }
    verifyToken(token, secret) {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    async revokeRefreshToken(token) {
        await refresh_token.update({ revoked: 1 }, { where: { token } });
    }
    // ใน TokenService.ts
    async revokeAllUserTokens(userId) {
        await refresh_token.update({ revoked: 1 }, { where: { user_id: userId, revoked: 0 } });
    }
    async isRefreshTokenValid(token) {
        const refreshToken = await refresh_token.findOne({
            where: { token, revoked: 0 }
        });
        return !!refreshToken && new Date(refreshToken.expires_at) > new Date();
    }
    // -------------------------------------------------------------
    // 🟢 2. ຟັງຊັນສຳລັບລູກຄ້າ (Customer Portal) - ເພີ່ມໃໝ່
    // -------------------------------------------------------------
    generateCustomerToken(customerId, phone) {
        // ກຳນົດ Payload ໂດຍບໍ່ຕ້ອງມີ staff_level ແລະ permissions
        const payload = {
            userId: customerId,
            role: 'customer',
            phone: phone
        }; // Cast type ເພື່ອປ້ອງກັນ TypeScript Error (ຖ້າບໍ່ໄດ້ອັບເດດ Interface)
        // ອອກ Token ອາຍຸ 7 ມື້ (ສາມາດປັບປ່ຽນໄດ້ເຊັ່ນ '30d')
        const options = { expiresIn: '7d' };
        return jsonwebtoken_1.default.sign(payload, auth_config_1.default.secret, options);
    }
}
exports.default = new TokenService();
