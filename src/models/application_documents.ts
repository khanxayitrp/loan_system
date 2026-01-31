import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';

export interface application_documentsAttributes {
  id: number;
  application_id: number;
  file_url: string;
  doc_type?: 'id_card' | 'house_reg' | 'salary_slip' | 'other';
  uploaded_at?: Date;
}

export type application_documentsPk = "id";
export type application_documentsId = application_documents[application_documentsPk];
export type application_documentsOptionalAttributes = "id" | "doc_type" | "uploaded_at";
export type application_documentsCreationAttributes = Optional<application_documentsAttributes, application_documentsOptionalAttributes>;

export class application_documents extends Model<application_documentsAttributes, application_documentsCreationAttributes> implements application_documentsAttributes {
  id!: number;
  application_id!: number;
  file_url!: string;
  doc_type?: 'id_card' | 'house_reg' | 'salary_slip' | 'other';
  uploaded_at?: Date;

  // application_documents belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;

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
      type: DataTypes.STRING(255),
      allowNull: false
    },
    doc_type: {
      type: DataTypes.ENUM('id_card','house_reg','salary_slip','other'),
      allowNull: true,
      defaultValue: "other"
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
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
        name: "application_id",
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
    ]
  });
  }
}
