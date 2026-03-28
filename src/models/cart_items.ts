import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { carts, cartsId } from './carts';
import type { products, productsId } from './products';

export interface cart_itemsAttributes {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  created_at?: Date;
}

export type cart_itemsPk = "id";
export type cart_itemsId = cart_items[cart_itemsPk];
export type cart_itemsOptionalAttributes = "id" | "quantity" | "created_at";
export type cart_itemsCreationAttributes = Optional<cart_itemsAttributes, cart_itemsOptionalAttributes>;

export class cart_items extends Model<cart_itemsAttributes, cart_itemsCreationAttributes> implements cart_itemsAttributes {
  id!: number;
  cart_id!: number;
  product_id!: number;
  quantity!: number;
  created_at?: Date;

  // cart_items belongsTo carts via cart_id
  cart!: carts;
  getCart!: Sequelize.BelongsToGetAssociationMixin<carts>;
  setCart!: Sequelize.BelongsToSetAssociationMixin<carts, cartsId>;
  createCart!: Sequelize.BelongsToCreateAssociationMixin<carts>;
  // cart_items belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;

  static initModel(sequelize: Sequelize.Sequelize): typeof cart_items {
    return cart_items.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    cart_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'carts',
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
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'cart_items',
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
        name: "cart_id",
        using: "BTREE",
        fields: [
          { name: "cart_id" },
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
