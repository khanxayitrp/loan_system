"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlists = void 0;
const sequelize_1 = require("sequelize");
class wishlists extends sequelize_1.Model {
    static initModel(sequelize) {
        return wishlists.init({
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
            product_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'wishlists',
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
                    name: "unique_wishlist",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                        { name: "product_id" },
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
exports.wishlists = wishlists;
