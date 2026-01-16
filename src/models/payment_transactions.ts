import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { repayments, repaymentsId } from './repayments';
import type { users, usersId } from './users';

export interface payment_transactionsAttributes {
  id: number;
  application_id: number;
  schedule_id?: number;
  amount_paid: number;
  transaction_type?: 'installment' | 'closing' | 'penalty' | 'other';
  payment_channel: 'mobile_app' | 'cash_at_branch' | 'bank_transfer' | 'staff_collection';
  payment_method?: string;
  proof_url?: string;
  paid_at?: Date;
  recorded_by?: number;
  remarks?: string;
}

export type payment_transactionsPk = "id";
export type payment_transactionsId = payment_transactions[payment_transactionsPk];
export type payment_transactionsOptionalAttributes = "id" | "schedule_id" | "transaction_type" | "payment_method" | "proof_url" | "paid_at" | "recorded_by" | "remarks";
export type payment_transactionsCreationAttributes = Optional<payment_transactionsAttributes, payment_transactionsOptionalAttributes>;

export class payment_transactions extends Model<payment_transactionsAttributes, payment_transactionsCreationAttributes> implements payment_transactionsAttributes {
  id!: number;
  application_id!: number;
  schedule_id?: number;
  amount_paid!: number;
  transaction_type?: 'installment' | 'closing' | 'penalty' | 'other';
  payment_channel!: 'mobile_app' | 'cash_at_branch' | 'bank_transfer' | 'staff_collection';
  payment_method?: string;
  proof_url?: string;
  paid_at?: Date;
  recorded_by?: number;
  remarks?: string;

  // payment_transactions belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // payment_transactions belongsTo repayments via schedule_id
  schedule!: repayments;
  getSchedule!: Sequelize.BelongsToGetAssociationMixin<repayments>;
  setSchedule!: Sequelize.BelongsToSetAssociationMixin<repayments, repaymentsId>;
  createSchedule!: Sequelize.BelongsToCreateAssociationMixin<repayments>;
  // payment_transactions belongsTo users via recorded_by
  recorded_by_user!: users;
  getRecorded_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setRecorded_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createRecorded_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof payment_transactions {
    return payment_transactions.init({
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
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'repayments',
        key: 'id'
      }
    },
    amount_paid: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('installment','closing','penalty','other'),
      allowNull: true,
      defaultValue: "installment"
    },
    payment_channel: {
      type: DataTypes.ENUM('mobile_app','cash_at_branch','bank_transfer','staff_collection'),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    proof_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'payment_transactions',
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
        name: "schedule_id",
        using: "BTREE",
        fields: [
          { name: "schedule_id" },
        ]
      },
      {
        name: "recorded_by",
        using: "BTREE",
        fields: [
          { name: "recorded_by" },
        ]
      },
    ]
  });
  }
}
