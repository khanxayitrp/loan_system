import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { membership_applications, membership_applicationsId } from './membership_applications';
import type { users, usersId } from './users';

export interface membership_workflow_logsAttributes {
  id: number;
  membership_application_id: number;
  action: string;
  status_from?: string;
  status_to?: string;
  remarks?: string;
  performed_by: number;
  performed_at: Date;
  ip_address?: string;
  correlation_id?: string;
}

export type membership_workflow_logsPk = "id";
export type membership_workflow_logsId = membership_workflow_logs[membership_workflow_logsPk];
export type membership_workflow_logsOptionalAttributes = "id" | "status_from" | "status_to" | "remarks" | "performed_at" | "ip_address" | "correlation_id";
export type membership_workflow_logsCreationAttributes = Optional<membership_workflow_logsAttributes, membership_workflow_logsOptionalAttributes>;

export class membership_workflow_logs extends Model<membership_workflow_logsAttributes, membership_workflow_logsCreationAttributes> implements membership_workflow_logsAttributes {
  id!: number;
  membership_application_id!: number;
  action!: string;
  status_from?: string;
  status_to?: string;
  remarks?: string;
  performed_by!: number;
  performed_at!: Date;
  ip_address?: string;
  correlation_id?: string;

  // membership_workflow_logs belongsTo membership_applications via membership_application_id
  membership_application!: membership_applications;
  getMembership_application!: Sequelize.BelongsToGetAssociationMixin<membership_applications>;
  setMembership_application!: Sequelize.BelongsToSetAssociationMixin<membership_applications, membership_applicationsId>;
  createMembership_application!: Sequelize.BelongsToCreateAssociationMixin<membership_applications>;
  // membership_workflow_logs belongsTo users via performed_by
  performed_by_user!: users;
  getPerformed_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setPerformed_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createPerformed_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_workflow_logs {
    return membership_workflow_logs.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    membership_application_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'membership_applications',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status_from: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status_to: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    performed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    correlation_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'membership_workflow_logs',
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
        name: "idx_mwl_app_time",
        using: "BTREE",
        fields: [
          { name: "membership_application_id" },
          { name: "performed_at" },
        ]
      },
      {
        name: "idx_mwl_actor_time",
        using: "BTREE",
        fields: [
          { name: "performed_by" },
          { name: "performed_at" },
        ]
      },
      {
        name: "idx_mwl_correlation",
        using: "BTREE",
        fields: [
          { name: "correlation_id" },
        ]
      },
    ]
  });
  }
}
