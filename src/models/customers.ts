import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customer_locations, customer_locationsId } from './customer_locations';
import type { customer_work_info, customer_work_infoId } from './customer_work_info';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface customersAttributes {
  id: number;
  identity_number: string;
  census_number?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone: string;
  address?: string;
  age?: number;
  occupation?: string;
  income_per_month?: number;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
  unit?: string;
  issue_place?: string;
  issue_date?: string;
}

export type customersPk = "id";
export type customersId = customers[customersPk];
export type customersOptionalAttributes = "id" | "census_number" | "date_of_birth" | "address" | "age" | "occupation" | "income_per_month" | "user_id" | "created_at" | "updated_at" | "unit" | "issue_place" | "issue_date";
export type customersCreationAttributes = Optional<customersAttributes, customersOptionalAttributes>;

export class customers extends Model<customersAttributes, customersCreationAttributes> implements customersAttributes {
  id!: number;
  identity_number!: string;
  census_number?: string;
  first_name!: string;
  last_name!: string;
  date_of_birth?: string;
  phone!: string;
  address?: string;
  age?: number;
  occupation?: string;
  income_per_month?: number;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
  unit?: string;
  issue_place?: string;
  issue_date?: string;

  // customers hasMany customer_locations via customer_id
  customer_locations!: customer_locations[];
  getCustomer_locations!: Sequelize.HasManyGetAssociationsMixin<customer_locations>;
  setCustomer_locations!: Sequelize.HasManySetAssociationsMixin<customer_locations, customer_locationsId>;
  addCustomer_location!: Sequelize.HasManyAddAssociationMixin<customer_locations, customer_locationsId>;
  addCustomer_locations!: Sequelize.HasManyAddAssociationsMixin<customer_locations, customer_locationsId>;
  createCustomer_location!: Sequelize.HasManyCreateAssociationMixin<customer_locations>;
  removeCustomer_location!: Sequelize.HasManyRemoveAssociationMixin<customer_locations, customer_locationsId>;
  removeCustomer_locations!: Sequelize.HasManyRemoveAssociationsMixin<customer_locations, customer_locationsId>;
  hasCustomer_location!: Sequelize.HasManyHasAssociationMixin<customer_locations, customer_locationsId>;
  hasCustomer_locations!: Sequelize.HasManyHasAssociationsMixin<customer_locations, customer_locationsId>;
  countCustomer_locations!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasMany customer_work_info via customer_id
  customer_work_infos!: customer_work_info[];
  getCustomer_work_infos!: Sequelize.HasManyGetAssociationsMixin<customer_work_info>;
  setCustomer_work_infos!: Sequelize.HasManySetAssociationsMixin<customer_work_info, customer_work_infoId>;
  addCustomer_work_info!: Sequelize.HasManyAddAssociationMixin<customer_work_info, customer_work_infoId>;
  addCustomer_work_infos!: Sequelize.HasManyAddAssociationsMixin<customer_work_info, customer_work_infoId>;
  createCustomer_work_info!: Sequelize.HasManyCreateAssociationMixin<customer_work_info>;
  removeCustomer_work_info!: Sequelize.HasManyRemoveAssociationMixin<customer_work_info, customer_work_infoId>;
  removeCustomer_work_infos!: Sequelize.HasManyRemoveAssociationsMixin<customer_work_info, customer_work_infoId>;
  hasCustomer_work_info!: Sequelize.HasManyHasAssociationMixin<customer_work_info, customer_work_infoId>;
  hasCustomer_work_infos!: Sequelize.HasManyHasAssociationsMixin<customer_work_info, customer_work_infoId>;
  countCustomer_work_infos!: Sequelize.HasManyCountAssociationsMixin;
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
    census_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
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
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    issue_place: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
