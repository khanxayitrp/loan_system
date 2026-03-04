import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface loan_basic_verificationsAttributes {
  id: number;
  application_id: number;
  cus_contact_method?: 'face_to_face' | 'phone';
  verified_first_name?: string;
  verified_last_name?: string;
  verified_dob?: string;
  verified_address?: string;
  verified_product_type?: string;
  verified_price?: number;
  verified_down_payment?: number;
  verified_monthly_pay?: number;
  has_id_card?: number;
  has_census_book?: number;
  has_income_doc?: number;
  has_other_doc?: number;
  other_doc_detail?: string;
  cus_credibility_assessment?: 'reliable' | 'unreliable';
  work_company_name?: string;
  work_position?: string;
  work_salary?: number;
  work_years?: number;
  workplace_assessment?: 'good' | 'moderate' | 'bad';
  status?: 'draft' | 'completed';
  verified_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export type loan_basic_verificationsPk = "id";
export type loan_basic_verificationsId = loan_basic_verifications[loan_basic_verificationsPk];
export type loan_basic_verificationsOptionalAttributes = "id" | "cus_contact_method" | "verified_first_name" | "verified_last_name" | "verified_dob" | "verified_address" | "verified_product_type" | "verified_price" | "verified_down_payment" | "verified_monthly_pay" | "has_id_card" | "has_census_book" | "has_income_doc" | "has_other_doc" | "other_doc_detail" | "cus_credibility_assessment" | "work_company_name" | "work_position" | "work_salary" | "work_years" | "workplace_assessment" | "status" | "created_at" | "updated_at";
export type loan_basic_verificationsCreationAttributes = Optional<loan_basic_verificationsAttributes, loan_basic_verificationsOptionalAttributes>;

export class loan_basic_verifications extends Model<loan_basic_verificationsAttributes, loan_basic_verificationsCreationAttributes> implements loan_basic_verificationsAttributes {
  id!: number;
  application_id!: number;
  cus_contact_method?: 'face_to_face' | 'phone';
  verified_first_name?: string;
  verified_last_name?: string;
  verified_dob?: string;
  verified_address?: string;
  verified_product_type?: string;
  verified_price?: number;
  verified_down_payment?: number;
  verified_monthly_pay?: number;
  has_id_card?: number;
  has_census_book?: number;
  has_income_doc?: number;
  has_other_doc?: number;
  other_doc_detail?: string;
  cus_credibility_assessment?: 'reliable' | 'unreliable';
  work_company_name?: string;
  work_position?: string;
  work_salary?: number;
  work_years?: number;
  workplace_assessment?: 'good' | 'moderate' | 'bad';
  status?: 'draft' | 'completed';
  verified_by!: number;
  created_at?: Date;
  updated_at?: Date;

  // loan_basic_verifications belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_basic_verifications belongsTo users via verified_by
  verified_by_user!: users;
  getVerified_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setVerified_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createVerified_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_basic_verifications {
    return loan_basic_verifications.init({
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
    cus_contact_method: {
      type: DataTypes.ENUM('face_to_face','phone'),
      allowNull: true
    },
    verified_first_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    verified_last_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    verified_dob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    verified_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verified_product_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    verified_price: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    verified_down_payment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    verified_monthly_pay: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    has_id_card: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    has_census_book: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    has_income_doc: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    has_other_doc: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    other_doc_detail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cus_credibility_assessment: {
      type: DataTypes.ENUM('reliable','unreliable'),
      allowNull: true
    },
    work_company_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    work_position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    work_salary: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    work_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    workplace_assessment: {
      type: DataTypes.ENUM('good','moderate','bad'),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft','completed'),
      allowNull: true,
      defaultValue: "draft"
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'loan_basic_verifications',
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
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "verified_by",
        using: "BTREE",
        fields: [
          { name: "verified_by" },
        ]
      },
    ]
  });
  }
}
