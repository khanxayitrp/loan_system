import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';
import type { products, productsId } from './products';

export interface wishlistsAttributes {
  id: number;
  customer_id: number;
  product_id: number;
  created_at?: Date;
}

export type wishlistsPk = "id";
export type wishlistsId = wishlists[wishlistsPk];
export type wishlistsOptionalAttributes = "id" | "created_at";
export type wishlistsCreationAttributes = Optional<wishlistsAttributes, wishlistsOptionalAttributes>;

export class wishlists extends Model<wishlistsAttributes, wishlistsCreationAttributes> implements wishlistsAttributes {
  id!: number;
  customer_id!: number;
  product_id!: number;
  created_at?: Date;

  // wishlists belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // wishlists belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;

  static initModel(sequelize: Sequelize.Sequelize): typeof wishlists {
    return wishlists.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'wishlists',
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
        name: "unique_wishlist",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "product_id" },
        ]
      },
      {
        name: "product_id",
        using: "BTREE",
        fields: [
          { name: "product_id" },
        ]
      },
    ]
  });
  }
}
