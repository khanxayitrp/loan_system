import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface loan_cib_checksAttributes {
  id: number;
  application_id: number;
  cib_status?: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  is_existing_customer?: number;
  existing_customer_status?: 'normal' | 'late_payment' | 'bad_debt';
  cib_report_file?: string;
  remark?: string;
  checked_by: number;
  checked_at?: Date;
}

export type loan_cib_checksPk = "id";
export type loan_cib_checksId = loan_cib_checks[loan_cib_checksPk];
export type loan_cib_checksOptionalAttributes = "id" | "cib_status" | "is_existing_customer" | "existing_customer_status" | "cib_report_file" | "remark" | "checked_at";
export type loan_cib_checksCreationAttributes = Optional<loan_cib_checksAttributes, loan_cib_checksOptionalAttributes>;

export class loan_cib_checks extends Model<loan_cib_checksAttributes, loan_cib_checksCreationAttributes> implements loan_cib_checksAttributes {
  id!: number;
  application_id!: number;
  cib_status?: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  is_existing_customer?: number;
  existing_customer_status?: 'normal' | 'late_payment' | 'bad_debt';
  cib_report_file?: string;
  remark?: string;
  checked_by!: number;
  checked_at?: Date;

  // loan_cib_checks belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_cib_checks belongsTo users via checked_by
  checked_by_user!: users;
  getChecked_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setChecked_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createChecked_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_cib_checks {
    return loan_cib_checks.init({
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
      },
      unique: "loan_cib_checks_ibfk_1"
    },
    cib_status: {
      type: DataTypes.ENUM('no_delay','delay_30_days','delay_60_days','delay_90_days','blacklist'),
      allowNull: true,
      defaultValue: "no_delay"
    },
    is_existing_customer: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    existing_customer_status: {
      type: DataTypes.ENUM('normal','late_payment','bad_debt'),
      allowNull: true
    },
    cib_report_file: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    checked_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    checked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'loan_cib_checks',
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
        unique: true,
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "checked_by",
        using: "BTREE",
        fields: [
          { name: "checked_by" },
        ]
      },
    ]
  });
  }
}
