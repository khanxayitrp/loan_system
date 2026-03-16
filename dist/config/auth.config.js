"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    secret: process.env.JWT_ACCESS_SECRET,
    refresh: process.env.JWT_REFRESH_SECRET,
    algorithm: process.env.ALGORITHM,
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    jwtExpiration: 1200, // 1 hour  //3600
    // 🟢 Refresh Token (ອາຍຸຍາວ - ໃຊ້ສຳລັບຕໍ່ອາຍຸ Access Token ອັດຕະໂນມັດ)
    // ແນະນຳ 1 ມື້ (86400) ຫຼື 7 ມື້ (604800) ເພື່ອບໍ່ໃຫ້ພະນັກງານຕ້ອງ Login ໃໝ່ທຸກມື້
    jwtRefreshExpiration: 1800, // 7 ມື້ (7 * 24 * 60 * 60)
};
exports.default = config;
