"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotions = void 0;
const sequelize_1 = require("sequelize");
class promotions extends sequelize_1.Model {
    static initModel(sequelize) {
        return promotions.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            title: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            start_date: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            end_date: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            image_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            },
            created_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'promotions',
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
                    name: "created_by",
                    using: "BTREE",
                    fields: [
                        { name: "created_by" },
                    ]
                },
            ]
        });
    }
}
exports.promotions = promotions;
