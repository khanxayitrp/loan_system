"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.order_items = void 0;
const sequelize_1 = require("sequelize");
class order_items extends sequelize_1.Model {
    static initModel(sequelize) {
        return order_items.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            order_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id'
                }
            },
            partner_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'partners',
                    key: 'id'
                }
            },
            product_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                }
            },
            quantity: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            price_per_unit: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            sub_total: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            settlement_status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'paid_to_partner'),
                allowNull: true,
                defaultValue: "pending"
            },
            shipping_method: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            tracking_number: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            shipping_fee: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            shipping_status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'preparing', 'shipped', 'delivered', 'returned'),
                allowNull: true,
                defaultValue: "pending"
            }
        }, {
            sequelize,
            tableName: 'order_items',
            timestamps: false,
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
                    name: "order_id",
                    using: "BTREE",
                    fields: [
                        { name: "order_id" },
                    ]
                },
                {
                    name: "partner_id",
                    using: "BTREE",
                    fields: [
                        { name: "partner_id" },
                    ]
                },
                {
                    name: "product_id",
                    using: "BTREE",
                    fields: [
                        { name: "product_id" },
                    ]
                },
            ]
        });
    }
}
exports.order_items = order_items;
