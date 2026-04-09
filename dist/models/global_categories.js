"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.global_categories = void 0;
const sequelize_1 = require("sequelize");
class global_categories extends sequelize_1.Model {
    static initModel(sequelize) {
        return global_categories.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            category_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            prefix_code: {
                type: sequelize_1.DataTypes.STRING(5),
                allowNull: false,
                comment: "ตัวย่อหมวดหมู่ 2-3 ตัวอักษร เช่น MB, MC, GD",
                unique: "prefix_code"
            },
            description: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            icon_url: {
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
            tableName: 'global_categories',
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
                    name: "prefix_code",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "prefix_code" },
                    ]
                },
            ]
        });
    }
}
exports.global_categories = global_categories;
