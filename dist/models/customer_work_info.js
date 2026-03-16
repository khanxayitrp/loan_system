"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customer_work_info = void 0;
const sequelize_1 = require("sequelize");
class customer_work_info extends sequelize_1.Model {
    static initModel(sequelize) {
        return customer_work_info.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            customer_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            company_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            business_type: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            business_detail: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            duration_years: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true
            },
            duration_months: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true
            },
            department: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            position: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            salary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'customer_work_info',
            timestamps: true,
            createdAt: 'created_at', // Maps to your column name
            updatedAt: false,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "id" },
                    ]
                },
                {
                    name: "customer_id",
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
            ]
        });
    }
}
exports.customer_work_info = customer_work_info;
