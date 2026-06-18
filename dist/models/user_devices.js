"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user_devices = void 0;
const sequelize_1 = require("sequelize");
class user_devices extends sequelize_1.Model {
    static initModel(sequelize) {
        return user_devices.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true
            },
            owner_type: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                comment: "เช่น CUSTOMER, STAFF"
            },
            owner_id: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                comment: "รหัสของลูกค้าหรือพนักงาน"
            },
            device_token: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: "FCM Token หรือ APNs Token",
                unique: "idx_unique_device_token"
            },
            platform: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                comment: "เช่น IOS, ANDROID, WEB"
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1,
                comment: "ถ้าส่งไม่ผ่านให้ปรับเป็น FALSE"
            }
        }, {
            sequelize,
            tableName: 'user_devices',
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
                    name: "idx_unique_device_token",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "device_token" },
                    ]
                },
                {
                    name: "idx_owner_active_devices",
                    using: "BTREE",
                    fields: [
                        { name: "owner_type" },
                        { name: "owner_id" },
                        { name: "is_active" },
                    ]
                },
            ]
        });
    }
}
exports.user_devices = user_devices;
