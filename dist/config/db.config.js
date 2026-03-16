"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = exports.sequelize = exports.testConnection = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const sequelize_1 = require("sequelize");
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
// dbConfig.ts
const dbConfig = {
    database: process.env.DB_NAME || 'insee_cus_loan_db',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    timezone: '+07:00', // Set timezone to UTC
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger_1.logger.debug(msg) : false,
};
exports.dbConfig = dbConfig;
const sequelize = new sequelize_1.Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    timezone: dbConfig.timezone,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
    define: {
        underscored: true, // Use snake_case for table and column names
        timestamps: true, // Enable createdAt and updatedAt fields
        freezeTableName: true, // Prevent Sequelize from pluralizing table names
    },
});
exports.sequelize = sequelize;
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        logger_1.logger.info('Database connection has been established successfully.');
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
        throw error; // Re-throw the error for further handling
    }
};
exports.testConnection = testConnection;
if (process.env.NODE_ENV !== 'development') {
    (0, exports.testConnection)().catch(() => process.exit(1));
}
exports.default = sequelize;
