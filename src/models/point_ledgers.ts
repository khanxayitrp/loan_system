import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface point_ledgersAttributes {
  id: number;
  customer_id: number;
  transaction_type: 'earn' | 'burn' | 'expired' | 'refund';
  points: number;
  reference_type: 'order' | 'repayment' | 'campaign';
  reference_id?: number;
  created_at?: Date;
}

export type point_ledgersPk = "id";
export type point_ledgersId = point_ledgers[point_ledgersPk];
export type point_ledgersOptionalAttributes = "id" | "reference_id" | "created_at";
export type point_ledgersCreationAttributes = Optional<point_ledgersAttributes, point_ledgersOptionalAttributes>;

export class point_ledgers extends Model<point_ledgersAttributes, point_ledgersCreationAttributes> implements point_ledgersAttributes {
  id!: number;
  customer_id!: number;
  transaction_type!: 'earn' | 'burn' | 'expired' | 'refund';
  points!: number;
  reference_type!: 'order' | 'repayment' | 'campaign';
  reference_id?: number;
  created_at?: Date;

  // point_ledgers belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof point_ledgers {
    return point_ledgers.init({
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
    transaction_type: {
      type: DataTypes.ENUM('earn','burn','expired','refund'),
      allowNull: false
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reference_type: {
      type: DataTypes.ENUM('order','repayment','campaign'),
      allowNull: false
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'point_ledgers',
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
