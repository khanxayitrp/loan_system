import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { membership_applications, membership_applicationsId } from './membership_applications';
import type { membership_approval_documents, membership_approval_documentsId } from './membership_approval_documents';
import type { membership_assessments, membership_assessmentsId } from './membership_assessments';
import type { membership_tiers, membership_tiersId } from './membership_tiers';
import type { users, usersId } from './users';

export interface membership_decisionsAttributes {
  id: number;
  membership_application_id: number;
  assessment_id?: number;
  decision_level: 'CREDIT_MANAGER' | 'FINAL_APPROVER';
  decision: 'APPROVE' | 'APPROVE_WITH_LIMIT' | 'RETURN' | 'REJECT' | 'CANCEL';
  approved_tier_id?: number;
  approved_limit?: number;
  reason?: string;
  requested_by?: number;
  decided_by: number;
  decided_at: Date;
}

export type membership_decisionsPk = "id";
export type membership_decisionsId = membership_decisions[membership_decisionsPk];
export type membership_decisionsOptionalAttributes = "id" | "assessment_id" | "approved_tier_id" | "approved_limit" | "reason" | "requested_by" | "decided_at";
export type membership_decisionsCreationAttributes = Optional<membership_decisionsAttributes, membership_decisionsOptionalAttributes>;

export class membership_decisions extends Model<membership_decisionsAttributes, membership_decisionsCreationAttributes> implements membership_decisionsAttributes {
  id!: number;
  membership_application_id!: number;
  assessment_id?: number;
  decision_level!: 'CREDIT_MANAGER' | 'FINAL_APPROVER';
  decision!: 'APPROVE' | 'APPROVE_WITH_LIMIT' | 'RETURN' | 'REJECT' | 'CANCEL';
  approved_tier_id?: number;
  approved_limit?: number;
  reason?: string;
  requested_by?: number;
  decided_by!: number;
  decided_at!: Date;

  // membership_decisions belongsTo membership_applications via membership_application_id
  membership_application!: membership_applications;
  getMembership_application!: Sequelize.BelongsToGetAssociationMixin<membership_applications>;
  setMembership_application!: Sequelize.BelongsToSetAssociationMixin<membership_applications, membership_applicationsId>;
  createMembership_application!: Sequelize.BelongsToCreateAssociationMixin<membership_applications>;
  // membership_decisions belongsTo membership_assessments via assessment_id
  assessment!: membership_assessments;
  getAssessment!: Sequelize.BelongsToGetAssociationMixin<membership_assessments>;
  setAssessment!: Sequelize.BelongsToSetAssociationMixin<membership_assessments, membership_assessmentsId>;
  createAssessment!: Sequelize.BelongsToCreateAssociationMixin<membership_assessments>;
  // membership_decisions hasMany membership_approval_documents via decision_id
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
  // membership_decisions belongsTo membership_tiers via approved_tier_id
  approved_tier!: membership_tiers;
  getApproved_tier!: Sequelize.BelongsToGetAssociationMixin<membership_tiers>;
  setApproved_tier!: Sequelize.BelongsToSetAssociationMixin<membership_tiers, membership_tiersId>;
  createApproved_tier!: Sequelize.BelongsToCreateAssociationMixin<membership_tiers>;
  // membership_decisions belongsTo users via decided_by
  decided_by_user!: users;
  getDecided_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setDecided_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createDecided_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // membership_decisions belongsTo users via requested_by
  requested_by_user!: users;
  getRequested_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setRequested_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createRequested_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_decisions {
    return membership_decisions.init({
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
    assessment_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'membership_assessments',
        key: 'id'
      }
    },
    decision_level: {
      type: DataTypes.ENUM('CREDIT_MANAGER','FINAL_APPROVER'),
      allowNull: false
    },
    decision: {
      type: DataTypes.ENUM('APPROVE','APPROVE_WITH_LIMIT','RETURN','REJECT','CANCEL'),
      allowNull: false
    },
    approved_tier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'membership_tiers',
        key: 'id'
      }
    },
    approved_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    decided_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    decided_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'membership_decisions',
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
        name: "idx_md_app_level",
        using: "BTREE",
        fields: [
          { name: "membership_application_id" },
          { name: "decision_level" },
          { name: "decided_at" },
        ]
      },
      {
        name: "idx_md_assessment",
        using: "BTREE",
        fields: [
          { name: "assessment_id" },
        ]
      },
      {
        name: "idx_md_tier",
        using: "BTREE",
        fields: [
          { name: "approved_tier_id" },
        ]
      },
      {
        name: "fk_md_requested_by",
        using: "BTREE",
        fields: [
          { name: "requested_by" },
        ]
      },
      {
        name: "fk_md_decided_by",
        using: "BTREE",
        fields: [
          { name: "decided_by" },
        ]
      },
    ]
  });
  }
}
