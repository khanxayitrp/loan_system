import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_assessments, credit_assessmentsId } from './credit_assessments';
import type { customers, customersId } from './customers';

export interface credit_limit_applicationsAttributes {
  id: number;
  customer_id: number;
  requested_limit?: number;
  status?: 'pending' | 'assessing' | 'approved' | 'rejected';
  remarks?: string;
  applied_at?: Date;
  updated_at?: Date;
}

export type credit_limit_applicationsPk = "id";
export type credit_limit_applicationsId = credit_limit_applications[credit_limit_applicationsPk];
export type credit_limit_applicationsOptionalAttributes = "id" | "requested_limit" | "status" | "remarks" | "applied_at" | "updated_at";
export type credit_limit_applicationsCreationAttributes = Optional<credit_limit_applicationsAttributes, credit_limit_applicationsOptionalAttributes>;

export class credit_limit_applications extends Model<credit_limit_applicationsAttributes, credit_limit_applicationsCreationAttributes> implements credit_limit_applicationsAttributes {
  id!: number;
  customer_id!: number;
  requested_limit?: number;
  status?: 'pending' | 'assessing' | 'approved' | 'rejected';
  remarks?: string;
  applied_at?: Date;
  updated_at?: Date;

  // credit_limit_applications hasMany credit_assessments via credit_limit_app_id
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
  // credit_limit_applications belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_limit_applications {
    return credit_limit_applications.init({
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
    requested_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('pending','assessing','approved','rejected'),
      allowNull: true,
      defaultValue: "pending"
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'credit_limit_applications',
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
        name: "idx_cla_customer_status",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "status" },
        ]
      },
    ]
  });
  }
}
