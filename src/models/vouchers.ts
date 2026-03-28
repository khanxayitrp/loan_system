import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customer_vouchers, customer_vouchersId } from './customer_vouchers';

export interface vouchersAttributes {
  id: number;
  code: string;
  discount_type: 'fixed_amount' | 'percentage' | 'free_interest';
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  start_date: Date;
  end_date: Date;
  usage_limit?: number;
  is_active?: number;
}

export type vouchersPk = "id";
export type vouchersId = vouchers[vouchersPk];
export type vouchersOptionalAttributes = "id" | "max_discount_amount" | "min_order_amount" | "usage_limit" | "is_active";
export type vouchersCreationAttributes = Optional<vouchersAttributes, vouchersOptionalAttributes>;

export class vouchers extends Model<vouchersAttributes, vouchersCreationAttributes> implements vouchersAttributes {
  id!: number;
  code!: string;
  discount_type!: 'fixed_amount' | 'percentage' | 'free_interest';
  discount_value!: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  start_date!: Date;
  end_date!: Date;
  usage_limit?: number;
  is_active?: number;

  // vouchers hasMany customer_vouchers via voucher_id
  customer_vouchers!: customer_vouchers[];
  getCustomer_vouchers!: Sequelize.HasManyGetAssociationsMixin<customer_vouchers>;
  setCustomer_vouchers!: Sequelize.HasManySetAssociationsMixin<customer_vouchers, customer_vouchersId>;
  addCustomer_voucher!: Sequelize.HasManyAddAssociationMixin<customer_vouchers, customer_vouchersId>;
  addCustomer_vouchers!: Sequelize.HasManyAddAssociationsMixin<customer_vouchers, customer_vouchersId>;
  createCustomer_voucher!: Sequelize.HasManyCreateAssociationMixin<customer_vouchers>;
  removeCustomer_voucher!: Sequelize.HasManyRemoveAssociationMixin<customer_vouchers, customer_vouchersId>;
  removeCustomer_vouchers!: Sequelize.HasManyRemoveAssociationsMixin<customer_vouchers, customer_vouchersId>;
  hasCustomer_voucher!: Sequelize.HasManyHasAssociationMixin<customer_vouchers, customer_vouchersId>;
  hasCustomer_vouchers!: Sequelize.HasManyHasAssociationsMixin<customer_vouchers, customer_vouchersId>;
  countCustomer_vouchers!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof vouchers {
    return vouchers.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "code"
    },
    discount_type: {
      type: DataTypes.ENUM('fixed_amount','percentage','free_interest'),
      allowNull: false
    },
    discount_value: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    max_discount_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    min_order_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'vouchers',
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
        name: "code",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "code" },
        ]
      },
    ]
  });
  }
}
