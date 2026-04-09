"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orders = void 0;
const sequelize_1 = require("sequelize");
class orders extends sequelize_1.Model {
    static initModel(sequelize) {
        return orders.init({
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
            order_no: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: "order_no"
            },
            total_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            payment_method: {
                type: sequelize_1.DataTypes.ENUM('cash', 'bank_transfer', 'bnpl'),
                allowNull: false,
                defaultValue: "bnpl"
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'paid', 'cancelled'),
                allowNull: true,
                defaultValue: "pending"
            }
        }, {
            sequelize,
            tableName: 'orders',
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
                    name: "order_no",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "order_no" },
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
exports.orders = orders;
