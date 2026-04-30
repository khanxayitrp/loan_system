"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const sequelize_1 = require("sequelize");
class users extends sequelize_1.Model {
    static initModel(sequelize) {
        return users.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            username: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: "username"
            },
            password: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            full_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            role: {
                type: sequelize_1.DataTypes.ENUM('admin', 'staff', 'partner', 'customer'),
                allowNull: false
            },
            staff_level: {
                type: sequelize_1.DataTypes.ENUM('approver', 'sales', 'credit_officer', 'credit_manager', 'deputy_director', 'director', 'none'),
                allowNull: true,
                defaultValue: "none"
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            },
            // 🟢 เพิ่มฟิลด์ deleted_at ตรงนี้
            deleted_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'users',
            timestamps: true,
            // 🟢 เพิ่ม 4 บรรทัดนี้ เพื่อเปิดโหมด Soft Delete และ Map ชื่อคอลัมน์
            paranoid: true,
            deletedAt: 'deleted_at',
            createdAt: 'created_at',
            updatedAt: 'updated_at',
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
                    name: "username",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "username" },
                    ]
                },
            ]
        });
    }
}
exports.users = users;
