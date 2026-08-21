import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface loan_approval_logsAttributes {
  id: number;
  application_id: number;
  reply_to_id?: number | null; // <--- ເພີ່ມ | null ເຂົ້າໄປ
  action: 'submitted' | 'verified_basic' | 'verified_call' | 'verified_cib' | 'verified_field' | 'assessed_income' | 'verified_delivery_receipt' | 'verified' | 'approved' | 'rejected' | 'returned_for_edit' | 'cancelled' | 'printed_approval_summary' | 'commented';
  status_from?: string;
  status_to?: string;
  remarks?: string;
  performed_by: number;
  performed_at?: Date;
}

export type loan_approval_logsPk = "id";
export type loan_approval_logsId = loan_approval_logs[loan_approval_logsPk];
export type loan_approval_logsOptionalAttributes = "id" | "status_from" | "status_to" | "remarks" | "performed_at";
export type loan_approval_logsCreationAttributes = Optional<loan_approval_logsAttributes, loan_approval_logsOptionalAttributes>;

export class loan_approval_logs extends Model<loan_approval_logsAttributes, loan_approval_logsCreationAttributes> implements loan_approval_logsAttributes {
  id!: number;
  application_id!: number;
  reply_to_id?: number;
  action!: 'submitted' | 'verified_basic' | 'verified_call' | 'verified_cib' | 'verified_field' | 'assessed_income' | 'verified_delivery_receipt' | 'verified' | 'approved' | 'rejected' | 'returned_for_edit' | 'cancelled' | 'printed_approval_summary' | 'commented';
  status_from?: string;
  status_to?: string;
  remarks?: string;
  performed_by!: number;
  performed_at?: Date;

  // loan_approval_logs belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_approval_logs belongsTo users via performed_by
  performed_by_user!: users;
  getPerformed_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setPerformed_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  
  // 🌟 เพิ่ม Code ชุดนี้เข้าไป เพื่อให้ TypeScript รู้จักความสัมพันธ์ของการตอบกลับ 🌟
  // loan_approval_logs belongsTo loan_approval_logs via reply_to_id
  reply_to_log!: loan_approval_logs;
  getReply_to_log!: Sequelize.BelongsToGetAssociationMixin<loan_approval_logs>;
  setReply_to_log!: Sequelize.BelongsToSetAssociationMixin<loan_approval_logs, loan_approval_logsId>;
  createReply_to_log!: Sequelize.BelongsToCreateAssociationMixin<loan_approval_logs>;

  // loan_approval_logs hasMany loan_approval_logs via reply_to_id
  replies!: loan_approval_logs[];
  getReplies!: Sequelize.HasManyGetAssociationsMixin<loan_approval_logs>;
  setReplies!: Sequelize.HasManySetAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  addReply!: Sequelize.HasManyAddAssociationMixin<loan_approval_logs, loan_approval_logsId>;
  addReplies!: Sequelize.HasManyAddAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  createReply!: Sequelize.HasManyCreateAssociationMixin<loan_approval_logs>;
  removeReply!: Sequelize.HasManyRemoveAssociationMixin<loan_approval_logs, loan_approval_logsId>;
  removeReplies!: Sequelize.HasManyRemoveAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  hasReply!: Sequelize.HasManyHasAssociationMixin<loan_approval_logs, loan_approval_logsId>;
  hasReplies!: Sequelize.HasManyHasAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  countReplies!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_approval_logs {
    return loan_approval_logs.init({
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
    reply_to_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'loan_approval_logs',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('submitted','verified_basic','verified_call','verified_cib','verified_field','assessed_income','verified_delivery_receipt','verified','approved','rejected','returned_for_edit','cancelled','printed_approval_summary','commented'),
      allowNull: false
    },
    status_from: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status_to: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    performed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'loan_approval_logs',
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
        name: "application_id",
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "performed_by",
        using: "BTREE",
        fields: [
          { name: "performed_by" },
        ]
      },
    ]
  });
  }
}
