"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customer_points = void 0;
const sequelize_1 = require("sequelize");
class customer_points extends sequelize_1.Model {
    static initModel(sequelize) {
        return customer_points.init({
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
                },
                unique: "customer_points_ibfk_1"
            },
            total_points: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        }, {
            sequelize,
            tableName: 'customer_points',
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
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
            ]
        });
    }
}
exports.customer_points = customer_points;
