import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface application_documentsAttributes {
  id: number;
  application_id: number;
  file_url: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  doc_type: 'id_card' | 'house_reg' | 'salary_slip' | 'other';
  uploaded_at: Date;
  uploaded_by?: number;
}

export type application_documentsPk = "id";
export type application_documentsId = application_documents[application_documentsPk];
export type application_documentsOptionalAttributes = "id" | "original_filename" | "file_size" | "mime_type" | "doc_type" | "uploaded_at" | "uploaded_by";
export type application_documentsCreationAttributes = Optional<application_documentsAttributes, application_documentsOptionalAttributes>;

export class application_documents extends Model<application_documentsAttributes, application_documentsCreationAttributes> implements application_documentsAttributes {
  id!: number;
  application_id!: number;
  file_url!: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  doc_type!: 'id_card' | 'house_reg' | 'salary_slip' | 'other';
  uploaded_at!: Date;
  uploaded_by?: number;

  // application_documents belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // application_documents belongsTo users via uploaded_by
  uploaded_by_user!: users;
  getUploaded_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUploaded_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUploaded_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof application_documents {
    return application_documents.init({
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
      comment: "เช่น image\/jpeg, application\/pdf"
    },
    doc_type: {
      type: DataTypes.ENUM('id_card','house_reg','salary_slip','other'),
      allowNull: false,
      defaultValue: "other"
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
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
    tableName: 'application_documents',
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
        name: "idx_application_id",
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "uploaded_by",
        using: "BTREE",
        fields: [
          { name: "uploaded_by" },
        ]
      },
    ]
  });
  }
}
