import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_accounts, credit_accountsId } from './credit_accounts';

export interface credit_ledgerAttributes {
  id: number;
  credit_account_id: number;
  transaction_type: 'LIMIT_GRANT' | 'CREDIT_AUTHORIZATION' | 'CREDIT_UTILIZATION' | 'CREDIT_REFUND' | 'LIMIT_INCREASE' | 'LIMIT_DECREASE' | 'PAYMENT_CLEARED';
  reference_type?: string;
  reference_id?: number;
  debit_amount: number;
  credit_amount: number;
  balance_before: number;
  balance_after: number;
  idempotency_key: string;
  transaction_at: Date;
  created_by?: number;
}

export type credit_ledgerPk = "id";
export type credit_ledgerId = credit_ledger[credit_ledgerPk];
export type credit_ledgerOptionalAttributes = "id" | "reference_type" | "reference_id" | "debit_amount" | "credit_amount" | "transaction_at" | "created_by";
export type credit_ledgerCreationAttributes = Optional<credit_ledgerAttributes, credit_ledgerOptionalAttributes>;

export class credit_ledger extends Model<credit_ledgerAttributes, credit_ledgerCreationAttributes> implements credit_ledgerAttributes {
  id!: number;
  credit_account_id!: number;
  transaction_type!: 'LIMIT_GRANT' | 'CREDIT_AUTHORIZATION' | 'CREDIT_UTILIZATION' | 'CREDIT_REFUND' | 'LIMIT_INCREASE' | 'LIMIT_DECREASE' | 'PAYMENT_CLEARED';
  reference_type?: string;
  reference_id?: number;
  debit_amount!: number;
  credit_amount!: number;
  balance_before!: number;
  balance_after!: number;
  idempotency_key!: string;
  transaction_at!: Date;
  created_by?: number;

  // credit_ledger belongsTo credit_accounts via credit_account_id
  credit_account!: credit_accounts;
  getCredit_account!: Sequelize.BelongsToGetAssociationMixin<credit_accounts>;
  setCredit_account!: Sequelize.BelongsToSetAssociationMixin<credit_accounts, credit_accountsId>;
  createCredit_account!: Sequelize.BelongsToCreateAssociationMixin<credit_accounts>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_ledger {
    return credit_ledger.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    credit_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'credit_accounts',
        key: 'id'
      }
    },
    transaction_type: {
      type: DataTypes.ENUM('LIMIT_GRANT','CREDIT_AUTHORIZATION','CREDIT_UTILIZATION','CREDIT_REFUND','LIMIT_INCREASE','LIMIT_DECREASE','PAYMENT_CLEARED'),
      allowNull: false
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    debit_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    credit_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    balance_before: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    balance_after: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    idempotency_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "idx_cl_idempotency"
    },
    transaction_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'credit_ledger',
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
        name: "idx_cl_idempotency",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idempotency_key" },
        ]
      },
      {
        name: "idx_cl_account_time",
        using: "BTREE",
        fields: [
          { name: "credit_account_id" },
          { name: "transaction_at" },
        ]
      },
    ]
  });
  }
}
