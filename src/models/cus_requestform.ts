import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';
import type { loan_applications, loan_applicationsId } from './loan_applications';

export interface cus_requestformAttributes {
  id: number;
  application_id: number;
  customer_id: number;
  is_confirmed?: number;
}

export type cus_requestformPk = "id";
export type cus_requestformId = cus_requestform[cus_requestformPk];
export type cus_requestformOptionalAttributes = "id" | "is_confirmed";
export type cus_requestformCreationAttributes = Optional<cus_requestformAttributes, cus_requestformOptionalAttributes>;

export class cus_requestform extends Model<cus_requestformAttributes, cus_requestformCreationAttributes> implements cus_requestformAttributes {
  id!: number;
  application_id!: number;
  customer_id!: number;
  is_confirmed?: number;

  // cus_requestform belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // cus_requestform belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;

  static initModel(sequelize: Sequelize.Sequelize): typeof cus_requestform {
    return cus_requestform.init({
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
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    is_confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'cus_requestform',
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
