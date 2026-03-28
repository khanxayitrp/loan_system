import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { products, productsId } from './products';

export interface product_variantsAttributes {
  id: number;
  product_id: number;
  system_sku?: string;
  merchant_sku?: string;
  color?: string;
  size_or_capacity?: string;
  weight_gram?: number;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

export type product_variantsPk = "id";
export type product_variantsId = product_variants[product_variantsPk];
export type product_variantsOptionalAttributes = "id" | "system_sku" | "merchant_sku" | "color" | "size_or_capacity" | "weight_gram" | "stock_quantity" | "image_url";
export type product_variantsCreationAttributes = Optional<product_variantsAttributes, product_variantsOptionalAttributes>;

export class product_variants extends Model<product_variantsAttributes, product_variantsCreationAttributes> implements product_variantsAttributes {
  id!: number;
  product_id!: number;
  system_sku?: string;
  merchant_sku?: string;
  color?: string;
  size_or_capacity?: string;
  weight_gram?: number;
  price!: number;
  stock_quantity!: number;
  image_url?: string;

  // product_variants belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;

  static initModel(sequelize: Sequelize.Sequelize): typeof product_variants {
    return product_variants.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    system_sku: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "รหัสที่ระบบสร้างให้อัตโนมัติ (Platform SKU)",
      unique: "system_sku"
    },
    merchant_sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "รหัสที่ร้านค้าตั้งเอง (Seller SKU)"
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    size_or_capacity: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    weight_gram: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    price: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    image_url: {
      type: DataTypes.STRING(255),
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
