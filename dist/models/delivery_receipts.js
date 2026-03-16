"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delivery_receipts = void 0;
const sequelize_1 = require("sequelize");
class delivery_receipts extends sequelize_1.Model {
    static initModel(sequelize) {
        return delivery_receipts.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            application_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                unique: "unique_application_id",
                references: {
                    model: 'loan_applications',
                    key: 'id'
                }
            },
            receipts_id: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false
            },
            delivery_date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            },
            receiver_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            receipt_image_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected'),
                allowNull: true,
                defaultValue: "pending"
            },
            remark: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            approver_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            approved_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'delivery_receipts',
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
                    name: "fk_delivery_application",
                    using: "BTREE",
                    fields: [
                        { name: "application_id" },
                    ]
                },
                {
                    name: "fk_delivery_approver",
                    using: "BTREE",
                    fields: [
                        { name: "approver_id" },
                    ]
                },
            ]
        });
    }
}
exports.delivery_receipts = delivery_receipts;
