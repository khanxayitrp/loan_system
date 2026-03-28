import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { orders, ordersId } from './orders';
import type { partners, partnersId } from './partners';
import type { products, productsId } from './products';

export interface order_itemsAttributes {
  id: number;
  order_id: number;
  partner_id: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  sub_total: number;
  settlement_status?: 'pending' | 'paid_to_partner';
  shipping_method?: string;
  tracking_number?: string;
  shipping_fee?: number;
  shipping_status?: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned';
}

export type order_itemsPk = "id";
export type order_itemsId = order_items[order_itemsPk];
export type order_itemsOptionalAttributes = "id" | "quantity" | "settlement_status" | "shipping_method" | "tracking_number" | "shipping_fee" | "shipping_status";
export type order_itemsCreationAttributes = Optional<order_itemsAttributes, order_itemsOptionalAttributes>;

export class order_items extends Model<order_itemsAttributes, order_itemsCreationAttributes> implements order_itemsAttributes {
  id!: number;
  order_id!: number;
  partner_id!: number;
  product_id!: number;
  quantity!: number;
  price_per_unit!: number;
  sub_total!: number;
  settlement_status?: 'pending' | 'paid_to_partner';
  shipping_method?: string;
  tracking_number?: string;
  shipping_fee?: number;
  shipping_status?: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned';

  // order_items belongsTo orders via order_id
  order!: orders;
  getOrder!: Sequelize.BelongsToGetAssociationMixin<orders>;
  setOrder!: Sequelize.BelongsToSetAssociationMixin<orders, ordersId>;
  createOrder!: Sequelize.BelongsToCreateAssociationMixin<orders>;
  // order_items belongsTo partners via partner_id
  partner!: partners;
  getPartner!: Sequelize.BelongsToGetAssociationMixin<partners>;
  setPartner!: Sequelize.BelongsToSetAssociationMixin<partners, partnersId>;
  createPartner!: Sequelize.BelongsToCreateAssociationMixin<partners>;
  // order_items belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;

  static initModel(sequelize: Sequelize.Sequelize): typeof order_items {
    return order_items.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'partners',
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
    },
    price_per_unit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    sub_total: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    settlement_status: {
      type: DataTypes.ENUM('pending','paid_to_partner'),
      allowNull: true,
      defaultValue: "pending"
    },
    shipping_method: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    shipping_status: {
      type: DataTypes.ENUM('pending','preparing','shipped','delivered','returned'),
      allowNull: true,
      defaultValue: "pending"
    }
  }, {
    sequelize,
    tableName: 'order_items',
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
        name: "order_id",
        using: "BTREE",
        fields: [
          { name: "order_id" },
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
