import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';

export interface loan_change_requestsAttributes {
  id: number;
  application_id: number;
  requested_by: number;
  reference_doc: string;
  change_type: 'FULL_OVERRIDE' | 'CHANGE_PARTNER' | 'CHANGE_PRODUCT' | 'CANCEL_ONLY' | 'CANCEL_AND_RECREATE' | 'CHANGE_PAYMENT_DATE';
  old_data: object;
  new_data: object;
  reason: string;
  evidence_urls: string;
  replacement_loan_id?: number;
  status?: 'pending' | 'approved' | 'executed' | 'rejected';
  created_at?: Date;
  updated_at?: Date;
}

export type loan_change_requestsPk = "id";
export type loan_change_requestsId = loan_change_requests[loan_change_requestsPk];
export type loan_change_requestsOptionalAttributes = "id" | "replacement_loan_id" | "status" | "created_at" | "updated_at";
export type loan_change_requestsCreationAttributes = Optional<loan_change_requestsAttributes, loan_change_requestsOptionalAttributes>;

export class loan_change_requests extends Model<loan_change_requestsAttributes, loan_change_requestsCreationAttributes> implements loan_change_requestsAttributes {
  id!: number;
  application_id!: number;
  requested_by!: number;
  reference_doc!: string;
  change_type!: 'FULL_OVERRIDE' | 'CHANGE_PARTNER' | 'CHANGE_PRODUCT' | 'CANCEL_ONLY' | 'CANCEL_AND_RECREATE' | 'CHANGE_PAYMENT_DATE';
  old_data!: object;
  new_data!: object;
  reason!: string;
  evidence_urls!: string;
  replacement_loan_id?: number;
  status?: 'pending' | 'approved' | 'executed' | 'rejected';
  created_at?: Date;
  updated_at?: Date;

  // loan_change_requests belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_change_requests belongsTo loan_applications via replacement_loan_id
  replacement_loan!: loan_applications;
  getReplacement_loan!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setReplacement_loan!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createReplacement_loan!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_change_requests {
    return loan_change_requests.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID ของใบคำขอเดิมที่ถูกแก้ไขหรือยกเลิก",
      references: {
        model: 'loan_applications',
        key: 'id'
      }
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID พนักงาน IT\/Admin ที่คีย์ข้อมูลทำรายการ"
    },
    reference_doc: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "เลขที่เอกสารอนุมัติ (Change\/Cancel Form No)"
    },
    change_type: {
      type: DataTypes.ENUM('FULL_OVERRIDE','CHANGE_PARTNER','CHANGE_PRODUCT','CANCEL_ONLY','CANCEL_AND_RECREATE','CHANGE_PAYMENT_DATE'),
      allowNull: false,
      comment: "ประเภทของการแก้ไข"
    },
    old_data: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "ข้อมูล Snapshot ก่อนแก้"
    },
    new_data: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "ข้อมูล Snapshot หลังแก้"
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "เหตุผลโดยละเอียด"
    },
    evidence_urls: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "เก็บ Base64 รูปภาพเอกสาร หรือ URL จาก MinIO"
    },
    replacement_loan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID ของใบคำขอใหม่ (ถ้ามีการสร้างทดแทน)",
      references: {
        model: 'loan_applications',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending','approved','executed','rejected'),
      allowNull: true,
      defaultValue: "executed",
      comment: "สถานะการทำงาน (Override = executed ทันที)"
    }
  }, {
    sequelize,
    tableName: 'loan_change_requests',
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
        name: "idx_application_id",
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "idx_replacement_loan",
        using: "BTREE",
        fields: [
          { name: "replacement_loan_id" },
        ]
      },
    ]
  });
  }
}
