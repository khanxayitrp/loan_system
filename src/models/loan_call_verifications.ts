import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface loan_call_verificationsAttributes {
  id: number;
  application_id: number;
  call_target: 'workplace' | 'home' | 'guarantor';
  contact_name?: string;
  contact_phone?: string;
  relationship?: string;
  is_info_matching?: number;
  has_debt_history_known?: number;
  remark?: string;
  call_status?: 'no_answer' | 'pending_callback' | 'completed';
  called_by: number;
  called_at?: Date;
}

export type loan_call_verificationsPk = "id";
export type loan_call_verificationsId = loan_call_verifications[loan_call_verificationsPk];
export type loan_call_verificationsOptionalAttributes = "id" | "contact_name" | "contact_phone" | "relationship" | "is_info_matching" | "has_debt_history_known" | "remark" | "call_status" | "called_at";
export type loan_call_verificationsCreationAttributes = Optional<loan_call_verificationsAttributes, loan_call_verificationsOptionalAttributes>;

export class loan_call_verifications extends Model<loan_call_verificationsAttributes, loan_call_verificationsCreationAttributes> implements loan_call_verificationsAttributes {
  id!: number;
  application_id!: number;
  call_target!: 'workplace' | 'home' | 'guarantor';
  contact_name?: string;
  contact_phone?: string;
  relationship?: string;
  is_info_matching?: number;
  has_debt_history_known?: number;
  remark?: string;
  call_status?: 'no_answer' | 'pending_callback' | 'completed';
  called_by!: number;
  called_at?: Date;

  // loan_call_verifications belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_call_verifications belongsTo users via called_by
  called_by_user!: users;
  getCalled_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCalled_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCalled_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_call_verifications {
    return loan_call_verifications.init({
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
    call_target: {
      type: DataTypes.ENUM('workplace','home','guarantor'),
      allowNull: false
    },
    contact_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    relationship: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_info_matching: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    has_debt_history_known: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    call_status: {
      type: DataTypes.ENUM('no_answer','pending_callback','completed'),
      allowNull: true,
      defaultValue: "completed"
    },
    called_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    called_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'loan_call_verifications',
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
        name: "called_by",
        using: "BTREE",
        fields: [
          { name: "called_by" },
        ]
      },
    ]
  });
  }
}
