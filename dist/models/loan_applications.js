"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loan_applications = void 0;
const sequelize_1 = require("sequelize");
class loan_applications extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_applications.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            loan_flow_type: {
                type: sequelize_1.DataTypes.ENUM('single_item', 'bnpl_cart'),
                allowNull: false,
                defaultValue: "single_item"
            },
            customer_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            product_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                }
            },
            order_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'orders',
                    key: 'id'
                }
            },
            loan_id: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            total_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            loan_period: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            interest_rate_at_apply: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false
            },
            interest_type: {
                type: sequelize_1.DataTypes.ENUM('flat_rate', 'effective_rate'),
                allowNull: false,
                defaultValue: "flat_rate",
                comment: "ประเภทการคำนวณดอกเบี้ย (flat_rate=คงที่, effective_rate=ลดต้นลดดอก)"
            },
            interest_rate_type: {
                type: sequelize_1.DataTypes.ENUM('monthly', 'yearly'),
                allowNull: false,
                defaultValue: "monthly",
                comment: "ระยะเวลาของดอกเบี้ย"
            },
            monthly_pay: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            is_confirmed: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'verifying', 'verified', 'approved', 'disbursed', 'rejected', 'cancelled', 'completed', 'closed_early'),
                allowNull: true,
                defaultValue: "pending"
            },
            requester_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            approver_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            applied_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            approved_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            credit_score: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            down_payment: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            fee: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
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
            borrower_signature_date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            guarantor_signature_date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            staff_signature_date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'loan_applications',
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
                {
                    name: "product_id",
                    using: "BTREE",
                    fields: [
                        { name: "product_id" },
                    ]
                },
                {
                    name: "requester_id",
                    using: "BTREE",
                    fields: [
                        { name: "requester_id" },
                    ]
                },
                {
                    name: "approver_id",
                    using: "BTREE",
                    fields: [
                        { name: "approver_id" },
                    ]
                },
                {
                    name: "fk_loan_order",
                    using: "BTREE",
                    fields: [
                        { name: "order_id" },
                    ]
                },
            ]
        });
    }
}
exports.loan_applications = loan_applications;
