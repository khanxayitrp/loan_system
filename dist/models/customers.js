"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customers = void 0;
const sequelize_1 = require("sequelize");
class customers extends sequelize_1.Model {
    static initModel(sequelize) {
        return customers.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            identity_number: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: "identity_number"
            },
            census_number: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true
            },
            first_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            last_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            date_of_birth: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false,
                unique: "phone"
            },
            address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            province_id: {
                type: sequelize_1.DataTypes.STRING(2),
                allowNull: true
            },
            district_id: {
                type: sequelize_1.DataTypes.STRING(4),
                allowNull: true
            },
            age: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            occupation: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            income_per_month: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            other_debt: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            user_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            unit: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            issue_place: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            issue_date: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            kyc_status: {
                type: sequelize_1.DataTypes.ENUM('unverified', 'verified', 'expired', 'rejected'),
                allowNull: true,
                defaultValue: "unverified"
            },
            kyc_verified_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            income_verified_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'customers',
            timestamps: true,
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
                    name: "identity_number",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "identity_number" },
                    ]
                },
                {
                    name: "phone",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "phone" },
                    ]
                },
                {
                    name: "user_id",
                    using: "BTREE",
                    fields: [
                        { name: "user_id" },
                    ]
                },
            ]
        });
    }
}
exports.customers = customers;
