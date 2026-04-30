"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.districts = void 0;
const sequelize_1 = require("sequelize");
class districts extends sequelize_1.Model {
    static initModel(sequelize) {
        return districts.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            district_id: {
                type: sequelize_1.DataTypes.STRING(4),
                allowNull: false,
                unique: "district_id"
            },
            district_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            province_id: {
                type: sequelize_1.DataTypes.STRING(2),
                allowNull: false,
                references: {
                    model: 'provinces',
                    key: 'province_id'
                }
            }
        }, {
            sequelize,
            tableName: 'districts',
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
                    name: "district_id",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "district_id" },
                    ]
                },
                {
                    name: "idx_province_id_ref",
                    using: "BTREE",
                    fields: [
                        { name: "province_id" },
                    ]
                },
            ]
        });
    }
}
exports.districts = districts;
