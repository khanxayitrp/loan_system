"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credit_ledgers = void 0;
const sequelize_1 = require("sequelize");
class credit_ledgers extends sequelize_1.Model {
    static initModel(sequelize) {
        return credit_ledgers.init({
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
            order_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true
            },
            transaction_type: {
                type: sequelize_1.DataTypes.ENUM('deduct', 'refund', 'repayment', 'limit_increase'),
                allowNull: false
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'credit_ledgers',
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
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
            ]
        });
    }
}
exports.credit_ledgers = credit_ledgers;
