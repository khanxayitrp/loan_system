import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface loan_income_assessmentsAttributes {
  id: number;
  application_id: number;
  assessed_date?: Date;
  average_monthly_income: number;
  other_verified_income?: number;
  total_verified_income: number;
  estimated_living_expenses?: number;
  existing_debt_payments?: number;
  proposed_installment: number;
  dsr_percentage: number;
  max_approved_amount?: number;
  remarks?: string;
  assessed_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export type loan_income_assessmentsPk = "id";
export type loan_income_assessmentsId = loan_income_assessments[loan_income_assessmentsPk];
export type loan_income_assessmentsOptionalAttributes = "id" | "assessed_date" | "other_verified_income" | "estimated_living_expenses" | "existing_debt_payments" | "max_approved_amount" | "remarks" | "created_at" | "updated_at";
export type loan_income_assessmentsCreationAttributes = Optional<loan_income_assessmentsAttributes, loan_income_assessmentsOptionalAttributes>;

export class loan_income_assessments extends Model<loan_income_assessmentsAttributes, loan_income_assessmentsCreationAttributes> implements loan_income_assessmentsAttributes {
  id!: number;
  application_id!: number;
  assessed_date?: Date;
  average_monthly_income!: number;
  other_verified_income?: number;
  total_verified_income!: number;
  estimated_living_expenses?: number;
  existing_debt_payments?: number;
  proposed_installment!: number;
  dsr_percentage!: number;
  max_approved_amount?: number;
  remarks?: string;
  assessed_by!: number;
  created_at?: Date;
  updated_at?: Date;

  // loan_income_assessments belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_income_assessments belongsTo users via assessed_by
  assessed_by_user!: users;
  getAssessed_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setAssessed_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createAssessed_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_income_assessments {
    return loan_income_assessments.init({
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
      unique: "loan_income_assessments_ibfk_1"
    },
    assessed_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    average_monthly_income: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    other_verified_income: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    total_verified_income: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    estimated_living_expenses: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    existing_debt_payments: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    proposed_installment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    dsr_percentage: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    },
    max_approved_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    assessed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'loan_income_assessments',
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
        name: "application_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "assessed_by",
        using: "BTREE",
        fields: [
          { name: "assessed_by" },
        ]
      },
    ]
  });
  }
}
