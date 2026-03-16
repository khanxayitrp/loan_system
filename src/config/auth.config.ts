import dotenv from 'dotenv';

dotenv.config();

interface Config {
    secret?: string;
    refresh?: string;
    algorithm?: string;
    expiresIn?: string;
    refreshTokenExpiresIn?: string;
    jwtExpiration?: number;
    jwtRefreshExpiration?: number;
}

const config: Config = {
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

export default config;
