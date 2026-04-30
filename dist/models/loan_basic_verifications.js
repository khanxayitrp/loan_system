"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loan_basic_verifications = void 0;
const sequelize_1 = require("sequelize");
class loan_basic_verifications extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_basic_verifications.init({
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
            cus_contact_method: {
                type: sequelize_1.DataTypes.ENUM('face_to_face', 'phone'),
                allowNull: true
            },
            verified_first_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            verified_last_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            verified_dob: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            verified_address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            verified_province_id: {
                type: sequelize_1.DataTypes.STRING(2),
                allowNull: true
            },
            verified_district_id: {
                type: sequelize_1.DataTypes.STRING(4),
                allowNull: true
            },
            verified_product_type: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            verified_price: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            verified_down_payment: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            verified_monthly_pay: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            has_id_card: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            has_census_book: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            has_income_doc: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            has_other_doc: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            other_doc_detail: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            cus_credibility_assessment: {
                type: sequelize_1.DataTypes.ENUM('reliable', 'unreliable'),
                allowNull: true
            },
            work_company_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            work_position: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            work_salary: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            work_years: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            workplace_assessment: {
                type: sequelize_1.DataTypes.ENUM('good', 'moderate', 'bad'),
                allowNull: true
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('draft', 'completed'),
                allowNull: true,
                defaultValue: "draft"
            },
            verified_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'loan_basic_verifications',
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
                    name: "application_id",
                    using: "BTREE",
                    fields: [
                        { name: "application_id" },
                    ]
                },
                {
                    name: "verified_by",
                    using: "BTREE",
                    fields: [
                        { name: "verified_by" },
                    ]
                },
            ]
        });
    }
}
exports.loan_basic_verifications = loan_basic_verifications;
