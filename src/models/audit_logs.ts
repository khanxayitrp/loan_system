import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { users, usersId } from './users';

export interface audit_logsAttributes {
  id: number;
  table_name: string;
  record_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: object;
  new_values?: object;
  changed_columns?: object;
  performed_by: number;
  performed_at: Date;
  ip_address?: string;
}

export type audit_logsPk = "id";
export type audit_logsId = audit_logs[audit_logsPk];
export type audit_logsOptionalAttributes = "id" | "old_values" | "new_values" | "changed_columns" | "performed_at" | "ip_address";
export type audit_logsCreationAttributes = Optional<audit_logsAttributes, audit_logsOptionalAttributes>;

export class audit_logs extends Model<audit_logsAttributes, audit_logsCreationAttributes> implements audit_logsAttributes {
  id!: number;
  table_name!: string;
  record_id!: number;
  action!: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: object;
  new_values?: object;
  changed_columns?: object;
  performed_by!: number;
  performed_at!: Date;
  ip_address?: string;

  // audit_logs belongsTo users via performed_by
  performed_by_user!: users;
  getPerformed_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setPerformed_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createPerformed_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof audit_logs {
    return audit_logs.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    table_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "ชื่อตาราง เช่น loan_contract"
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID ของข้อมูลที่ถูกกระทำ"
    },
    action: {
      type: DataTypes.ENUM('CREATE','UPDATE','DELETE'),
      allowNull: false,
      comment: "ประเภทการกระทำ"
    },
    old_values: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "ข้อมูลเก่า (ก่อนแก้)"
    },
    new_values: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "ข้อมูลใหม่ (หลังแก้)"
    },
    changed_columns: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "รายชื่อคอลัมน์ที่ถูกเปลี่ยน"
    },
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID พนักงานที่ทำรายการ",
      references: {
        model: 'users',
        key: 'id'
      }
    },
    performed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'audit_logs',
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
        name: "idx_table_record",
        using: "BTREE",
        fields: [
          { name: "table_name" },
          { name: "record_id" },
        ]
      },
      {
        name: "idx_performed_by",
        using: "BTREE",
        fields: [
          { name: "performed_by" },
        ]
      },
    ]
  });
  }
}
