"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customer_credits = void 0;
const sequelize_1 = require("sequelize");
class customer_credits extends sequelize_1.Model {
    static initModel(sequelize) {
        return customer_credits.init({
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
                },
                unique: "customer_credits_ibfk_1"
            },
            credit_limit: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            available_balance: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('active', 'suspended'),
                allowNull: true,
                defaultValue: "active"
            }
        }, {
            sequelize,
            tableName: 'customer_credits',
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
                    name: "customer_id",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
            ]
        });
    }
}
exports.customer_credits = customer_credits;
