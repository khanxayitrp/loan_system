import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface loan_approval_logsAttributes {
  id: number;
  application_id: number;
  action: 'submitted' | 'verified_basic' | 'verified_call' | 'verified_cib' | 'verified_field' | 'assessed_income' | 'approved' | 'rejected' | 'returned_for_edit' | 'cancelled';
  status_from?: string;
  status_to?: string;
  remarks?: string;
  performed_by: number;
  performed_at?: Date;
}

export type loan_approval_logsPk = "id";
export type loan_approval_logsId = loan_approval_logs[loan_approval_logsPk];
export type loan_approval_logsOptionalAttributes = "id" | "status_from" | "status_to" | "remarks" | "performed_at";
export type loan_approval_logsCreationAttributes = Optional<loan_approval_logsAttributes, loan_approval_logsOptionalAttributes>;

export class loan_approval_logs extends Model<loan_approval_logsAttributes, loan_approval_logsCreationAttributes> implements loan_approval_logsAttributes {
  id!: number;
  application_id!: number;
  action!: 'submitted' | 'verified_basic' | 'verified_call' | 'verified_cib' | 'verified_field' | 'assessed_income' | 'approved' | 'rejected' | 'returned_for_edit' | 'cancelled';
  status_from?: string;
  status_to?: string;
  remarks?: string;
  performed_by!: number;
  performed_at?: Date;

  // loan_approval_logs belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_approval_logs belongsTo users via performed_by
  performed_by_user!: users;
  getPerformed_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setPerformed_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createPerformed_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_approval_logs {
    return loan_approval_logs.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loan_applications',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('submitted','verified_basic','verified_call','verified_cib','verified_field','assessed_income','approved','rejected','returned_for_edit', 'cancelled'),
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
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'loan_approval_logs',
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
        name: "application_id",
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "performed_by",
        using: "BTREE",
        fields: [
          { name: "performed_by" },
        ]
      },
    ]
  });
  }
}
