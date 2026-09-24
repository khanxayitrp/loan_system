import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_limit_applications, credit_limit_applicationsId } from './credit_limit_applications';
import type { customer_cib_profiles, customer_cib_profilesId } from './customer_cib_profiles';
import type { users, usersId } from './users';

export interface credit_assessmentsAttributes {
  id: number;
  credit_limit_app_id: number;
  assessment_type: 'INITIAL_CREDIT_LIMIT' | 'CREDIT_LIMIT_INCREASE' | 'CREDIT_LIMIT_DECREASE' | 'PERIODIC_REVIEW';
  cib_profile_id?: number;
  assessed_income?: number;
  recommended_limit?: number;
  approved_limit?: number;
  assessed_by?: number;
  approved_by?: number;
  created_at?: Date;
}

export type credit_assessmentsPk = "id";
export type credit_assessmentsId = credit_assessments[credit_assessmentsPk];
export type credit_assessmentsOptionalAttributes = "id" | "cib_profile_id" | "assessed_income" | "recommended_limit" | "approved_limit" | "assessed_by" | "approved_by" | "created_at";
export type credit_assessmentsCreationAttributes = Optional<credit_assessmentsAttributes, credit_assessmentsOptionalAttributes>;

export class credit_assessments extends Model<credit_assessmentsAttributes, credit_assessmentsCreationAttributes> implements credit_assessmentsAttributes {
  id!: number;
  credit_limit_app_id!: number;
  assessment_type!: 'INITIAL_CREDIT_LIMIT' | 'CREDIT_LIMIT_INCREASE' | 'CREDIT_LIMIT_DECREASE' | 'PERIODIC_REVIEW';
  cib_profile_id?: number;
  assessed_income?: number;
  recommended_limit?: number;
  approved_limit?: number;
  assessed_by?: number;
  approved_by?: number;
  created_at?: Date;

  // credit_assessments belongsTo credit_limit_applications via credit_limit_app_id
  credit_limit_app!: credit_limit_applications;
  getCredit_limit_app!: Sequelize.BelongsToGetAssociationMixin<credit_limit_applications>;
  setCredit_limit_app!: Sequelize.BelongsToSetAssociationMixin<credit_limit_applications, credit_limit_applicationsId>;
  createCredit_limit_app!: Sequelize.BelongsToCreateAssociationMixin<credit_limit_applications>;
  // credit_assessments belongsTo customer_cib_profiles via cib_profile_id
  cib_profile!: customer_cib_profiles;
  getCib_profile!: Sequelize.BelongsToGetAssociationMixin<customer_cib_profiles>;
  setCib_profile!: Sequelize.BelongsToSetAssociationMixin<customer_cib_profiles, customer_cib_profilesId>;
  createCib_profile!: Sequelize.BelongsToCreateAssociationMixin<customer_cib_profiles>;
  // credit_assessments belongsTo users via approved_by
  approved_by_user!: users;
  getApproved_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setApproved_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createApproved_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // credit_assessments belongsTo users via assessed_by
  assessed_by_user!: users;
  getAssessed_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setAssessed_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createAssessed_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_assessments {
    return credit_assessments.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    credit_limit_app_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'credit_limit_applications',
        key: 'id'
      }
    },
    assessment_type: {
      type: DataTypes.ENUM('INITIAL_CREDIT_LIMIT','CREDIT_LIMIT_INCREASE','CREDIT_LIMIT_DECREASE','PERIODIC_REVIEW'),
      allowNull: false
    },
    cib_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "อ้างอิง CIB ที่ใช้ในการประเมินครั้งนี้",
      references: {
        model: 'customer_cib_profiles',
        key: 'id'
      }
    },
    assessed_income: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    recommended_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    approved_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    assessed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'credit_assessments',
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
        name: "fk_ca_app",
        using: "BTREE",
        fields: [
          { name: "credit_limit_app_id" },
        ]
      },
      {
        name: "fk_ca_cib",
        using: "BTREE",
        fields: [
          { name: "cib_profile_id" },
        ]
      },
      {
        name: "fk_ca_assessor",
        using: "BTREE",
        fields: [
          { name: "assessed_by" },
        ]
      },
      {
        name: "fk_ca_approver",
        using: "BTREE",
        fields: [
          { name: "approved_by" },
        ]
      },
    ]
  });
  }
}
