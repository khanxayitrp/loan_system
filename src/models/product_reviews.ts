import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';
import type { products, productsId } from './products';

export interface product_reviewsAttributes {
  id: number;
  product_id: number;
  customer_id: number;
  order_item_id: number;
  rating: number;
  comment?: string;
  review_image_1?: string;
  created_at?: Date;
}

export type product_reviewsPk = "id";
export type product_reviewsId = product_reviews[product_reviewsPk];
export type product_reviewsOptionalAttributes = "id" | "comment" | "review_image_1" | "created_at";
export type product_reviewsCreationAttributes = Optional<product_reviewsAttributes, product_reviewsOptionalAttributes>;

export class product_reviews extends Model<product_reviewsAttributes, product_reviewsCreationAttributes> implements product_reviewsAttributes {
  id!: number;
  product_id!: number;
  customer_id!: number;
  order_item_id!: number;
  rating!: number;
  comment?: string;
  review_image_1?: string;
  created_at?: Date;

  // product_reviews belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // product_reviews belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;

  static initModel(sequelize: Sequelize.Sequelize): typeof product_reviews {
    return product_reviews.init({
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
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    order_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "order_item_id"
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    review_image_1: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'product_reviews',
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
        name: "order_item_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "order_item_id" },
        ]
      },
      {
        name: "product_id",
        using: "BTREE",
        fields: [
          { name: "product_id" },
        ]
      },
      {
        name: "customer_id",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
    ]
  });
  }
}
