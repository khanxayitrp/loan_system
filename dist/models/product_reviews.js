"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.product_reviews = void 0;
const sequelize_1 = require("sequelize");
class product_reviews extends sequelize_1.Model {
    static initModel(sequelize) {
        return product_reviews.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            product_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                }
            },
            customer_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            order_item_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                unique: "order_item_id"
            },
            rating: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            comment: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            review_image_1: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'product_reviews',
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
                    name: "order_item_id",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "order_item_id" },
                    ]
                },
                {
                    name: "product_id",
                    using: "BTREE",
                    fields: [
                        { name: "product_id" },
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
exports.product_reviews = product_reviews;
