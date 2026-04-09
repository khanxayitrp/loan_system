"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carts = void 0;
const sequelize_1 = require("sequelize");
class carts extends sequelize_1.Model {
    static initModel(sequelize) {
        return carts.init({
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
                unique: "carts_ibfk_1"
            }
        }, {
            sequelize,
            tableName: 'carts',
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
exports.carts = carts;
