"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repayments = void 0;
const sequelize_1 = require("sequelize");
class repayments extends sequelize_1.Model {
    static initModel(sequelize) {
        return repayments.init({
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
            schedule_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'repayment_schedules',
                    key: 'id'
                }
            },
            installment_no: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            due_date: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false
            },
            principal_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            interest_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            total_due: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            discounts: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            penalty: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            remaining_principal: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            paid_principal: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00,
                comment: "ยอดสะสมที่ตัดต้นไปแล้วในงวดนี้"
            },
            paid_interest: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00,
                comment: "ยอดสะสมที่ตัดดอกเบี้ยไปแล้วในงวดนี้"
            },
            payment_status: {
                type: sequelize_1.DataTypes.ENUM('unpaid', 'partial', 'paid', 'overdue'),
                allowNull: true,
                defaultValue: "unpaid"
            },
            paid_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'repayments',
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
                {
                    name: "fk_repayments_schedule",
                    using: "BTREE",
                    fields: [
                        { name: "schedule_id" },
                    ]
                },
            ]
        });
    }
}
exports.repayments = repayments;
