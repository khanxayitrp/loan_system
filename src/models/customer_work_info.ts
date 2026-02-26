import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface customer_work_infoAttributes {
  id: number;
  customer_id: number;
  company_name?: string;
  address?: string;
  phone?: string;
  business_type?: string;
  business_detail?: string;
  duration_years?: number;
  duration_months?: number;
  department?: string;
  position?: string;
  salary?: number;
  created_at?: Date;
}

export type customer_work_infoPk = "id";
export type customer_work_infoId = customer_work_info[customer_work_infoPk];
export type customer_work_infoOptionalAttributes = "id" | "company_name" | "address" | "phone" | "business_type" | "business_detail" | "duration_years" | "duration_months" | "department" | "position" | "salary" | "created_at";
export type customer_work_infoCreationAttributes = Optional<customer_work_infoAttributes, customer_work_infoOptionalAttributes>;

export class customer_work_info extends Model<customer_work_infoAttributes, customer_work_infoCreationAttributes> implements customer_work_infoAttributes {
  id!: number;
  customer_id!: number;
  company_name?: string;
  address?: string;
  phone?: string;
  business_type?: string;
  business_detail?: string;
  duration_years?: number;
  duration_months?: number;
  department?: string;
  position?: string;
  salary?: number;
  created_at?: Date;

  // customer_work_info belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_work_info {
    return customer_work_info.init({
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
      company_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      business_type: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      business_detail: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      duration_years: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      duration_months: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      position: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      salary: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'customer_work_info',
      timestamps: true,
      createdAt: 'created_at',  // Maps to your column name
      updatedAt: false,
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
