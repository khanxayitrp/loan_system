import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface credit_ledgersAttributes {
  id: number;
  customer_id: number;
  order_id?: number;
  transaction_type: 'deduct' | 'refund' | 'repayment' | 'limit_increase';
  amount: number;
  created_at?: Date;
}

export type credit_ledgersPk = "id";
export type credit_ledgersId = credit_ledgers[credit_ledgersPk];
export type credit_ledgersOptionalAttributes = "id" | "order_id" | "created_at";
export type credit_ledgersCreationAttributes = Optional<credit_ledgersAttributes, credit_ledgersOptionalAttributes>;

export class credit_ledgers extends Model<credit_ledgersAttributes, credit_ledgersCreationAttributes> implements credit_ledgersAttributes {
  id!: number;
  customer_id!: number;
  order_id?: number;
  transaction_type!: 'deduct' | 'refund' | 'repayment' | 'limit_increase';
  amount!: number;
  created_at?: Date;

  // credit_ledgers belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_ledgers {
    return credit_ledgers.init({
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
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    transaction_type: {
      type: DataTypes.ENUM('deduct','refund','repayment','limit_increase'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'credit_ledgers',
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
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
    ]
  });
  }
}
