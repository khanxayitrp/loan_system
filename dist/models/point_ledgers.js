"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.point_ledgers = void 0;
const sequelize_1 = require("sequelize");
class point_ledgers extends sequelize_1.Model {
    static initModel(sequelize) {
        return point_ledgers.init({
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
            transaction_type: {
                type: sequelize_1.DataTypes.ENUM('earn', 'burn', 'expired', 'refund'),
                allowNull: false
            },
            points: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            reference_type: {
                type: sequelize_1.DataTypes.ENUM('order', 'repayment', 'campaign'),
                allowNull: false
            },
            reference_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'point_ledgers',
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
                    name: "customer_id",
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
            ]
        });
    }
}
exports.point_ledgers = point_ledgers;
