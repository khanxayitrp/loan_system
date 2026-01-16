import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface customersAttributes {
  id: number;
  identity_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  occupation?: string;
  income_per_month?: number;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type customersPk = "id";
export type customersId = customers[customersPk];
export type customersOptionalAttributes = "id" | "address" | "occupation" | "income_per_month" | "user_id" | "created_at" | "updated_at";
export type customersCreationAttributes = Optional<customersAttributes, customersOptionalAttributes>;

export class customers extends Model<customersAttributes, customersCreationAttributes> implements customersAttributes {
  id!: number;
  identity_number!: string;
  first_name!: string;
  last_name!: string;
  phone!: string;
  address?: string;
  occupation?: string;
  income_per_month?: number;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;

  // customers hasMany loan_applications via customer_id
  loan_applications!: loan_applications[];
  getLoan_applications!: Sequelize.HasManyGetAssociationsMixin<loan_applications>;
  setLoan_applications!: Sequelize.HasManySetAssociationsMixin<loan_applications, loan_applicationsId>;
  addLoan_application!: Sequelize.HasManyAddAssociationMixin<loan_applications, loan_applicationsId>;
  addLoan_applications!: Sequelize.HasManyAddAssociationsMixin<loan_applications, loan_applicationsId>;
  createLoan_application!: Sequelize.HasManyCreateAssociationMixin<loan_applications>;
  removeLoan_application!: Sequelize.HasManyRemoveAssociationMixin<loan_applications, loan_applicationsId>;
  removeLoan_applications!: Sequelize.HasManyRemoveAssociationsMixin<loan_applications, loan_applicationsId>;
  hasLoan_application!: Sequelize.HasManyHasAssociationMixin<loan_applications, loan_applicationsId>;
  hasLoan_applications!: Sequelize.HasManyHasAssociationsMixin<loan_applications, loan_applicationsId>;
  countLoan_applications!: Sequelize.HasManyCountAssociationsMixin;
  // customers belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customers {
    return customers.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    identity_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "identity_number"
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "phone"
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    income_per_month: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'customers',
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
        name: "identity_number",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "identity_number" },
        ]
      },
      {
        name: "phone",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "phone" },
        ]
      },
      {
        name: "user_id",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
