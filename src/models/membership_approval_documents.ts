import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { membership_applications, membership_applicationsId } from './membership_applications';
import type { membership_assessments, membership_assessmentsId } from './membership_assessments';
import type { membership_decisions, membership_decisionsId } from './membership_decisions';
import type { users, usersId } from './users';

export interface membership_approval_documentsAttributes {
  id: number;
  membership_application_id: number;
  assessment_id?: number;
  decision_id?: number;
  document_no: string;
  document_version: number;
  file_url?: string;
  document_hash?: string;
  status: 'DRAFT' | 'FINAL' | 'SUPERSEDED' | 'VOID';
  generated_by: number;
  generated_at: Date;
}

export type membership_approval_documentsPk = "id";
export type membership_approval_documentsId = membership_approval_documents[membership_approval_documentsPk];
export type membership_approval_documentsOptionalAttributes = "id" | "assessment_id" | "decision_id" | "document_version" | "file_url" | "document_hash" | "status" | "generated_at";
export type membership_approval_documentsCreationAttributes = Optional<membership_approval_documentsAttributes, membership_approval_documentsOptionalAttributes>;

export class membership_approval_documents extends Model<membership_approval_documentsAttributes, membership_approval_documentsCreationAttributes> implements membership_approval_documentsAttributes {
  id!: number;
  membership_application_id!: number;
  assessment_id?: number;
  decision_id?: number;
  document_no!: string;
  document_version!: number;
  file_url?: string;
  document_hash?: string;
  status!: 'DRAFT' | 'FINAL' | 'SUPERSEDED' | 'VOID';
  generated_by!: number;
  generated_at!: Date;

  // membership_approval_documents belongsTo membership_applications via membership_application_id
  membership_application!: membership_applications;
  getMembership_application!: Sequelize.BelongsToGetAssociationMixin<membership_applications>;
  setMembership_application!: Sequelize.BelongsToSetAssociationMixin<membership_applications, membership_applicationsId>;
  createMembership_application!: Sequelize.BelongsToCreateAssociationMixin<membership_applications>;
  // membership_approval_documents belongsTo membership_assessments via assessment_id
  assessment!: membership_assessments;
  getAssessment!: Sequelize.BelongsToGetAssociationMixin<membership_assessments>;
  setAssessment!: Sequelize.BelongsToSetAssociationMixin<membership_assessments, membership_assessmentsId>;
  createAssessment!: Sequelize.BelongsToCreateAssociationMixin<membership_assessments>;
  // membership_approval_documents belongsTo membership_decisions via decision_id
  decision!: membership_decisions;
  getDecision!: Sequelize.BelongsToGetAssociationMixin<membership_decisions>;
  setDecision!: Sequelize.BelongsToSetAssociationMixin<membership_decisions, membership_decisionsId>;
  createDecision!: Sequelize.BelongsToCreateAssociationMixin<membership_decisions>;
  // membership_approval_documents belongsTo users via generated_by
  generated_by_user!: users;
  getGenerated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setGenerated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createGenerated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_approval_documents {
    return membership_approval_documents.init({
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
    decision_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'membership_decisions',
        key: 'id'
      }
    },
    document_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "uk_mad_document_no"
    },
    document_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    file_url: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    document_hash: {
      type: DataTypes.CHAR(64),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('DRAFT','FINAL','SUPERSEDED','VOID'),
      allowNull: false,
      defaultValue: "DRAFT"
    },
    generated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'membership_approval_documents',
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
        name: "uk_mad_document_no",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "document_no" },
        ]
      },
      {
        name: "idx_mad_app_status",
        using: "BTREE",
        fields: [
          { name: "membership_application_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_mad_assessment",
        using: "BTREE",
        fields: [
          { name: "assessment_id" },
        ]
      },
      {
        name: "idx_mad_decision",
        using: "BTREE",
        fields: [
          { name: "decision_id" },
        ]
      },
      {
        name: "fk_mad_generated_by",
        using: "BTREE",
        fields: [
          { name: "generated_by" },
        ]
      },
    ]
  });
  }
}
