"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cus_requestform = void 0;
const sequelize_1 = require("sequelize");
class cus_requestform extends sequelize_1.Model {
    static initModel(sequelize) {
        return cus_requestform.init({
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
            customer_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            is_confirmed: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            created_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            updated_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'cus_requestform',
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
                    name: "customer_id",
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
                {
                    name: "fk_req_created",
                    using: "BTREE",
                    fields: [
                        { name: "created_by" },
                    ]
                },
                {
                    name: "fk_req_updated",
                    using: "BTREE",
                    fields: [
                        { name: "updated_by" },
                    ]
                },
            ]
        });
    }
}
exports.cus_requestform = cus_requestform;
