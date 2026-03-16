"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user_permissions = void 0;
const sequelize_1 = require("sequelize");
class user_permissions extends sequelize_1.Model {
    static initModel(sequelize) {
        return user_permissions.init({
            user_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            feature_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: 'features',
                    key: 'id'
                }
            },
            can_access: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            }
        }, {
            sequelize,
            tableName: 'user_permissions',
            timestamps: false,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "user_id" },
                        { name: "feature_id" },
                    ]
                },
                {
                    name: "feature_id",
                    using: "BTREE",
                    fields: [
                        { name: "feature_id" },
                    ]
                },
            ]
        });
    }
}
exports.user_permissions = user_permissions;
