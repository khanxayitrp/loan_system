import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface customer_creditsAttributes {
  id: number;
  customer_id: number;
  credit_limit: number;
  available_balance: number;
  status?: 'active' | 'suspended';
  updated_at?: Date;
}

export type customer_creditsPk = "id";
export type customer_creditsId = customer_credits[customer_creditsPk];
export type customer_creditsOptionalAttributes = "id" | "credit_limit" | "available_balance" | "status" | "updated_at";
export type customer_creditsCreationAttributes = Optional<customer_creditsAttributes, customer_creditsOptionalAttributes>;

export class customer_credits extends Model<customer_creditsAttributes, customer_creditsCreationAttributes> implements customer_creditsAttributes {
  id!: number;
  customer_id!: number;
  credit_limit!: number;
  available_balance!: number;
  status?: 'active' | 'suspended';
  updated_at?: Date;

  // customer_credits belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_credits {
    return customer_credits.init({
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
      unique: "customer_credits_ibfk_1"
    },
    credit_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    available_balance: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('active','suspended'),
      allowNull: true,
      defaultValue: "active"
    }
  }, {
    sequelize,
    tableName: 'customer_credits',
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
