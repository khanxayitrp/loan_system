import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_accounts, credit_accountsId } from './credit_accounts';
import type { customers, customersId } from './customers';
import type { users, usersId } from './users';

export interface credit_risk_alertsAttributes {
  id: number;
  customer_id: number;
  credit_account_id?: number;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score_before?: number;
  score_after?: number;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'RESOLVED' | 'DISMISSED';
  description: string;
  reference_type?: string;
  reference_id?: number;
  assigned_to?: number;
  resolved_by?: number;
  resolved_at?: Date;
  resolution_note?: string;
  created_at: Date;
  updated_at: Date;
}

export type credit_risk_alertsPk = "id";
export type credit_risk_alertsId = credit_risk_alerts[credit_risk_alertsPk];
export type credit_risk_alertsOptionalAttributes = "id" | "credit_account_id" | "severity" | "score_before" | "score_after" | "status" | "reference_type" | "reference_id" | "assigned_to" | "resolved_by" | "resolved_at" | "resolution_note" | "created_at" | "updated_at";
export type credit_risk_alertsCreationAttributes = Optional<credit_risk_alertsAttributes, credit_risk_alertsOptionalAttributes>;

export class credit_risk_alerts extends Model<credit_risk_alertsAttributes, credit_risk_alertsCreationAttributes> implements credit_risk_alertsAttributes {
  id!: number;
  customer_id!: number;
  credit_account_id?: number;
  alert_type!: string;
  severity!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score_before?: number;
  score_after?: number;
  status!: 'OPEN' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'RESOLVED' | 'DISMISSED';
  description!: string;
  reference_type?: string;
  reference_id?: number;
  assigned_to?: number;
  resolved_by?: number;
  resolved_at?: Date;
  resolution_note?: string;
  created_at!: Date;
  updated_at!: Date;

  // credit_risk_alerts belongsTo credit_accounts via credit_account_id
  credit_account!: credit_accounts;
  getCredit_account!: Sequelize.BelongsToGetAssociationMixin<credit_accounts>;
  setCredit_account!: Sequelize.BelongsToSetAssociationMixin<credit_accounts, credit_accountsId>;
  createCredit_account!: Sequelize.BelongsToCreateAssociationMixin<credit_accounts>;
  // credit_risk_alerts belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // credit_risk_alerts belongsTo users via assigned_to
  assigned_to_user!: users;
  getAssigned_to_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setAssigned_to_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createAssigned_to_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // credit_risk_alerts belongsTo users via resolved_by
  resolved_by_user!: users;
  getResolved_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setResolved_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createResolved_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_risk_alerts {
    return credit_risk_alerts.init({
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
      allowNull: true,
      references: {
        model: 'credit_accounts',
        key: 'id'
      }
    },
    alert_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('LOW','MEDIUM','HIGH','CRITICAL'),
      allowNull: false,
      defaultValue: "MEDIUM"
    },
    score_before: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    score_after: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('OPEN','UNDER_REVIEW','ACTION_REQUIRED','RESOLVED','DISMISSED'),
      allowNull: false,
      defaultValue: "OPEN"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resolved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolution_note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 🌟 ເພີ່ມ 2 ຟິວນີ້ເຂົ້າໄປກ່ອນປິດວົງເລັບ
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'credit_risk_alerts',
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
        name: "idx_cra_customer_status",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_cra_account_status",
        using: "BTREE",
        fields: [
          { name: "credit_account_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_cra_severity_status",
        using: "BTREE",
        fields: [
          { name: "severity" },
          { name: "status" },
        ]
      },
      {
        name: "idx_cra_reference",
        using: "BTREE",
        fields: [
          { name: "reference_type" },
          { name: "reference_id" },
        ]
      },
      {
        name: "fk_cra_assigned_to",
        using: "BTREE",
        fields: [
          { name: "assigned_to" },
        ]
      },
      {
        name: "fk_cra_resolved_by",
        using: "BTREE",
        fields: [
          { name: "resolved_by" },
        ]
      },
    ]
  });
  }
}
