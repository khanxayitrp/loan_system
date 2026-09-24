import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customer_cib_profiles, customer_cib_profilesId } from './customer_cib_profiles';

export interface customer_cib_debtsAttributes {
  id: number;
  cib_profile_id: number;
  institution_name: string;
  account_type?: string;
  history_status: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  approved_amount?: number;
  outstanding_balance?: number;
}

export type customer_cib_debtsPk = "id";
export type customer_cib_debtsId = customer_cib_debts[customer_cib_debtsPk];
export type customer_cib_debtsOptionalAttributes = "id" | "account_type" | "approved_amount" | "outstanding_balance";
export type customer_cib_debtsCreationAttributes = Optional<customer_cib_debtsAttributes, customer_cib_debtsOptionalAttributes>;

export class customer_cib_debts extends Model<customer_cib_debtsAttributes, customer_cib_debtsCreationAttributes> implements customer_cib_debtsAttributes {
  id!: number;
  cib_profile_id!: number;
  institution_name!: string;
  account_type?: string;
  history_status!: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  approved_amount?: number;
  outstanding_balance?: number;

  // customer_cib_debts belongsTo customer_cib_profiles via cib_profile_id
  cib_profile!: customer_cib_profiles;
  getCib_profile!: Sequelize.BelongsToGetAssociationMixin<customer_cib_profiles>;
  setCib_profile!: Sequelize.BelongsToSetAssociationMixin<customer_cib_profiles, customer_cib_profilesId>;
  createCib_profile!: Sequelize.BelongsToCreateAssociationMixin<customer_cib_profiles>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_cib_debts {
    return customer_cib_debts.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    cib_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customer_cib_profiles',
        key: 'id'
      }
    },
    institution_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    account_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    history_status: {
      type: DataTypes.ENUM('no_delay','delay_30_days','delay_60_days','delay_90_days','blacklist'),
      allowNull: false
    },
    approved_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    outstanding_balance: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    }
  }, {
    sequelize,
    tableName: 'customer_cib_debts',
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
        name: "fk_cib_debt_prof",
        using: "BTREE",
        fields: [
          { name: "cib_profile_id" },
        ]
      },
    ]
  });
  }
}
