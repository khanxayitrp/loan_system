import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_assessments, credit_assessmentsId } from './credit_assessments';
import type { customer_cib_debts, customer_cib_debtsId } from './customer_cib_debts';
import type { customers, customersId } from './customers';
import type { membership_assessments, membership_assessmentsId } from './membership_assessments';
import type { users, usersId } from './users';

export interface customer_cib_profilesAttributes {
  id: number;
  customer_id: number;
  cib_status?: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  report_file_url?: string;
  checked_by: number;
  checked_at?: Date;
  valid_until?: Date;
}

export type customer_cib_profilesPk = "id";
export type customer_cib_profilesId = customer_cib_profiles[customer_cib_profilesPk];
export type customer_cib_profilesOptionalAttributes = "id" | "cib_status" | "report_file_url" | "checked_at" | "valid_until";
export type customer_cib_profilesCreationAttributes = Optional<customer_cib_profilesAttributes, customer_cib_profilesOptionalAttributes>;

export class customer_cib_profiles extends Model<customer_cib_profilesAttributes, customer_cib_profilesCreationAttributes> implements customer_cib_profilesAttributes {
  id!: number;
  customer_id!: number;
  cib_status?: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  report_file_url?: string;
  checked_by!: number;
  checked_at?: Date;
  valid_until?: Date;

  // customer_cib_profiles hasMany credit_assessments via cib_profile_id
  credit_assessments!: credit_assessments[];
  getCredit_assessments!: Sequelize.HasManyGetAssociationsMixin<credit_assessments>;
  setCredit_assessments!: Sequelize.HasManySetAssociationsMixin<credit_assessments, credit_assessmentsId>;
  addCredit_assessment!: Sequelize.HasManyAddAssociationMixin<credit_assessments, credit_assessmentsId>;
  addCredit_assessments!: Sequelize.HasManyAddAssociationsMixin<credit_assessments, credit_assessmentsId>;
  createCredit_assessment!: Sequelize.HasManyCreateAssociationMixin<credit_assessments>;
  removeCredit_assessment!: Sequelize.HasManyRemoveAssociationMixin<credit_assessments, credit_assessmentsId>;
  removeCredit_assessments!: Sequelize.HasManyRemoveAssociationsMixin<credit_assessments, credit_assessmentsId>;
  hasCredit_assessment!: Sequelize.HasManyHasAssociationMixin<credit_assessments, credit_assessmentsId>;
  hasCredit_assessments!: Sequelize.HasManyHasAssociationsMixin<credit_assessments, credit_assessmentsId>;
  countCredit_assessments!: Sequelize.HasManyCountAssociationsMixin;
  // customer_cib_profiles hasMany customer_cib_debts via cib_profile_id
  customer_cib_debts!: customer_cib_debts[];
  getCustomer_cib_debts!: Sequelize.HasManyGetAssociationsMixin<customer_cib_debts>;
  setCustomer_cib_debts!: Sequelize.HasManySetAssociationsMixin<customer_cib_debts, customer_cib_debtsId>;
  addCustomer_cib_debt!: Sequelize.HasManyAddAssociationMixin<customer_cib_debts, customer_cib_debtsId>;
  addCustomer_cib_debts!: Sequelize.HasManyAddAssociationsMixin<customer_cib_debts, customer_cib_debtsId>;
  createCustomer_cib_debt!: Sequelize.HasManyCreateAssociationMixin<customer_cib_debts>;
  removeCustomer_cib_debt!: Sequelize.HasManyRemoveAssociationMixin<customer_cib_debts, customer_cib_debtsId>;
  removeCustomer_cib_debts!: Sequelize.HasManyRemoveAssociationsMixin<customer_cib_debts, customer_cib_debtsId>;
  hasCustomer_cib_debt!: Sequelize.HasManyHasAssociationMixin<customer_cib_debts, customer_cib_debtsId>;
  hasCustomer_cib_debts!: Sequelize.HasManyHasAssociationsMixin<customer_cib_debts, customer_cib_debtsId>;
  countCustomer_cib_debts!: Sequelize.HasManyCountAssociationsMixin;
  // customer_cib_profiles hasMany membership_assessments via cib_profile_id
  membership_assessments!: membership_assessments[];
  getMembership_assessments!: Sequelize.HasManyGetAssociationsMixin<membership_assessments>;
  setMembership_assessments!: Sequelize.HasManySetAssociationsMixin<membership_assessments, membership_assessmentsId>;
  addMembership_assessment!: Sequelize.HasManyAddAssociationMixin<membership_assessments, membership_assessmentsId>;
  addMembership_assessments!: Sequelize.HasManyAddAssociationsMixin<membership_assessments, membership_assessmentsId>;
  createMembership_assessment!: Sequelize.HasManyCreateAssociationMixin<membership_assessments>;
  removeMembership_assessment!: Sequelize.HasManyRemoveAssociationMixin<membership_assessments, membership_assessmentsId>;
  removeMembership_assessments!: Sequelize.HasManyRemoveAssociationsMixin<membership_assessments, membership_assessmentsId>;
  hasMembership_assessment!: Sequelize.HasManyHasAssociationMixin<membership_assessments, membership_assessmentsId>;
  hasMembership_assessments!: Sequelize.HasManyHasAssociationsMixin<membership_assessments, membership_assessmentsId>;
  countMembership_assessments!: Sequelize.HasManyCountAssociationsMixin;
  // customer_cib_profiles belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // customer_cib_profiles belongsTo users via checked_by
  checked_by_user!: users;
  getChecked_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setChecked_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createChecked_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_cib_profiles {
    return customer_cib_profiles.init({
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
    cib_status: {
      type: DataTypes.ENUM('no_delay','delay_30_days','delay_60_days','delay_90_days','blacklist'),
      allowNull: true,
      defaultValue: "no_delay"
    },
    report_file_url: {
      type: DataTypes.STRING(255),
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
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "วันหมดอายุของรายงาน"
    }
  }, {
    sequelize,
    tableName: 'customer_cib_profiles',
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
        name: "idx_customer_cib_valid",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "valid_until" },
        ]
      },
      {
        name: "fk_cib_prof_user",
        using: "BTREE",
        fields: [
          { name: "checked_by" },
        ]
      },
    ]
  });
  }
}
