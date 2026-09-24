import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';
import type { member_cards, member_cardsId } from './member_cards';
import type { membership_application_versions, membership_application_versionsId } from './membership_application_versions';
import type { membership_approval_documents, membership_approval_documentsId } from './membership_approval_documents';
import type { membership_assessments, membership_assessmentsId } from './membership_assessments';
import type { membership_credit_purposes, membership_credit_purposesId } from './membership_credit_purposes';
import type { membership_decisions, membership_decisionsId } from './membership_decisions';
import type { membership_workflow_logs, membership_workflow_logsId } from './membership_workflow_logs';
import type { users, usersId } from './users';

export interface membership_applicationsAttributes {
  id: number;
  application_no: string;
  customer_id: number;
  requested_credit_limit: number;
  purpose_id?: number;
  usage_goal?: string;
  requested_product_type?: string;
  remarks?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ASSESSING' | 'PENDING_MANAGER_REVIEW' | 'VERIFIED' | 'PENDING_FINAL_APPROVAL' | 'RETURNED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  version: number;
  submitted_at?: Date;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export type membership_applicationsPk = "id";
export type membership_applicationsId = membership_applications[membership_applicationsPk];
export type membership_applicationsOptionalAttributes = "id" | "requested_credit_limit" | "purpose_id" | "usage_goal" | "requested_product_type" | "remarks" | "status" | "version" | "submitted_at" | "created_by" | "updated_by" | "created_at" | "updated_at";
export type membership_applicationsCreationAttributes = Optional<membership_applicationsAttributes, membership_applicationsOptionalAttributes>;

export class membership_applications extends Model<membership_applicationsAttributes, membership_applicationsCreationAttributes> implements membership_applicationsAttributes {
  id!: number;
  application_no!: string;
  customer_id!: number;
  requested_credit_limit!: number;
  purpose_id?: number;
  usage_goal?: string;
  requested_product_type?: string;
  remarks?: string;
  status!: 'DRAFT' | 'SUBMITTED' | 'ASSESSING' | 'PENDING_MANAGER_REVIEW' | 'VERIFIED' | 'PENDING_FINAL_APPROVAL' | 'RETURNED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  version!: number;
  submitted_at?: Date;
  created_by?: number;
  updated_by?: number;
  created_at!: Date;
  updated_at!: Date;

  // membership_applications belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // membership_applications hasMany member_cards via membership_application_id
  member_cards!: member_cards[];
  getMember_cards!: Sequelize.HasManyGetAssociationsMixin<member_cards>;
  setMember_cards!: Sequelize.HasManySetAssociationsMixin<member_cards, member_cardsId>;
  addMember_card!: Sequelize.HasManyAddAssociationMixin<member_cards, member_cardsId>;
  addMember_cards!: Sequelize.HasManyAddAssociationsMixin<member_cards, member_cardsId>;
  createMember_card!: Sequelize.HasManyCreateAssociationMixin<member_cards>;
  removeMember_card!: Sequelize.HasManyRemoveAssociationMixin<member_cards, member_cardsId>;
  removeMember_cards!: Sequelize.HasManyRemoveAssociationsMixin<member_cards, member_cardsId>;
  hasMember_card!: Sequelize.HasManyHasAssociationMixin<member_cards, member_cardsId>;
  hasMember_cards!: Sequelize.HasManyHasAssociationsMixin<member_cards, member_cardsId>;
  countMember_cards!: Sequelize.HasManyCountAssociationsMixin;
  // membership_applications hasMany membership_application_versions via membership_application_id
  membership_application_versions!: membership_application_versions[];
  getMembership_application_versions!: Sequelize.HasManyGetAssociationsMixin<membership_application_versions>;
  setMembership_application_versions!: Sequelize.HasManySetAssociationsMixin<membership_application_versions, membership_application_versionsId>;
  addMembership_application_version!: Sequelize.HasManyAddAssociationMixin<membership_application_versions, membership_application_versionsId>;
  addMembership_application_versions!: Sequelize.HasManyAddAssociationsMixin<membership_application_versions, membership_application_versionsId>;
  createMembership_application_version!: Sequelize.HasManyCreateAssociationMixin<membership_application_versions>;
  removeMembership_application_version!: Sequelize.HasManyRemoveAssociationMixin<membership_application_versions, membership_application_versionsId>;
  removeMembership_application_versions!: Sequelize.HasManyRemoveAssociationsMixin<membership_application_versions, membership_application_versionsId>;
  hasMembership_application_version!: Sequelize.HasManyHasAssociationMixin<membership_application_versions, membership_application_versionsId>;
  hasMembership_application_versions!: Sequelize.HasManyHasAssociationsMixin<membership_application_versions, membership_application_versionsId>;
  countMembership_application_versions!: Sequelize.HasManyCountAssociationsMixin;
  // membership_applications hasMany membership_approval_documents via membership_application_id
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
  // membership_applications hasMany membership_assessments via membership_application_id
  membership_assessments!: membership_assessments[];
  getMembership_assessments!: Sequelize.HasManyGetAssociationsMixin<membership_assessments>;
  setMembership_assessments!: Sequelize.HasManySetAssociationsMixin<membership_assessments, membership_assessmentsId>;
  addMembership_assessment!: Sequelize.HasManyAddAssociationMixin<membership_assessments, membership_assessmentsId>;
  addMembership_assessments!: Sequelize.HasManyAddAssociationsMixin<membership_assessments, membership_assessmentsId>;
  createMembership_assessment!: Sequelize.HasManyCreateAssociationMixin<membership_assessments>;
  removeMembership_assessment!: Sequelize.HasManyRemoveAssociationMixin<membership_assessments, membership_assessmentsId>;
  removeMembership_assessments!: Sequelize.HasManyRemoveAssociationsMixin<membership_assessments, membership_assessmentsId>;
  hasMembership_assessment!: Sequelize.HasManyHasAssociationMixin<membership_assessments, membership_assessmentsId>;
  hasMembership_assessments!: Sequelize.HasManyHasAssociationsMixin<membership_assessments, membership_assessmentsId>;
  countMembership_assessments!: Sequelize.HasManyCountAssociationsMixin;
  // membership_applications hasMany membership_decisions via membership_application_id
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
  // membership_applications hasMany membership_workflow_logs via membership_application_id
  membership_workflow_logs!: membership_workflow_logs[];
  getMembership_workflow_logs!: Sequelize.HasManyGetAssociationsMixin<membership_workflow_logs>;
  setMembership_workflow_logs!: Sequelize.HasManySetAssociationsMixin<membership_workflow_logs, membership_workflow_logsId>;
  addMembership_workflow_log!: Sequelize.HasManyAddAssociationMixin<membership_workflow_logs, membership_workflow_logsId>;
  addMembership_workflow_logs!: Sequelize.HasManyAddAssociationsMixin<membership_workflow_logs, membership_workflow_logsId>;
  createMembership_workflow_log!: Sequelize.HasManyCreateAssociationMixin<membership_workflow_logs>;
  removeMembership_workflow_log!: Sequelize.HasManyRemoveAssociationMixin<membership_workflow_logs, membership_workflow_logsId>;
  removeMembership_workflow_logs!: Sequelize.HasManyRemoveAssociationsMixin<membership_workflow_logs, membership_workflow_logsId>;
  hasMembership_workflow_log!: Sequelize.HasManyHasAssociationMixin<membership_workflow_logs, membership_workflow_logsId>;
  hasMembership_workflow_logs!: Sequelize.HasManyHasAssociationsMixin<membership_workflow_logs, membership_workflow_logsId>;
  countMembership_workflow_logs!: Sequelize.HasManyCountAssociationsMixin;
  // membership_applications belongsTo membership_credit_purposes via purpose_id
  purpose!: membership_credit_purposes;
  getPurpose!: Sequelize.BelongsToGetAssociationMixin<membership_credit_purposes>;
  setPurpose!: Sequelize.BelongsToSetAssociationMixin<membership_credit_purposes, membership_credit_purposesId>;
  createPurpose!: Sequelize.BelongsToCreateAssociationMixin<membership_credit_purposes>;
  // membership_applications belongsTo users via created_by
  created_by_user!: users;
  getCreated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // membership_applications belongsTo users via updated_by
  updated_by_user!: users;
  getUpdated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUpdated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUpdated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_applications {
    return membership_applications.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    application_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uk_ma_application_no"
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    requested_credit_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    purpose_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'membership_credit_purposes',
        key: 'id'
      }
    },
    usage_goal: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requested_product_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('DRAFT','SUBMITTED','ASSESSING','PENDING_MANAGER_REVIEW','VERIFIED','PENDING_FINAL_APPROVAL','RETURNED','APPROVED','REJECTED','CANCELLED','EXPIRED'),
      allowNull: false,
      defaultValue: "DRAFT"
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // 🌟 ເພີ່ມ 2 ຟິວນີ້ເຂົ້າໄປກ່ອນປິດວົງເລັບ
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'membership_applications',
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
        name: "uk_ma_application_no",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "application_no" },
        ]
      },
      {
        name: "idx_ma_customer_status",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_ma_status_created",
        using: "BTREE",
        fields: [
          { name: "status" },
          { name: "created_at" },
        ]
      },
      {
        name: "idx_ma_purpose",
        using: "BTREE",
        fields: [
          { name: "purpose_id" },
        ]
      },
      {
        name: "fk_ma_created_by",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "fk_ma_updated_by",
        using: "BTREE",
        fields: [
          { name: "updated_by" },
        ]
      },
    ]
  });
  }
}
