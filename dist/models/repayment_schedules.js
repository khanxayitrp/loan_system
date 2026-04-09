"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repayment_schedules = void 0;
const sequelize_1 = require("sequelize");
class repayment_schedules extends sequelize_1.Model {
    static initModel(sequelize) {
        return repayment_schedules.init({
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
            version: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 1,
                comment: "ເວີຊັ່ນຂອງຕາຕະລາງ (ຖ້າມີການ Re-structure ໜີ້ ຈະເພີ່ມຂຶ້ນ)"
            },
            total_principal: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            total_interest: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('draft', 'approved', 'cancelled', 'restructured'),
                allowNull: true,
                defaultValue: "draft"
            },
            approved_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: "ຜູ້ອະນຸມັດຕາຕະລາງ",
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            approved_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            pdf_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
                comment: "ເກັບ Link ໄຟລ໌ PDF ທີ່ລູກຄ້າເຊັນແລ້ວ"
            },
            created_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'repayment_schedules',
            timestamps: true,
            createdAt: 'created_at', // แมปชื่อให้ตรงกับใน DB
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
                    name: "approved_by",
                    using: "BTREE",
                    fields: [
                        { name: "approved_by" },
                    ]
                },
                {
                    name: "created_by",
                    using: "BTREE",
                    fields: [
                        { name: "created_by" },
                    ]
                },
            ]
        });
    }
}
exports.repayment_schedules = repayment_schedules;
