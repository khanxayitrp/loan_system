"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.product_gallery = void 0;
const sequelize_1 = require("sequelize");
class product_gallery extends sequelize_1.Model {
    static initModel(sequelize) {
        return product_gallery.init({
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
            image_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'product_gallery',
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
                    name: "product_gallery_products_FK",
                    using: "BTREE",
                    fields: [
                        { name: "product_id" },
                    ]
                },
            ]
        });
    }
}
exports.product_gallery = product_gallery;
