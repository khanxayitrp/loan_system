"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partners = void 0;
const sequelize_1 = require("sequelize");
class partners extends sequelize_1.Model {
    static initModel(sequelize) {
        return partners.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            user_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            shop_id: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            shop_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            shop_owner: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            contact_number: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            shop_logo_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            business_type: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            }
        }, {
            sequelize,
            tableName: 'partners',
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
                    name: "user_id",
                    using: "BTREE",
                    fields: [
                        { name: "user_id" },
                    ]
                },
            ]
        });
    }
}
exports.partners = partners;
