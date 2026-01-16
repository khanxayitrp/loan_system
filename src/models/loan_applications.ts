import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { application_documents, application_documentsId } from './application_documents';
import type { customers, customersId } from './customers';
import type { payment_transactions, payment_transactionsId } from './payment_transactions';
import type { products, productsId } from './products';
import type { repayments, repaymentsId } from './repayments';
import type { users, usersId } from './users';

export interface loan_applicationsAttributes {
  id: number;
  customer_id: number;
  product_id: number;
  total_amount: number;
  interest_rate_at_apply: number;
  loan_period: number;
  monthly_installment: number;
  is_confirmed?: number;
  status?: 'pending' | 'verifying' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'closed_early';
  requester_id?: number;
  approver_id?: number;
  applied_at?: Date;
  approved_at?: Date;
  remarks?: string;
}

export type loan_applicationsPk = "id";
export type loan_applicationsId = loan_applications[loan_applicationsPk];
export type loan_applicationsOptionalAttributes = "id" | "is_confirmed" | "status" | "requester_id" | "approver_id" | "applied_at" | "approved_at" | "remarks";
export type loan_applicationsCreationAttributes = Optional<loan_applicationsAttributes, loan_applicationsOptionalAttributes>;

export class loan_applications extends Model<loan_applicationsAttributes, loan_applicationsCreationAttributes> implements loan_applicationsAttributes {
  id!: number;
  customer_id!: number;
  product_id!: number;
  total_amount!: number;
  interest_rate_at_apply!: number;
  loan_period!: number;
  monthly_installment!: number;
  is_confirmed?: number;
  status?: 'pending' | 'verifying' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'closed_early';
  requester_id?: number;
  approver_id?: number;
  applied_at?: Date;
  approved_at?: Date;
  remarks?: string;

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
    total_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    interest_rate_at_apply: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    },
    loan_period: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monthly_installment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    is_confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending','verifying','approved','rejected','cancelled','completed','closed_early'),
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
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'loan_applications',
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
