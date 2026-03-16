"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loan_cib_history_details = void 0;
const sequelize_1 = require("sequelize");
class loan_cib_history_details extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_cib_history_details.init({
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
            institution_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            account_type: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            history_status: {
                type: sequelize_1.DataTypes.ENUM('no_delay', 'delay_30_days', 'delay_60_days', 'delay_90_days', 'blacklist'),
                allowNull: false
            },
            outstanding_balance: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'loan_cib_history_details',
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
exports.loan_cib_history_details = loan_cib_history_details;
