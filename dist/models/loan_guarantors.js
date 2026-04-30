"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loan_guarantors = void 0;
const sequelize_1 = require("sequelize");
class loan_guarantors extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_guarantors.init({
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
            name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            identity_number: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true
            },
            date_of_birth: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            age: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            province_id: {
                type: sequelize_1.DataTypes.STRING(2),
                allowNull: true
            },
            district_id: {
                type: sequelize_1.DataTypes.STRING(4),
                allowNull: true
            },
            occupation: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            relationship: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            work_company_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            work_phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            work_location: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            work_province_id: {
                type: sequelize_1.DataTypes.STRING(2),
                allowNull: true
            },
            work_district_id: {
                type: sequelize_1.DataTypes.STRING(4),
                allowNull: true
            },
            work_position: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            work_salary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'loan_guarantors',
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
                    name: "application_id",
                    using: "BTREE",
                    fields: [
                        { name: "application_id" },
                    ]
                },
            ]
        });
    }
}
exports.loan_guarantors = loan_guarantors;
