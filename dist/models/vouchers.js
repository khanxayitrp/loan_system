"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vouchers = void 0;
const sequelize_1 = require("sequelize");
class vouchers extends sequelize_1.Model {
    static initModel(sequelize) {
        return vouchers.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            code: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: "code"
            },
            discount_type: {
                type: sequelize_1.DataTypes.ENUM('fixed_amount', 'percentage', 'free_interest'),
                allowNull: false
            },
            discount_value: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            max_discount_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            min_order_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            start_date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            },
            end_date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            },
            usage_limit: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            }
        }, {
            sequelize,
            tableName: 'vouchers',
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
                    name: "code",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "code" },
                    ]
                },
            ]
        });
    }
}
exports.vouchers = vouchers;
