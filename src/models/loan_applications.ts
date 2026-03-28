import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { application_documents, application_documentsId } from './application_documents';
import type { cus_requestform, cus_requestformId } from './cus_requestform';
import type { customers, customersId } from './customers';
import type { delivery_receipts, delivery_receiptsCreationAttributes, delivery_receiptsId } from './delivery_receipts';
import type { document_signatures, document_signaturesId } from './document_signatures';
import type { loan_approval_logs, loan_approval_logsId } from './loan_approval_logs';
import type { loan_basic_verifications, loan_basic_verificationsId } from './loan_basic_verifications';
import type { loan_call_verifications, loan_call_verificationsId } from './loan_call_verifications';
import type { loan_cib_checks, loan_cib_checksCreationAttributes, loan_cib_checksId } from './loan_cib_checks';
import type { loan_cib_history_details, loan_cib_history_detailsId } from './loan_cib_history_details';
import type { loan_contract, loan_contractId } from './loan_contract';
import type { loan_field_visits, loan_field_visitsId } from './loan_field_visits';
import type { loan_guarantors, loan_guarantorsId } from './loan_guarantors';
import type { loan_income_assessments, loan_income_assessmentsCreationAttributes, loan_income_assessmentsId } from './loan_income_assessments';
import type { loan_payments, loan_paymentsId } from './loan_payments';
import type { orders, ordersId } from './orders';
import type { payment_transactions, payment_transactionsId } from './payment_transactions';
import type { products, productsId } from './products';
import type { repayment_schedules, repayment_schedulesId } from './repayment_schedules';
import type { repayments, repaymentsId } from './repayments';
import type { users, usersId } from './users';

export interface loan_applicationsAttributes {
  id: number;
  loan_flow_type: 'single_item' | 'bnpl_cart';
  customer_id: number;
  product_id: number;
  order_id?: number;
  loan_id: string;
  total_amount: number;
  loan_period: number;
  interest_rate_at_apply: number;
  interest_type: 'flat_rate' | 'effective_rate';
  interest_rate_type: 'monthly' | 'yearly';
  monthly_pay: number;
  is_confirmed?: number;
  status?: 'pending' | 'verifying' | 'verified' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'closed_early';
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
export type loan_applicationsOptionalAttributes = "id" | "loan_flow_type" | "order_id" | "interest_type" | "interest_rate_type" | "is_confirmed" | "status" | "requester_id" | "approver_id" | "applied_at" | "approved_at" | "credit_score" | "remarks" | "created_at" | "updated_at" | "down_payment" | "fee" | "first_installment_amount" | "payment_day" | "borrower_signature_date" | "guarantor_signature_date" | "staff_signature_date";
export type loan_applicationsCreationAttributes = Optional<loan_applicationsAttributes, loan_applicationsOptionalAttributes>;

export class loan_applications extends Model<loan_applicationsAttributes, loan_applicationsCreationAttributes> implements loan_applicationsAttributes {
  id!: number;
  loan_flow_type!: 'single_item' | 'bnpl_cart';
  customer_id!: number;
  product_id!: number;
  order_id?: number;
  loan_id!: string;
  total_amount!: number;
  loan_period!: number;
  interest_rate_at_apply!: number;
  interest_type!: 'flat_rate' | 'effective_rate';
  interest_rate_type!: 'monthly' | 'yearly';
  monthly_pay!: number;
  is_confirmed?: number;
  status?: 'pending' | 'verifying' | 'verified' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'closed_early';
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
  // loan_applications hasMany cus_requestform via application_id
  cus_requestforms!: cus_requestform[];
  getCus_requestforms!: Sequelize.HasManyGetAssociationsMixin<cus_requestform>;
  setCus_requestforms!: Sequelize.HasManySetAssociationsMixin<cus_requestform, cus_requestformId>;
  addCus_requestform!: Sequelize.HasManyAddAssociationMixin<cus_requestform, cus_requestformId>;
  addCus_requestforms!: Sequelize.HasManyAddAssociationsMixin<cus_requestform, cus_requestformId>;
  createCus_requestform!: Sequelize.HasManyCreateAssociationMixin<cus_requestform>;
  removeCus_requestform!: Sequelize.HasManyRemoveAssociationMixin<cus_requestform, cus_requestformId>;
  removeCus_requestforms!: Sequelize.HasManyRemoveAssociationsMixin<cus_requestform, cus_requestformId>;
  hasCus_requestform!: Sequelize.HasManyHasAssociationMixin<cus_requestform, cus_requestformId>;
  hasCus_requestforms!: Sequelize.HasManyHasAssociationsMixin<cus_requestform, cus_requestformId>;
  countCus_requestforms!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasOne delivery_receipts via application_id
  delivery_receipt!: delivery_receipts;
  getDelivery_receipt!: Sequelize.HasOneGetAssociationMixin<delivery_receipts>;
  setDelivery_receipt!: Sequelize.HasOneSetAssociationMixin<delivery_receipts, delivery_receiptsId>;
  createDelivery_receipt!: Sequelize.HasOneCreateAssociationMixin<delivery_receipts>;
  // loan_applications hasMany document_signatures via application_id
  document_signatures!: document_signatures[];
  getDocument_signatures!: Sequelize.HasManyGetAssociationsMixin<document_signatures>;
  setDocument_signatures!: Sequelize.HasManySetAssociationsMixin<document_signatures, document_signaturesId>;
  addDocument_signature!: Sequelize.HasManyAddAssociationMixin<document_signatures, document_signaturesId>;
  addDocument_signatures!: Sequelize.HasManyAddAssociationsMixin<document_signatures, document_signaturesId>;
  createDocument_signature!: Sequelize.HasManyCreateAssociationMixin<document_signatures>;
  removeDocument_signature!: Sequelize.HasManyRemoveAssociationMixin<document_signatures, document_signaturesId>;
  removeDocument_signatures!: Sequelize.HasManyRemoveAssociationsMixin<document_signatures, document_signaturesId>;
  hasDocument_signature!: Sequelize.HasManyHasAssociationMixin<document_signatures, document_signaturesId>;
  hasDocument_signatures!: Sequelize.HasManyHasAssociationsMixin<document_signatures, document_signaturesId>;
  countDocument_signatures!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany loan_approval_logs via application_id
  loan_approval_logs!: loan_approval_logs[];
  getLoan_approval_logs!: Sequelize.HasManyGetAssociationsMixin<loan_approval_logs>;
  setLoan_approval_logs!: Sequelize.HasManySetAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  addLoan_approval_log!: Sequelize.HasManyAddAssociationMixin<loan_approval_logs, loan_approval_logsId>;
  addLoan_approval_logs!: Sequelize.HasManyAddAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  createLoan_approval_log!: Sequelize.HasManyCreateAssociationMixin<loan_approval_logs>;
  removeLoan_approval_log!: Sequelize.HasManyRemoveAssociationMixin<loan_approval_logs, loan_approval_logsId>;
  removeLoan_approval_logs!: Sequelize.HasManyRemoveAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  hasLoan_approval_log!: Sequelize.HasManyHasAssociationMixin<loan_approval_logs, loan_approval_logsId>;
  hasLoan_approval_logs!: Sequelize.HasManyHasAssociationsMixin<loan_approval_logs, loan_approval_logsId>;
  countLoan_approval_logs!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany loan_basic_verifications via application_id
  loan_basic_verifications!: loan_basic_verifications[];
  getLoan_basic_verifications!: Sequelize.HasManyGetAssociationsMixin<loan_basic_verifications>;
  setLoan_basic_verifications!: Sequelize.HasManySetAssociationsMixin<loan_basic_verifications, loan_basic_verificationsId>;
  addLoan_basic_verification!: Sequelize.HasManyAddAssociationMixin<loan_basic_verifications, loan_basic_verificationsId>;
  addLoan_basic_verifications!: Sequelize.HasManyAddAssociationsMixin<loan_basic_verifications, loan_basic_verificationsId>;
  createLoan_basic_verification!: Sequelize.HasManyCreateAssociationMixin<loan_basic_verifications>;
  removeLoan_basic_verification!: Sequelize.HasManyRemoveAssociationMixin<loan_basic_verifications, loan_basic_verificationsId>;
  removeLoan_basic_verifications!: Sequelize.HasManyRemoveAssociationsMixin<loan_basic_verifications, loan_basic_verificationsId>;
  hasLoan_basic_verification!: Sequelize.HasManyHasAssociationMixin<loan_basic_verifications, loan_basic_verificationsId>;
  hasLoan_basic_verifications!: Sequelize.HasManyHasAssociationsMixin<loan_basic_verifications, loan_basic_verificationsId>;
  countLoan_basic_verifications!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany loan_call_verifications via application_id
  loan_call_verifications!: loan_call_verifications[];
  getLoan_call_verifications!: Sequelize.HasManyGetAssociationsMixin<loan_call_verifications>;
  setLoan_call_verifications!: Sequelize.HasManySetAssociationsMixin<loan_call_verifications, loan_call_verificationsId>;
  addLoan_call_verification!: Sequelize.HasManyAddAssociationMixin<loan_call_verifications, loan_call_verificationsId>;
  addLoan_call_verifications!: Sequelize.HasManyAddAssociationsMixin<loan_call_verifications, loan_call_verificationsId>;
  createLoan_call_verification!: Sequelize.HasManyCreateAssociationMixin<loan_call_verifications>;
  removeLoan_call_verification!: Sequelize.HasManyRemoveAssociationMixin<loan_call_verifications, loan_call_verificationsId>;
  removeLoan_call_verifications!: Sequelize.HasManyRemoveAssociationsMixin<loan_call_verifications, loan_call_verificationsId>;
  hasLoan_call_verification!: Sequelize.HasManyHasAssociationMixin<loan_call_verifications, loan_call_verificationsId>;
  hasLoan_call_verifications!: Sequelize.HasManyHasAssociationsMixin<loan_call_verifications, loan_call_verificationsId>;
  countLoan_call_verifications!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasOne loan_cib_checks via application_id
  loan_cib_check!: loan_cib_checks;
  getLoan_cib_check!: Sequelize.HasOneGetAssociationMixin<loan_cib_checks>;
  setLoan_cib_check!: Sequelize.HasOneSetAssociationMixin<loan_cib_checks, loan_cib_checksId>;
  createLoan_cib_check!: Sequelize.HasOneCreateAssociationMixin<loan_cib_checks>;
  // loan_applications hasMany loan_cib_history_details via application_id
  loan_cib_history_details!: loan_cib_history_details[];
  getLoan_cib_history_details!: Sequelize.HasManyGetAssociationsMixin<loan_cib_history_details>;
  setLoan_cib_history_details!: Sequelize.HasManySetAssociationsMixin<loan_cib_history_details, loan_cib_history_detailsId>;
  addLoan_cib_history_detail!: Sequelize.HasManyAddAssociationMixin<loan_cib_history_details, loan_cib_history_detailsId>;
  addLoan_cib_history_details!: Sequelize.HasManyAddAssociationsMixin<loan_cib_history_details, loan_cib_history_detailsId>;
  createLoan_cib_history_detail!: Sequelize.HasManyCreateAssociationMixin<loan_cib_history_details>;
  removeLoan_cib_history_detail!: Sequelize.HasManyRemoveAssociationMixin<loan_cib_history_details, loan_cib_history_detailsId>;
  removeLoan_cib_history_details!: Sequelize.HasManyRemoveAssociationsMixin<loan_cib_history_details, loan_cib_history_detailsId>;
  hasLoan_cib_history_detail!: Sequelize.HasManyHasAssociationMixin<loan_cib_history_details, loan_cib_history_detailsId>;
  hasLoan_cib_history_details!: Sequelize.HasManyHasAssociationsMixin<loan_cib_history_details, loan_cib_history_detailsId>;
  countLoan_cib_history_details!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany loan_contract via loan_id
  loan_contracts!: loan_contract[];
  getLoan_contracts!: Sequelize.HasManyGetAssociationsMixin<loan_contract>;
  setLoan_contracts!: Sequelize.HasManySetAssociationsMixin<loan_contract, loan_contractId>;
  addLoan_contract!: Sequelize.HasManyAddAssociationMixin<loan_contract, loan_contractId>;
  addLoan_contracts!: Sequelize.HasManyAddAssociationsMixin<loan_contract, loan_contractId>;
  createLoan_contract!: Sequelize.HasManyCreateAssociationMixin<loan_contract>;
  removeLoan_contract!: Sequelize.HasManyRemoveAssociationMixin<loan_contract, loan_contractId>;
  removeLoan_contracts!: Sequelize.HasManyRemoveAssociationsMixin<loan_contract, loan_contractId>;
  hasLoan_contract!: Sequelize.HasManyHasAssociationMixin<loan_contract, loan_contractId>;
  hasLoan_contracts!: Sequelize.HasManyHasAssociationsMixin<loan_contract, loan_contractId>;
  countLoan_contracts!: Sequelize.HasManyCountAssociationsMixin;
  // loan_applications hasMany loan_field_visits via application_id
  loan_field_visits!: loan_field_visits[];
  getLoan_field_visits!: Sequelize.HasManyGetAssociationsMixin<loan_field_visits>;
  setLoan_field_visits!: Sequelize.HasManySetAssociationsMixin<loan_field_visits, loan_field_visitsId>;
  addLoan_field_visit!: Sequelize.HasManyAddAssociationMixin<loan_field_visits, loan_field_visitsId>;
  addLoan_field_visits!: Sequelize.HasManyAddAssociationsMixin<loan_field_visits, loan_field_visitsId>;
  createLoan_field_visit!: Sequelize.HasManyCreateAssociationMixin<loan_field_visits>;
  removeLoan_field_visit!: Sequelize.HasManyRemoveAssociationMixin<loan_field_visits, loan_field_visitsId>;
  removeLoan_field_visits!: Sequelize.HasManyRemoveAssociationsMixin<loan_field_visits, loan_field_visitsId>;
  hasLoan_field_visit!: Sequelize.HasManyHasAssociationMixin<loan_field_visits, loan_field_visitsId>;
  hasLoan_field_visits!: Sequelize.HasManyHasAssociationsMixin<loan_field_visits, loan_field_visitsId>;
  countLoan_field_visits!: Sequelize.HasManyCountAssociationsMixin;
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
  // loan_applications hasOne loan_income_assessments via application_id
  loan_income_assessment!: loan_income_assessments;
  getLoan_income_assessment!: Sequelize.HasOneGetAssociationMixin<loan_income_assessments>;
  setLoan_income_assessment!: Sequelize.HasOneSetAssociationMixin<loan_income_assessments, loan_income_assessmentsId>;
  createLoan_income_assessment!: Sequelize.HasOneCreateAssociationMixin<loan_income_assessments>;
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
  // loan_applications hasMany repayment_schedules via application_id
  repayment_schedules!: repayment_schedules[];
  getRepayment_schedules!: Sequelize.HasManyGetAssociationsMixin<repayment_schedules>;
  setRepayment_schedules!: Sequelize.HasManySetAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  addRepayment_schedule!: Sequelize.HasManyAddAssociationMixin<repayment_schedules, repayment_schedulesId>;
  addRepayment_schedules!: Sequelize.HasManyAddAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  createRepayment_schedule!: Sequelize.HasManyCreateAssociationMixin<repayment_schedules>;
  removeRepayment_schedule!: Sequelize.HasManyRemoveAssociationMixin<repayment_schedules, repayment_schedulesId>;
  removeRepayment_schedules!: Sequelize.HasManyRemoveAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  hasRepayment_schedule!: Sequelize.HasManyHasAssociationMixin<repayment_schedules, repayment_schedulesId>;
  hasRepayment_schedules!: Sequelize.HasManyHasAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  countRepayment_schedules!: Sequelize.HasManyCountAssociationsMixin;
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
  // loan_applications belongsTo orders via order_id
  order!: orders;
  getOrder!: Sequelize.BelongsToGetAssociationMixin<orders>;
  setOrder!: Sequelize.BelongsToSetAssociationMixin<orders, ordersId>;
  createOrder!: Sequelize.BelongsToCreateAssociationMixin<orders>;
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
    loan_flow_type: {
      type: DataTypes.ENUM('single_item','bnpl_cart'),
      allowNull: false,
      defaultValue: "single_item"
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
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
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
    interest_type: {
      type: DataTypes.ENUM('flat_rate','effective_rate'),
      allowNull: false,
      defaultValue: "flat_rate",
      comment: "ประเภทการคำนวณดอกเบี้ย (flat_rate=คงที่, effective_rate=ลดต้นลดดอก)"
    },
    interest_rate_type: {
      type: DataTypes.ENUM('monthly','yearly'),
      allowNull: false,
      defaultValue: "monthly",
      comment: "ระยะเวลาของดอกเบี้ย"
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
      type: DataTypes.ENUM('pending','verifying','verified','approved','rejected','cancelled','completed','closed_early'),
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
      {
        name: "fk_loan_order",
        using: "BTREE",
        fields: [
          { name: "order_id" },
        ]
      },
    ]
  });
  }
}
