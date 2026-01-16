
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import {logger} from '../utils/logger';

dotenv.config();

interface IDbConfig {
  database: string;
  username: string;
  password: string;
  host: string;
  port: number;
  dialect: 'mysql';
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  timezone?: string;
  logging?: boolean | ((sql: string, timing?: number) => void);
} 
// dbConfig.ts
const dbConfig: IDbConfig = {
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
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  };



const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
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

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  }
  catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error; // Re-throw the error for further handling
  } 
}

if (process.env.NODE_ENV !== 'development') {
  testConnection().catch(() => process.exit(1));
}
export default sequelize;
export { sequelize, dbConfig };