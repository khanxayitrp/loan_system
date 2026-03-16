"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customer_locations = void 0;
const sequelize_1 = require("sequelize");
class customer_locations extends sequelize_1.Model {
    static initModel(sequelize) {
        return customer_locations.init({
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
            location_type: {
                type: sequelize_1.DataTypes.ENUM('home', 'work', 'other'),
                allowNull: false
            },
            latitude: {
                type: sequelize_1.DataTypes.DECIMAL(10, 8),
                allowNull: true
            },
            longitude: {
                type: sequelize_1.DataTypes.DECIMAL(11, 8),
                allowNull: true
            },
            map_url: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            address_detail: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            is_primary: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            }
        }, {
            sequelize,
            tableName: 'customer_locations',
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
                    name: "fk_location_customer",
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
            ]
        });
    }
}
exports.customer_locations = customer_locations;
