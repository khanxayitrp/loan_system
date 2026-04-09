"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customer_vouchers = void 0;
const sequelize_1 = require("sequelize");
class customer_vouchers extends sequelize_1.Model {
    static initModel(sequelize) {
        return customer_vouchers.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            customer_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            voucher_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'vouchers',
                    key: 'id'
                }
            },
            is_used: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            order_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true
            },
            used_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'customer_vouchers',
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
                    name: "customer_id",
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
                {
                    name: "voucher_id",
                    using: "BTREE",
                    fields: [
                        { name: "voucher_id" },
                    ]
                },
            ]
        });
    }
}
exports.customer_vouchers = customer_vouchers;
