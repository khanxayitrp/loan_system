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
    jwtRefreshExpiration: 1800, //86400, // 24 hours
};

export default config;
