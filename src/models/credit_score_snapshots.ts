import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface credit_score_snapshotsAttributes {
  id: number;
  customer_id: number;
  credit_account_id?: number;
  score: number;
  score_type: string;
  model_version: string;
  payment_score?: number;
  utilization_score?: number;
  reason?: string;
  calculated_at?: Date;
}

export type credit_score_snapshotsPk = "id";
export type credit_score_snapshotsId = credit_score_snapshots[credit_score_snapshotsPk];
export type credit_score_snapshotsOptionalAttributes = "id" | "credit_account_id" | "payment_score" | "utilization_score" | "reason" | "calculated_at";
export type credit_score_snapshotsCreationAttributes = Optional<credit_score_snapshotsAttributes, credit_score_snapshotsOptionalAttributes>;

export class credit_score_snapshots extends Model<credit_score_snapshotsAttributes, credit_score_snapshotsCreationAttributes> implements credit_score_snapshotsAttributes {
  id!: number;
  customer_id!: number;
  credit_account_id?: number;
  score!: number;
  score_type!: string;
  model_version!: string;
  payment_score?: number;
  utilization_score?: number;
  reason?: string;
  calculated_at?: Date;

  // credit_score_snapshots belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_score_snapshots {
    return credit_score_snapshots.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
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
    credit_account_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    score_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    model_version: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    payment_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    utilization_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    calculated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'credit_score_snapshots',
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
        name: "idx_css_cust_time",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "calculated_at" },
        ]
      },
    ]
  });
  }
}
