"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loan_contract = void 0;
const sequelize_1 = require("sequelize");
class loan_contract extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_contract.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            loan_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'loan_applications',
                    key: 'id'
                }
            },
            loan_contract_number: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                unique: "loan_contract_unique"
            },
            cus_full_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            cus_sex: {
                type: sequelize_1.DataTypes.STRING(10),
                allowNull: false
            },
            cus_date_of_birth: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            cus_phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            cus_marital_status: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            cus_id_pass_number: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false
            },
            cus_id_pass_date: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            cus_census_number: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true
            },
            cus_census_created: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            cus_census_authorize_by: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            cus_house_number: {
                type: sequelize_1.DataTypes.STRING(10),
                allowNull: false
            },
            cus_unit: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            cus_address: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            cus_lived_year: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            cus_lived_with: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            cus_lived_situation: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            cus_occupation: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: "ອາຊີບລູກຄ້າ (ຖ້າມີ)",
            },
            cus_company_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            cus_company_businessType: {
                type: sequelize_1.DataTypes.STRING(255),
                field: 'cus_company_businessType',
                allowNull: false
            },
            cus_company_location: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            cus_company_workYear: {
                type: sequelize_1.DataTypes.INTEGER,
                field: 'cus_company_workYear',
                allowNull: false
            },
            cus_position: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            cus_income: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            cus_payroll_date: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            cus_company_emp_number: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            cus_income_other: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            cus_income_other_source: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            product_detail: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            producttype_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'product_types',
                    key: 'id'
                }
            },
            product_brand: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            product_model: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            product_price: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            product_down_payment: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            total_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            interest_rate_at_apply: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false
            },
            loan_period: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            total_interest: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            fee: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            monthly_pay: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            first_installment_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            payment_day: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 1
            },
            motor_id: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            motor_color: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            tank_number: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            motor_warranty: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            partner_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'partners',
                    key: 'id'
                }
            },
            shop_branch: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            shop_id: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            ref_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            ref_date_of_birth: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            ref_phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            ref_sex: {
                type: sequelize_1.DataTypes.STRING(10),
                allowNull: false
            },
            ref_marital_status: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            ref_id_pass_number: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false
            },
            ref_id_pass_date: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            ref_census_number: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true
            },
            ref_census_created: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true
            },
            ref_census_authorize_by: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            ref_house_number: {
                type: sequelize_1.DataTypes.STRING(10),
                allowNull: false
            },
            ref_unit: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            ref_address: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            ref_lived_year: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            ref_lived_with: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            ref_lived_situation: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            ref_occupation: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            ref_relationship: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            ref_company_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            ref_company_businessType: {
                type: sequelize_1.DataTypes.STRING(255),
                field: 'ref_company_businessType',
                allowNull: false
            },
            ref_company_location: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            ref_company_workYear: {
                type: sequelize_1.DataTypes.INTEGER,
                field: 'ref_company_workYear',
                allowNull: false
            },
            ref_position: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            ref_income: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            ref_payroll_date: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            ref_company_emp_number: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            ref_income_other: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            ref_income_other_source: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            is_confirmed: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            version: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: "เลขเวอร์ชันของสัญญา"
            },
            created_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: "พนักงานที่ออกสัญญา",
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            updated_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: "พนักงานที่แก้ไขล่าสุด",
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'loan_contract',
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
                    name: "loan_contract_unique",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "loan_contract_number" },
                    ]
                },
                {
                    name: "loan_id",
                    using: "BTREE",
                    fields: [
                        { name: "loan_id" },
                    ]
                },
                {
                    name: "partner_id",
                    using: "BTREE",
                    fields: [
                        { name: "partner_id" },
                    ]
                },
                {
                    name: "producttype_id",
                    using: "BTREE",
                    fields: [
                        { name: "producttype_id" },
                    ]
                },
                {
                    name: "fk_contract_created",
                    using: "BTREE",
                    fields: [
                        { name: "created_by" },
                    ]
                },
                {
                    name: "fk_contract_updated",
                    using: "BTREE",
                    fields: [
                        { name: "updated_by" },
                    ]
                },
            ]
        });
    }
}
exports.loan_contract = loan_contract;
