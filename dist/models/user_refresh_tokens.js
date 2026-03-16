"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user_refresh_tokens = void 0;
const sequelize_1 = require("sequelize");
class user_refresh_tokens extends sequelize_1.Model {
    static initModel(sequelize) {
        return user_refresh_tokens.init({
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
            token: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false
            },
            device_info: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            ip_address: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true
            },
            revoked: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            expires_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'user_refresh_tokens',
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
                    name: "user_id",
                    using: "BTREE",
                    fields: [
                        { name: "user_id" },
                    ]
                },
                {
                    name: "idx_expires_at",
                    using: "BTREE",
                    fields: [
                        { name: "expires_at" },
                    ]
                },
                {
                    name: "idx_revoked",
                    using: "BTREE",
                    fields: [
                        { name: "revoked" },
                    ]
                },
            ]
        });
    }
}
exports.user_refresh_tokens = user_refresh_tokens;
