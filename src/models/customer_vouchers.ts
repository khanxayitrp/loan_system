import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';
import type { vouchers, vouchersId } from './vouchers';

export interface customer_vouchersAttributes {
  id: number;
  customer_id: number;
  voucher_id: number;
  is_used?: number;
  order_id?: number;
  used_at?: Date;
}

export type customer_vouchersPk = "id";
export type customer_vouchersId = customer_vouchers[customer_vouchersPk];
export type customer_vouchersOptionalAttributes = "id" | "is_used" | "order_id" | "used_at";
export type customer_vouchersCreationAttributes = Optional<customer_vouchersAttributes, customer_vouchersOptionalAttributes>;

export class customer_vouchers extends Model<customer_vouchersAttributes, customer_vouchersCreationAttributes> implements customer_vouchersAttributes {
  id!: number;
  customer_id!: number;
  voucher_id!: number;
  is_used?: number;
  order_id?: number;
  used_at?: Date;

  // customer_vouchers belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // customer_vouchers belongsTo vouchers via voucher_id
  voucher!: vouchers;
  getVoucher!: Sequelize.BelongsToGetAssociationMixin<vouchers>;
  setVoucher!: Sequelize.BelongsToSetAssociationMixin<vouchers, vouchersId>;
  createVoucher!: Sequelize.BelongsToCreateAssociationMixin<vouchers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_vouchers {
    return customer_vouchers.init({
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
    voucher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vouchers',
        key: 'id'
      }
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'customer_vouchers',
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
        name: "customer_id",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
      {
        name: "voucher_id",
        using: "BTREE",
        fields: [
          { name: "voucher_id" },
        ]
      },
    ]
  });
  }
}
