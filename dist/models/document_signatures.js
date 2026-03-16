"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.document_signatures = void 0;
const sequelize_1 = require("sequelize");
class document_signatures extends sequelize_1.Model {
    static initModel(sequelize) {
        return document_signatures.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            application_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                comment: "ອ້າງອີງໄປຫາໃບຄຳຂໍສິນເຊື່ອ",
                references: {
                    model: 'loan_applications',
                    key: 'id'
                }
            },
            document_type: {
                type: sequelize_1.DataTypes.ENUM('contract', 'delivery_note', 'repayment_schedule'),
                allowNull: false
            },
            reference_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                comment: "ID ຂອງເອກະສານນັ້ນໆ (ເຊັ່ນ id ຂອງ loan_contract ຫຼື delivery_receipts)"
            },
            role_type: {
                type: sequelize_1.DataTypes.ENUM('borrower', 'guarantor', 'sales_staff', 'credit_staff', 'credit_head', 'approver_1', 'approver_2', 'approver_3', 'partner_shop', 'village_chief'),
                allowNull: false
            },
            user_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: "ຖ້າເປັນພະນັກງານໃນລະບົບ",
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            signer_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
                comment: "ຖ້າເປັນຄົນນອກ ເຊັ່ນ ລູກຄ້າ, ນາຍບ້ານ"
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'signed', 'rejected'),
                allowNull: true,
                defaultValue: "pending"
            },
            signed_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            signature_image_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            remark: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'document_signatures',
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
                    name: "unique_contract_role",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "document_type" },
                        { name: "reference_id" },
                        { name: "role_type" },
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
                    name: "user_id",
                    using: "BTREE",
                    fields: [
                        { name: "user_id" },
                    ]
                },
            ]
        });
    }
}
exports.document_signatures = document_signatures;
