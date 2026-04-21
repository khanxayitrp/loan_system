import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';
import type { users, usersId } from './users'; // 🟢 เพิ่ม import users

export interface customer_documentsAttributes {
  id: number;
  customer_id: number;
  file_url: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  doc_type: 'id_card' | 'house_reg' | 'salary_slip' | 'face_scan' | 'other'; // 🟢 เพิ่ม 'other'
  uploaded_at: Date;
  expires_at?: Date | null; // <--- ເພີ່ມ | null ເຂົ້າໄປ
  uploaded_by?: number | null; // <--- ແນະນຳໃຫ້ເພີ່ມ | null ໃຫ້ uploaded_by ນຳ ເພາະໃນ service ທ່ານໃຊ້ data.uploaded_by || null

}

export type customer_documentsPk = "id";
export type customer_documentsId = customer_documents[customer_documentsPk];
export type customer_documentsOptionalAttributes = "id" | "original_filename" | "file_size" | "mime_type" | "doc_type" | "uploaded_at" | "expires_at" | "uploaded_by";
export type customer_documentsCreationAttributes = Optional<customer_documentsAttributes, customer_documentsOptionalAttributes>;

export class customer_documents extends Model<customer_documentsAttributes, customer_documentsCreationAttributes> implements customer_documentsAttributes {
  id!: number;
  customer_id!: number;
  file_url!: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  doc_type!: 'id_card' | 'house_reg' | 'salary_slip' | 'face_scan' | 'other';
  uploaded_at!: Date;
  expires_at?: Date;
  uploaded_by?: number;

  // customer_documents belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  
  // 🟢 customer_documents belongsTo users via uploaded_by
  uploaded_by_user!: users;
  getUploaded_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUploaded_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUploaded_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_documents {
    return customer_documents.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    file_url: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "ขนาดไฟล์ (bytes)"
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "เช่น image/jpeg, application/pdf"
    },
    doc_type: {
      type: DataTypes.ENUM('id_card','house_reg','salary_slip','face_scan','other'),
      allowNull: false,
      defaultValue: "other"
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "user_id ที่ upload",
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'customer_documents',
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
        name: "cust_docs_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
      {
        // 🟢 เพิ่ม Index สำหรับ FK ใหม่
        name: "fk_customer_docs_uploaded_by",
        using: "BTREE",
        fields: [
          { name: "uploaded_by" },
        ]
      },
    ]
  });
  }
}