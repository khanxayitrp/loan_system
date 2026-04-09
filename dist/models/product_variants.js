"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.product_variants = void 0;
const sequelize_1 = require("sequelize");
class product_variants extends sequelize_1.Model {
    static initModel(sequelize) {
        return product_variants.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            product_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                }
            },
            system_sku: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true,
                comment: "รหัสที่ระบบสร้างให้อัตโนมัติ (Platform SKU)",
                unique: "system_sku"
            },
            merchant_sku: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: "รหัสที่ร้านค้าตั้งเอง (Seller SKU)"
            },
            color: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true
            },
            size_or_capacity: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true
            },
            weight_gram: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            price: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            stock_quantity: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            image_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'product_variants',
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
                    name: "system_sku",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "system_sku" },
                    ]
                },
                {
                    name: "unique_merchant_sku",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "product_id" },
                        { name: "merchant_sku" },
                    ]
                },
            ]
        });
    }
}
exports.product_variants = product_variants;
