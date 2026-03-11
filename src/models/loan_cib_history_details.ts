import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';

export interface loan_cib_history_detailsAttributes {
  id: number;
  application_id: number;
  institution_name: string;
  account_type?: string;
  history_status: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  outstanding_balance?: number;
}

export type loan_cib_history_detailsPk = "id";
export type loan_cib_history_detailsId = loan_cib_history_details[loan_cib_history_detailsPk];
export type loan_cib_history_detailsOptionalAttributes = "id" | "account_type" | "outstanding_balance";
export type loan_cib_history_detailsCreationAttributes = Optional<loan_cib_history_detailsAttributes, loan_cib_history_detailsOptionalAttributes>;

export class loan_cib_history_details extends Model<loan_cib_history_detailsAttributes, loan_cib_history_detailsCreationAttributes> implements loan_cib_history_detailsAttributes {
  id!: number;
  application_id!: number;
  institution_name!: string;
  account_type?: string;
  history_status!: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  outstanding_balance?: number;

  // loan_cib_history_details belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_cib_history_details {
    return loan_cib_history_details.init({
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
    outstanding_balance: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'loan_cib_history_details',
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
    ]
  });
  }
}
