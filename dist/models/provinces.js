"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provinces = void 0;
const sequelize_1 = require("sequelize");
class provinces extends sequelize_1.Model {
    static initModel(sequelize) {
        return provinces.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            province_id: {
                type: sequelize_1.DataTypes.STRING(2),
                allowNull: false,
                unique: "province_id"
            },
            province_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'provinces',
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
                    name: "province_id",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "province_id" },
                    ]
                },
            ]
        });
    }
}
exports.provinces = provinces;
