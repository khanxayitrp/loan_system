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
            global_category_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: "หมวดหมู่บนแอป E-commerce",
                references: {
                    model: 'global_categories',
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
            image_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 1
            },
            system_sku: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true,
                comment: "รหัสระบบ (System SKU) แพลตฟอร์มสร้างให้",
                unique: "system_sku"
            },
            merchant_sku: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: "รหัสสินค้าที่ร้านค้าตั้งเอง (Seller SKU)"
            },
            stock_quantity: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "สต๊อกคงเหลือรวม"
            },
            reserved_stock: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "สต๊อกที่จองไว้ตอนรออนุมัติ"
            },
            allowed_loan_type: {
                type: sequelize_1.DataTypes.ENUM('single_item', 'bnpl_cart', 'both'),
                allowNull: false,
                defaultValue: "both",
                comment: "ช่องทางอนุญาตการผ่อน"
            }
        }, {
            sequelize,
            tableName: 'products',
            timestamps: true,
            // 🟢 เพิ่ม 2 บรรทัดนี้ เพื่อบอกให้ Sequelize รู้ว่าคอลัมน์ใน DB ชื่ออะไรแน่ๆ
            createdAt: 'created_at',
            updatedAt: 'updated_at',
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
                    name: "unique_product_merchant_sku",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "partner_id" },
                        { name: "merchant_sku" },
                    ]
                },
                {
                    name: "productType_id",
                    using: "BTREE",
                    fields: [
                        { name: "productType_id" },
                    ]
                },
                {
                    name: "fk_products_global_cat",
                    using: "BTREE",
                    fields: [
                        { name: "global_category_id" },
                    ]
                },
            ]
        });
    }
}
exports.products = products;
