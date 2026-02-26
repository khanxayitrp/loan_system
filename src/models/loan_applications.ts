import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { application_documents, application_documentsId } from './application_documents';
import type { customers, customersId } from './customers';
import type { delivery_receipts, delivery_receiptsId } from './delivery_receipts';
import type { loan_guarantors, loan_guarantorsId } from './loan_guarantors';
import type { loan_payments, loan_paymentsId } from './loan_payments';
import type { payment_transactions, payment_transactionsId } from './payment_transactions';
import type { products, productsId } from './products';
import type { repayments, repaymentsId } from './repayments';
import type { users, usersId } from './users';

export interface loan_applicationsAttributes {
  id: number;
  customer_id: number;
  product_id: number;
  loan_id: string;
  total_amount: number;
  loan_period: number;
  interest_rate_at_apply: number;
  monthly_pay: number;
  is_confirmed?: number;
  status?: 'pending' | 'verifying' | 'approved' | 'rejected' | 'completed' | 'closed_early';
  requester_id?: number;
  approver_id?: number;
  applied_at?: Date;
  approved_at?: Date;
  credit_score?: number;
  remarks?: string;
  created_at?: Date;
  updated_at?: Date;
  down_payment?: number;
  fee?: number;
  first_installment_amount?: number;
  payment_day?: number;
  borrower_signature_date?: Date;
  guarantor_signature_date?: Date;
  staff_signature_date?: Date;
}

export type loan_applicationsPk = "id";
export type loan_applicationsId = loan_applications[loan_applicationsPk];
export type loan_applicationsOptionalAttributes = "id" | "is_confirmed" | "status" | "requester_id" | "approver_id" | "applied_at" | "approved_at" | "credit_score" | "remarks" | "created_at" | "updated_at" | "down_payment" | "fee" | "first_installment_amount" | "payment_day" | "borrower_signature_date" | "guarantor_signature_date" | "staff_signature_date";
export type loan_applicationsCreationAttributes = Optional<loan_applicationsAttributes, loan_applicationsOptionalAttributes>;

export class loan_applications extends Model<loan_applicationsAttributes, loan_applicationsCreationAttributes> implements loan_applicationsAttributes {
  id!: number;
  customer_id!: number;
  product_id!: number;
  loan_id!: string;
  total_amount!: number;
  loan_period!: number;
  interest_rate_at_apply!: number;
  monthly_pay!: number;
  is_confirmed?: number;
  status?: 'pending' | 'verifying' | 'approved' | 'rejected' | 'completed' | 'closed_early';
  requester_id?: number;
  approver_id?: number;
  applied_at?: Date;
  approved_at?: Date;
  credit_score?: number;
  remarks?: string;
  created_at?: Date;
  updated_at?: Date;
  down_payment?: number;
  fee?: number;
  first_installment_amount?: number;
  payment_day?: number;
  borrower_signature_date?: Date;
  guarantor_signature_date?: Date;
  staff_signature_date?: Date;

  // loan_applications belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // loan_applications hasMany application_documents via application_id
  application_documents!: application_documents[];
  getApplication_documents!: Sequelize.HasManyGetAssociationsMixin<application_documents>;
  setApplication_documents!: Sequelize.HasManySetAssociationsMixin<application_documents, application_documentsId>;
  addApplication_document!: Sequelize.HasManyAddAssociationMixin<application_documents, application_documentsId>;
  addApplication_documents!: Sequelize.HasManyAddAssociationsMixin<application_documents, application_documentsId>;
  createApplication_document!: Sequelize.HasManyCreateAssociationMixin<application_documents>;
  removeApplication_document!: Sequelize.HasManyRemoveAssociationMixin<application_documents, application_documentsId>;
  removeApplication_documents!: Sequelize.HasManyRemoveAssociationsMixin<application_documents, application_documentsId>;
  hasApplication_document!: Sequelize.HasManyHasAssociationMixin<application_documents, application_documentsId>;
  hasApplication_documents!: Sequelize.HasManyHasAssociationsMixin<application_documents, application_documentsId>;
  countApplication_documents!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany delivery_receipts via application_id
  delivery_receipts!: delivery_receipts[];
  getDelivery_receipts!: Sequelize.HasManyGetAssociationsMixin<delivery_receipts>;
  setDelivery_receipts!: Sequelize.HasManySetAssociationsMixin<delivery_receipts, delivery_receiptsId>;
  addDelivery_receipt!: Sequelize.HasManyAddAssociationMixin<delivery_receipts, delivery_receiptsId>;
  addDelivery_receipts!: Sequelize.HasManyAddAssociationsMixin<delivery_receipts, delivery_receiptsId>;
  createDelivery_receipt!: Sequelize.HasManyCreateAssociationMixin<delivery_receipts>;
  removeDelivery_receipt!: Sequelize.HasManyRemoveAssociationMixin<delivery_receipts, delivery_receiptsId>;
  removeDelivery_receipts!: Sequelize.HasManyRemoveAssociationsMixin<delivery_receipts, delivery_receiptsId>;
  hasDelivery_receipt!: Sequelize.HasManyHasAssociationMixin<delivery_receipts, delivery_receiptsId>;
  hasDelivery_receipts!: Sequelize.HasManyHasAssociationsMixin<delivery_receipts, delivery_receiptsId>;
  countDelivery_receipts!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany loan_guarantors via application_id
  loan_guarantors!: loan_guarantors[];
  getLoan_guarantors!: Sequelize.HasManyGetAssociationsMixin<loan_guarantors>;
  setLoan_guarantors!: Sequelize.HasManySetAssociationsMixin<loan_guarantors, loan_guarantorsId>;
  addLoan_guarantor!: Sequelize.HasManyAddAssociationMixin<loan_guarantors, loan_guarantorsId>;
  addLoan_guarantors!: Sequelize.HasManyAddAssociationsMixin<loan_guarantors, loan_guarantorsId>;
  createLoan_guarantor!: Sequelize.HasManyCreateAssociationMixin<loan_guarantors>;
  removeLoan_guarantor!: Sequelize.HasManyRemoveAssociationMixin<loan_guarantors, loan_guarantorsId>;
  removeLoan_guarantors!: Sequelize.HasManyRemoveAssociationsMixin<loan_guarantors, loan_guarantorsId>;
  hasLoan_guarantor!: Sequelize.HasManyHasAssociationMixin<loan_guarantors, loan_guarantorsId>;
  hasLoan_guarantors!: Sequelize.HasManyHasAssociationsMixin<loan_guarantors, loan_guarantorsId>;
  countLoan_guarantors!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany loan_payments via loan_application_id
  loan_payments!: loan_payments[];
  getLoan_payments!: Sequelize.HasManyGetAssociationsMixin<loan_payments>;
  setLoan_payments!: Sequelize.HasManySetAssociationsMixin<loan_payments, loan_paymentsId>;
  addLoan_payment!: Sequelize.HasManyAddAssociationMixin<loan_payments, loan_paymentsId>;
  addLoan_payments!: Sequelize.HasManyAddAssociationsMixin<loan_payments, loan_paymentsId>;
  createLoan_payment!: Sequelize.HasManyCreateAssociationMixin<loan_payments>;
  removeLoan_payment!: Sequelize.HasManyRemoveAssociationMixin<loan_payments, loan_paymentsId>;
  removeLoan_payments!: Sequelize.HasManyRemoveAssociationsMixin<loan_payments, loan_paymentsId>;
  hasLoan_payment!: Sequelize.HasManyHasAssociationMixin<loan_payments, loan_paymentsId>;
  hasLoan_payments!: Sequelize.HasManyHasAssociationsMixin<loan_payments, loan_paymentsId>;
  countLoan_payments!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany payment_transactions via application_id
  payment_transactions!: payment_transactions[];
  getPayment_transactions!: Sequelize.HasManyGetAssociationsMixin<payment_transactions>;
  setPayment_transactions!: Sequelize.HasManySetAssociationsMixin<payment_transactions, payment_transactionsId>;
  addPayment_transaction!: Sequelize.HasManyAddAssociationMixin<payment_transactions, payment_transactionsId>;
  addPayment_transactions!: Sequelize.HasManyAddAssociationsMixin<payment_transactions, payment_transactionsId>;
  createPayment_transaction!: Sequelize.HasManyCreateAssociationMixin<payment_transactions>;
  removePayment_transaction!: Sequelize.HasManyRemoveAssociationMixin<payment_transactions, payment_transactionsId>;
  removePayment_transactions!: Sequelize.HasManyRemoveAssociationsMixin<payment_transactions, payment_transactionsId>;
  hasPayment_transaction!: Sequelize.HasManyHasAssociationMixin<payment_transactions, payment_transactionsId>;
  hasPayment_transactions!: Sequelize.HasManyHasAssociationsMixin<payment_transactions, payment_transactionsId>;
  countPayment_transactions!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany repayments via application_id
  repayments!: repayments[];
  getRepayments!: Sequelize.HasManyGetAssociationsMixin<repayments>;
  setRepayments!: Sequelize.HasManySetAssociationsMixin<repayments, repaymentsId>;
  addRepayment!: Sequelize.HasManyAddAssociationMixin<repayments, repaymentsId>;
  addRepayments!: Sequelize.HasManyAddAssociationsMixin<repayments, repaymentsId>;
  createRepayment!: Sequelize.HasManyCreateAssociationMixin<repayments>;
  removeRepayment!: Sequelize.HasManyRemoveAssociationMixin<repayments, repaymentsId>;
  removeRepayments!: Sequelize.HasManyRemoveAssociationsMixin<repayments, repaymentsId>;
  hasRepayment!: Sequelize.HasManyHasAssociationMixin<repayments, repaymentsId>;
  hasRepayments!: Sequelize.HasManyHasAssociationsMixin<repayments, repaymentsId>;
  countRepayments!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;
  // loan_applications belongsTo users via requester_id
  requester!: users;
  getRequester!: Sequelize.BelongsToGetAssociationMixin<users>;
  setRequester!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createRequester!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // loan_applications belongsTo users via approver_id
  approver!: users;
  getApprover!: Sequelize.BelongsToGetAssociationMixin<users>;
  setApprover!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createApprover!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_applications {
    return loan_applications.init({
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    loan_id: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    loan_period: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    interest_rate_at_apply: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    },
    monthly_pay: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    is_confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending','verifying','approved','rejected','completed','closed_early'),
      allowNull: true,
      defaultValue: "pending"
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    credit_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    down_payment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    fee: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    first_installment_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    payment_day: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    borrower_signature_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    guarantor_signature_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    staff_signature_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'loan_applications',
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
        name: "customer_id",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
      {
        name: "product_id",
        using: "BTREE",
        fields: [
          { name: "product_id" },
        ]
      },
      {
        name: "requester_id",
        using: "BTREE",
        fields: [
          { name: "requester_id" },
        ]
      },
      {
        name: "approver_id",
        using: "BTREE",
        fields: [
          { name: "approver_id" },
        ]
      },
    ]
  });
  }
}
