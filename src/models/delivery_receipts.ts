import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface delivery_receiptsAttributes {
  id: number;
  application_id: number;
  receipts_id: string;
  delivery_date: Date;
  receiver_name: string;
  receipt_image_url?: string;
  status?: 'pending' | 'approved' | 'rejected';
  remark?: string;
  approver_id?: number;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export type delivery_receiptsPk = "id";
export type delivery_receiptsId = delivery_receipts[delivery_receiptsPk];
export type delivery_receiptsOptionalAttributes = "id" | "receipt_image_url" | "status" | "remark" | "approver_id" | "approved_at" | "created_at" | "updated_at";
export type delivery_receiptsCreationAttributes = Optional<delivery_receiptsAttributes, delivery_receiptsOptionalAttributes>;

export class delivery_receipts extends Model<delivery_receiptsAttributes, delivery_receiptsCreationAttributes> implements delivery_receiptsAttributes {
  id!: number;
  application_id!: number;
  receipts_id!: string;
  delivery_date!: Date;
  receiver_name!: string;
  receipt_image_url?: string;
  status?: 'pending' | 'approved' | 'rejected';
  remark?: string;
  approver_id?: number;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;

  // delivery_receipts belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // delivery_receipts belongsTo users via approver_id
  approver!: users;
  getApprover!: Sequelize.BelongsToGetAssociationMixin<users>;
  setApprover!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createApprover!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof delivery_receipts {
    return delivery_receipts.init({
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
    receipts_id: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    receiver_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    receipt_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending','approved','rejected'),
      allowNull: true,
      defaultValue: "pending"
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'delivery_receipts',
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
        name: "fk_delivery_application",
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "fk_delivery_approver",
        using: "BTREE",
        fields: [
          { name: "approver_id" },
        ]
      },
    ]
  });
  }
}
