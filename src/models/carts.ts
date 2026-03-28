import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { cart_items, cart_itemsId } from './cart_items';
import type { customers, customersId } from './customers';

export interface cartsAttributes {
  id: number;
  customer_id: number;
  created_at?: Date;
}

export type cartsPk = "id";
export type cartsId = carts[cartsPk];
export type cartsOptionalAttributes = "id" | "created_at";
export type cartsCreationAttributes = Optional<cartsAttributes, cartsOptionalAttributes>;

export class carts extends Model<cartsAttributes, cartsCreationAttributes> implements cartsAttributes {
  id!: number;
  customer_id!: number;
  created_at?: Date;

  // carts hasMany cart_items via cart_id
  cart_items!: cart_items[];
  getCart_items!: Sequelize.HasManyGetAssociationsMixin<cart_items>;
  setCart_items!: Sequelize.HasManySetAssociationsMixin<cart_items, cart_itemsId>;
  addCart_item!: Sequelize.HasManyAddAssociationMixin<cart_items, cart_itemsId>;
  addCart_items!: Sequelize.HasManyAddAssociationsMixin<cart_items, cart_itemsId>;
  createCart_item!: Sequelize.HasManyCreateAssociationMixin<cart_items>;
  removeCart_item!: Sequelize.HasManyRemoveAssociationMixin<cart_items, cart_itemsId>;
  removeCart_items!: Sequelize.HasManyRemoveAssociationsMixin<cart_items, cart_itemsId>;
  hasCart_item!: Sequelize.HasManyHasAssociationMixin<cart_items, cart_itemsId>;
  hasCart_items!: Sequelize.HasManyHasAssociationsMixin<cart_items, cart_itemsId>;
  countCart_items!: Sequelize.HasManyCountAssociationsMixin;
  // carts belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof carts {
    return carts.init({
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
      },
      unique: "carts_ibfk_1"
    }
  }, {
    sequelize,
    tableName: 'carts',
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
        name: "customer_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
    ]
  });
  }
}
