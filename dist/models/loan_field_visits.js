"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loan_field_visits = void 0;
const sequelize_1 = require("sequelize");
class loan_field_visits extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_field_visits.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            application_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'loan_applications',
                    key: 'id'
                }
            },
            visit_type: {
                type: sequelize_1.DataTypes.ENUM('home', 'workplace', 'other'),
                allowNull: false
            },
            visit_date: {
                type: sequelize_1.DataTypes.DATE,
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
            living_condition: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            is_address_correct: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            },
            photo_url_1: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            photo_url_2: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            visited_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'loan_field_visits',
            timestamps: true,
            createdAt: 'created_at', // Maps to your column name
            updatedAt: false,
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
                    name: "application_id",
                    using: "BTREE",
                    fields: [
                        { name: "application_id" },
                    ]
                },
                {
                    name: "visited_by",
                    using: "BTREE",
                    fields: [
                        { name: "visited_by" },
                    ]
                },
            ]
        });
    }
}
exports.loan_field_visits = loan_field_visits;
