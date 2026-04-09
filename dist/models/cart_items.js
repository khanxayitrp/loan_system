"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cart_items = void 0;
const sequelize_1 = require("sequelize");
class cart_items extends sequelize_1.Model {
    static initModel(sequelize) {
        return cart_items.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            cart_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'carts',
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
            }
        }, {
            sequelize,
            tableName: 'cart_items',
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
                    name: "cart_id",
                    using: "BTREE",
                    fields: [
                        { name: "cart_id" },
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
exports.cart_items = cart_items;
