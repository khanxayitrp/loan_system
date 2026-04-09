"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.product_types = void 0;
const sequelize_1 = require("sequelize");
class product_types extends sequelize_1.Model {
    static initModel(sequelize) {
        return product_types.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            partner_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'partners',
                    key: 'id'
                }
            },
            type_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            description: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            }
        }, {
            sequelize,
            tableName: 'product_types',
            timestamps: true,
            createdAt: 'created_at', // แมปชื่อให้ตรงกับใน DB
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
                    name: "partner_id",
                    using: "BTREE",
                    fields: [
                        { name: "partner_id" },
                    ]
                },
            ]
        });
    }
}
exports.product_types = product_types;
