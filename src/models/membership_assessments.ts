import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customer_cib_profiles, customer_cib_profilesId } from './customer_cib_profiles';
import type { membership_application_versions, membership_application_versionsId } from './membership_application_versions';
import type { membership_applications, membership_applicationsId } from './membership_applications';
import type { membership_approval_documents, membership_approval_documentsId } from './membership_approval_documents';
import type { membership_decisions, membership_decisionsId } from './membership_decisions';
import type { membership_tiers, membership_tiersId } from './membership_tiers';
import type { users, usersId } from './users';

export interface membership_assessmentsAttributes {
  id: number;
  membership_application_id: number;
  application_version_id: number;
  assessment_version: string;
  score: number;
  risk_grade?: string;
  recommended_tier_id?: number;
  recommended_limit: number;
  assessed_income?: number;
  other_debt?: number;
  existing_monthly_debt_payment?: number;
  proposed_monthly_payment?: number;
  dsr_percentage?: number;
  income_score?: number;
  debt_score?: number;
  cib_score?: number;
  stability_score?: number;
  behavior_score?: number;
  fraud_score?: number;
  manual_adjustment: number;
  cib_profile_id?: number;
  rule_version?: string;
  model_version?: string;
  rationale?: string;
  assessed_by: number;
  assessed_at: Date;
}

export type membership_assessmentsPk = "id";
export type membership_assessmentsId = membership_assessments[membership_assessmentsPk];
export type membership_assessmentsOptionalAttributes = "id" | "score" | "risk_grade" | "recommended_tier_id" | "recommended_limit" | "assessed_income" | "other_debt" | "existing_monthly_debt_payment" | "proposed_monthly_payment" | "dsr_percentage" | "income_score" | "debt_score" | "cib_score" | "stability_score" | "behavior_score" | "fraud_score" | "manual_adjustment" | "cib_profile_id" | "rule_version" | "model_version" | "rationale" | "assessed_at";
export type membership_assessmentsCreationAttributes = Optional<membership_assessmentsAttributes, membership_assessmentsOptionalAttributes>;

export class membership_assessments extends Model<membership_assessmentsAttributes, membership_assessmentsCreationAttributes> implements membership_assessmentsAttributes {
  id!: number;
  membership_application_id!: number;
  application_version_id!: number;
  assessment_version!: string;
  score!: number;
  risk_grade?: string;
  recommended_tier_id?: number;
  recommended_limit!: number;
  assessed_income?: number;
  other_debt?: number;
  existing_monthly_debt_payment?: number;
  proposed_monthly_payment?: number;
  dsr_percentage?: number;
  income_score?: number;
  debt_score?: number;
  cib_score?: number;
  stability_score?: number;
  behavior_score?: number;
  fraud_score?: number;
  manual_adjustment!: number;
  cib_profile_id?: number;
  rule_version?: string;
  model_version?: string;
  rationale?: string;
  assessed_by!: number;
  assessed_at!: Date;

  // membership_assessments belongsTo customer_cib_profiles via cib_profile_id
  cib_profile!: customer_cib_profiles;
  getCib_profile!: Sequelize.BelongsToGetAssociationMixin<customer_cib_profiles>;
  setCib_profile!: Sequelize.BelongsToSetAssociationMixin<customer_cib_profiles, customer_cib_profilesId>;
  createCib_profile!: Sequelize.BelongsToCreateAssociationMixin<customer_cib_profiles>;
  // membership_assessments belongsTo membership_application_versions via application_version_id
  application_version!: membership_application_versions;
  getApplication_version!: Sequelize.BelongsToGetAssociationMixin<membership_application_versions>;
  setApplication_version!: Sequelize.BelongsToSetAssociationMixin<membership_application_versions, membership_application_versionsId>;
  createApplication_version!: Sequelize.BelongsToCreateAssociationMixin<membership_application_versions>;
  // membership_assessments belongsTo membership_applications via membership_application_id
  membership_application!: membership_applications;
  getMembership_application!: Sequelize.BelongsToGetAssociationMixin<membership_applications>;
  setMembership_application!: Sequelize.BelongsToSetAssociationMixin<membership_applications, membership_applicationsId>;
  createMembership_application!: Sequelize.BelongsToCreateAssociationMixin<membership_applications>;
  // membership_assessments hasMany membership_approval_documents via assessment_id
  membership_approval_documents!: membership_approval_documents[];
  getMembership_approval_documents!: Sequelize.HasManyGetAssociationsMixin<membership_approval_documents>;
  setMembership_approval_documents!: Sequelize.HasManySetAssociationsMixin<membership_approval_documents, membership_approval_documentsId>;
  addMembership_approval_document!: Sequelize.HasManyAddAssociationMixin<membership_approval_documents, membership_approval_documentsId>;
  addMembership_approval_documents!: Sequelize.HasManyAddAssociationsMixin<membership_approval_documents, membership_approval_documentsId>;
  createMembership_approval_document!: Sequelize.HasManyCreateAssociationMixin<membership_approval_documents>;
  removeMembership_approval_document!: Sequelize.HasManyRemoveAssociationMixin<membership_approval_documents, membership_approval_documentsId>;
  removeMembership_approval_documents!: Sequelize.HasManyRemoveAssociationsMixin<membership_approval_documents, membership_approval_documentsId>;
  hasMembership_approval_document!: Sequelize.HasManyHasAssociationMixin<membership_approval_documents, membership_approval_documentsId>;
  hasMembership_approval_documents!: Sequelize.HasManyHasAssociationsMixin<membership_approval_documents, membership_approval_documentsId>;
  countMembership_approval_documents!: Sequelize.HasManyCountAssociationsMixin;
  // membership_assessments hasMany membership_decisions via assessment_id
  membership_decisions!: membership_decisions[];
  getMembership_decisions!: Sequelize.HasManyGetAssociationsMixin<membership_decisions>;
  setMembership_decisions!: Sequelize.HasManySetAssociationsMixin<membership_decisions, membership_decisionsId>;
  addMembership_decision!: Sequelize.HasManyAddAssociationMixin<membership_decisions, membership_decisionsId>;
  addMembership_decisions!: Sequelize.HasManyAddAssociationsMixin<membership_decisions, membership_decisionsId>;
  createMembership_decision!: Sequelize.HasManyCreateAssociationMixin<membership_decisions>;
  removeMembership_decision!: Sequelize.HasManyRemoveAssociationMixin<membership_decisions, membership_decisionsId>;
  removeMembership_decisions!: Sequelize.HasManyRemoveAssociationsMixin<membership_decisions, membership_decisionsId>;
  hasMembership_decision!: Sequelize.HasManyHasAssociationMixin<membership_decisions, membership_decisionsId>;
  hasMembership_decisions!: Sequelize.HasManyHasAssociationsMixin<membership_decisions, membership_decisionsId>;
  countMembership_decisions!: Sequelize.HasManyCountAssociationsMixin;
  // membership_assessments belongsTo membership_tiers via recommended_tier_id
  recommended_tier!: membership_tiers;
  getRecommended_tier!: Sequelize.BelongsToGetAssociationMixin<membership_tiers>;
  setRecommended_tier!: Sequelize.BelongsToSetAssociationMixin<membership_tiers, membership_tiersId>;
  createRecommended_tier!: Sequelize.BelongsToCreateAssociationMixin<membership_tiers>;
  // membership_assessments belongsTo users via assessed_by
  assessed_by_user!: users;
  getAssessed_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setAssessed_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createAssessed_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_assessments {
    return membership_assessments.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    membership_application_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'membership_applications',
        key: 'id'
      }
    },
    application_version_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'membership_application_versions',
        key: 'id'
      }
    },
    assessment_version: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    risk_grade: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    recommended_tier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'membership_tiers',
        key: 'id'
      }
    },
    recommended_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    assessed_income: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    other_debt: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    existing_monthly_debt_payment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    proposed_monthly_payment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    dsr_percentage: {
      type: DataTypes.DECIMAL(7,4),
      allowNull: true
    },
    income_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    debt_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cib_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    stability_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    behavior_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fraud_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    manual_adjustment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    cib_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customer_cib_profiles',
        key: 'id'
      }
    },
    rule_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    model_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    rationale: {
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
    },
    assessed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'membership_assessments',
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
        name: "idx_mas_application",
        using: "BTREE",
        fields: [
          { name: "membership_application_id" },
          { name: "assessed_at" },
        ]
      },
      {
        name: "idx_mas_version",
        using: "BTREE",
        fields: [
          { name: "application_version_id" },
        ]
      },
      {
        name: "idx_mas_cib",
        using: "BTREE",
        fields: [
          { name: "cib_profile_id" },
        ]
      },
      {
        name: "idx_mas_tier",
        using: "BTREE",
        fields: [
          { name: "recommended_tier_id" },
        ]
      },
      {
        name: "fk_mas_assessed_by",
        using: "BTREE",
        fields: [
          { name: "assessed_by" },
        ]
      },
    ]
  });
  }
}
