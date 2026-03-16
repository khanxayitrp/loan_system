"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.products = void 0;
const sequelize_1 = require("sequelize");
class products extends sequelize_1.Model {
    static initModel(sequelize) {
        return products.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            partner_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'partners',
                    key: 'id'
                }
            },
            productType_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                field: 'productType_id',
                references: {
                    model: 'product_types',
                    key: 'id'
                }
            },
            product_name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: "รายละเอียดสินค้า"
            },
            brand: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            model: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            price: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            interest_rate: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false
            },
            interest_rate_type: {
                type: sequelize_1.DataTypes.ENUM('monthly', 'yearly'),
                allowNull: false,
                defaultValue: "monthly",
                comment: "เรทดอกเบี้ย (ต่อเดือน หรือ ต่อปี)"
            },
            image_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            }
        }, {
            sequelize,
            tableName: 'products',
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
                    name: "partner_id",
                    using: "BTREE",
                    fields: [
                        { name: "partner_id" },
                    ]
                },
                {
                    name: "productType_id",
                    using: "BTREE",
                    fields: [
                        { name: "productType_id" },
                    ]
                },
            ]
        });
    }
}
exports.products = products;
