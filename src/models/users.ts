import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { application_documents, application_documentsId } from './application_documents';
import type { audit_logs, audit_logsId } from './audit_logs';
import type { cus_requestform, cus_requestformId } from './cus_requestform';
import type { customers, customersId } from './customers';
import type { delivery_receipts, delivery_receiptsId } from './delivery_receipts';
import type { document_signatures, document_signaturesId } from './document_signatures';
import type { features, featuresId } from './features';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { loan_approval_logs, loan_approval_logsId } from './loan_approval_logs';
import type { loan_basic_verifications, loan_basic_verificationsId } from './loan_basic_verifications';
import type { loan_call_verifications, loan_call_verificationsId } from './loan_call_verifications';
import type { loan_cib_checks, loan_cib_checksId } from './loan_cib_checks';
import type { loan_contract, loan_contractId } from './loan_contract';
import type { loan_field_visits, loan_field_visitsId } from './loan_field_visits';
import type { loan_income_assessments, loan_income_assessmentsId } from './loan_income_assessments';
import type { partners, partnersId } from './partners';
import type { payment_transactions, payment_transactionsId } from './payment_transactions';
import type { promotions, promotionsId } from './promotions';
import type { repayment_schedules, repayment_schedulesId } from './repayment_schedules';
import type { user_permissions, user_permissionsId } from './user_permissions';
import type { user_refresh_tokens, user_refresh_tokensId } from './user_refresh_tokens';

export interface usersAttributes {
  id: number;
  username: string;
  password: string;
  full_name: string;
  role: 'admin' | 'staff' | 'partner' | 'customer';
  staff_level?: 'approver' | 'sales' | 'credit_officer' | 'credit_manager' | 'deputy_director' | 'director' | 'none';
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type usersPk = "id";
export type usersId = users[usersPk];
export type usersOptionalAttributes = "id" | "staff_level" | "is_active" | "created_at" | "updated_at";
export type usersCreationAttributes = Optional<usersAttributes, usersOptionalAttributes>;

export class users extends Model<usersAttributes, usersCreationAttributes> implements usersAttributes {
  id!: number;
  username!: string;
  password!: string;
  full_name!: string;
  role!: 'admin' | 'staff' | 'partner' | 'customer';
  staff_level?: 'approver' | 'sales' | 'credit_officer' | 'credit_manager' | 'deputy_director' | 'director' | 'none';
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;

  // users hasMany application_documents via uploaded_by
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
  // users hasMany audit_logs via performed_by
  audit_logs!: audit_logs[];
  getAudit_logs!: Sequelize.HasManyGetAssociationsMixin<audit_logs>;
  setAudit_logs!: Sequelize.HasManySetAssociationsMixin<audit_logs, audit_logsId>;
  addAudit_log!: Sequelize.HasManyAddAssociationMixin<audit_logs, audit_logsId>;
  addAudit_logs!: Sequelize.HasManyAddAssociationsMixin<audit_logs, audit_logsId>;
  createAudit_log!: Sequelize.HasManyCreateAssociationMixin<audit_logs>;
  removeAudit_log!: Sequelize.HasManyRemoveAssociationMixin<audit_logs, audit_logsId>;
  removeAudit_logs!: Sequelize.HasManyRemoveAssociationsMixin<audit_logs, audit_logsId>;
  hasAudit_log!: Sequelize.HasManyHasAssociationMixin<audit_logs, audit_logsId>;
  hasAudit_logs!: Sequelize.HasManyHasAssociationsMixin<audit_logs, audit_logsId>;
  countAudit_logs!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany cus_requestform via created_by
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
  // users hasMany cus_requestform via updated_by
  updated_by_cus_requestforms!: cus_requestform[];
  getUpdated_by_cus_requestforms!: Sequelize.HasManyGetAssociationsMixin<cus_requestform>;
  setUpdated_by_cus_requestforms!: Sequelize.HasManySetAssociationsMixin<cus_requestform, cus_requestformId>;
  addUpdated_by_cus_requestform!: Sequelize.HasManyAddAssociationMixin<cus_requestform, cus_requestformId>;
  addUpdated_by_cus_requestforms!: Sequelize.HasManyAddAssociationsMixin<cus_requestform, cus_requestformId>;
  createUpdated_by_cus_requestform!: Sequelize.HasManyCreateAssociationMixin<cus_requestform>;
  removeUpdated_by_cus_requestform!: Sequelize.HasManyRemoveAssociationMixin<cus_requestform, cus_requestformId>;
  removeUpdated_by_cus_requestforms!: Sequelize.HasManyRemoveAssociationsMixin<cus_requestform, cus_requestformId>;
  hasUpdated_by_cus_requestform!: Sequelize.HasManyHasAssociationMixin<cus_requestform, cus_requestformId>;
  hasUpdated_by_cus_requestforms!: Sequelize.HasManyHasAssociationsMixin<cus_requestform, cus_requestformId>;
  countUpdated_by_cus_requestforms!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany customers via user_id
  customers!: customers[];
  getCustomers!: Sequelize.HasManyGetAssociationsMixin<customers>;
  setCustomers!: Sequelize.HasManySetAssociationsMixin<customers, customersId>;
  addCustomer!: Sequelize.HasManyAddAssociationMixin<customers, customersId>;
  addCustomers!: Sequelize.HasManyAddAssociationsMixin<customers, customersId>;
  createCustomer!: Sequelize.HasManyCreateAssociationMixin<customers>;
  removeCustomer!: Sequelize.HasManyRemoveAssociationMixin<customers, customersId>;
  removeCustomers!: Sequelize.HasManyRemoveAssociationsMixin<customers, customersId>;
  hasCustomer!: Sequelize.HasManyHasAssociationMixin<customers, customersId>;
  hasCustomers!: Sequelize.HasManyHasAssociationsMixin<customers, customersId>;
  countCustomers!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany delivery_receipts via approver_id
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
  // users hasMany document_signatures via user_id
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
  // users belongsToMany features via user_id and feature_id
  feature_id_features!: features[];
  getFeature_id_features!: Sequelize.BelongsToManyGetAssociationsMixin<features>;
  setFeature_id_features!: Sequelize.BelongsToManySetAssociationsMixin<features, featuresId>;
  addFeature_id_feature!: Sequelize.BelongsToManyAddAssociationMixin<features, featuresId>;
  addFeature_id_features!: Sequelize.BelongsToManyAddAssociationsMixin<features, featuresId>;
  createFeature_id_feature!: Sequelize.BelongsToManyCreateAssociationMixin<features>;
  removeFeature_id_feature!: Sequelize.BelongsToManyRemoveAssociationMixin<features, featuresId>;
  removeFeature_id_features!: Sequelize.BelongsToManyRemoveAssociationsMixin<features, featuresId>;
  hasFeature_id_feature!: Sequelize.BelongsToManyHasAssociationMixin<features, featuresId>;
  hasFeature_id_features!: Sequelize.BelongsToManyHasAssociationsMixin<features, featuresId>;
  countFeature_id_features!: Sequelize.BelongsToManyCountAssociationsMixin;
  // users hasMany loan_applications via requester_id
  loan_applications!: loan_applications[];
  getLoan_applications!: Sequelize.HasManyGetAssociationsMixin<loan_applications>;
  setLoan_applications!: Sequelize.HasManySetAssociationsMixin<loan_applications, loan_applicationsId>;
  addLoan_application!: Sequelize.HasManyAddAssociationMixin<loan_applications, loan_applicationsId>;
  addLoan_applications!: Sequelize.HasManyAddAssociationsMixin<loan_applications, loan_applicationsId>;
  createLoan_application!: Sequelize.HasManyCreateAssociationMixin<loan_applications>;
  removeLoan_application!: Sequelize.HasManyRemoveAssociationMixin<loan_applications, loan_applicationsId>;
  removeLoan_applications!: Sequelize.HasManyRemoveAssociationsMixin<loan_applications, loan_applicationsId>;
  hasLoan_application!: Sequelize.HasManyHasAssociationMixin<loan_applications, loan_applicationsId>;
  hasLoan_applications!: Sequelize.HasManyHasAssociationsMixin<loan_applications, loan_applicationsId>;
  countLoan_applications!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany loan_applications via approver_id
  approver_loan_applications!: loan_applications[];
  getApprover_loan_applications!: Sequelize.HasManyGetAssociationsMixin<loan_applications>;
  setApprover_loan_applications!: Sequelize.HasManySetAssociationsMixin<loan_applications, loan_applicationsId>;
  addApprover_loan_application!: Sequelize.HasManyAddAssociationMixin<loan_applications, loan_applicationsId>;
  addApprover_loan_applications!: Sequelize.HasManyAddAssociationsMixin<loan_applications, loan_applicationsId>;
  createApprover_loan_application!: Sequelize.HasManyCreateAssociationMixin<loan_applications>;
  removeApprover_loan_application!: Sequelize.HasManyRemoveAssociationMixin<loan_applications, loan_applicationsId>;
  removeApprover_loan_applications!: Sequelize.HasManyRemoveAssociationsMixin<loan_applications, loan_applicationsId>;
  hasApprover_loan_application!: Sequelize.HasManyHasAssociationMixin<loan_applications, loan_applicationsId>;
  hasApprover_loan_applications!: Sequelize.HasManyHasAssociationsMixin<loan_applications, loan_applicationsId>;
  countApprover_loan_applications!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany loan_approval_logs via performed_by
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
  // users hasMany loan_basic_verifications via verified_by
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
  // users hasMany loan_call_verifications via called_by
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
  // users hasMany loan_cib_checks via checked_by
  loan_cib_checks!: loan_cib_checks[];
  getLoan_cib_checks!: Sequelize.HasManyGetAssociationsMixin<loan_cib_checks>;
  setLoan_cib_checks!: Sequelize.HasManySetAssociationsMixin<loan_cib_checks, loan_cib_checksId>;
  addLoan_cib_check!: Sequelize.HasManyAddAssociationMixin<loan_cib_checks, loan_cib_checksId>;
  addLoan_cib_checks!: Sequelize.HasManyAddAssociationsMixin<loan_cib_checks, loan_cib_checksId>;
  createLoan_cib_check!: Sequelize.HasManyCreateAssociationMixin<loan_cib_checks>;
  removeLoan_cib_check!: Sequelize.HasManyRemoveAssociationMixin<loan_cib_checks, loan_cib_checksId>;
  removeLoan_cib_checks!: Sequelize.HasManyRemoveAssociationsMixin<loan_cib_checks, loan_cib_checksId>;
  hasLoan_cib_check!: Sequelize.HasManyHasAssociationMixin<loan_cib_checks, loan_cib_checksId>;
  hasLoan_cib_checks!: Sequelize.HasManyHasAssociationsMixin<loan_cib_checks, loan_cib_checksId>;
  countLoan_cib_checks!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany loan_contract via created_by
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
  // users hasMany loan_contract via updated_by
  updated_by_loan_contracts!: loan_contract[];
  getUpdated_by_loan_contracts!: Sequelize.HasManyGetAssociationsMixin<loan_contract>;
  setUpdated_by_loan_contracts!: Sequelize.HasManySetAssociationsMixin<loan_contract, loan_contractId>;
  addUpdated_by_loan_contract!: Sequelize.HasManyAddAssociationMixin<loan_contract, loan_contractId>;
  addUpdated_by_loan_contracts!: Sequelize.HasManyAddAssociationsMixin<loan_contract, loan_contractId>;
  createUpdated_by_loan_contract!: Sequelize.HasManyCreateAssociationMixin<loan_contract>;
  removeUpdated_by_loan_contract!: Sequelize.HasManyRemoveAssociationMixin<loan_contract, loan_contractId>;
  removeUpdated_by_loan_contracts!: Sequelize.HasManyRemoveAssociationsMixin<loan_contract, loan_contractId>;
  hasUpdated_by_loan_contract!: Sequelize.HasManyHasAssociationMixin<loan_contract, loan_contractId>;
  hasUpdated_by_loan_contracts!: Sequelize.HasManyHasAssociationsMixin<loan_contract, loan_contractId>;
  countUpdated_by_loan_contracts!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany loan_field_visits via visited_by
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
  // users hasMany loan_income_assessments via assessed_by
  loan_income_assessments!: loan_income_assessments[];
  getLoan_income_assessments!: Sequelize.HasManyGetAssociationsMixin<loan_income_assessments>;
  setLoan_income_assessments!: Sequelize.HasManySetAssociationsMixin<loan_income_assessments, loan_income_assessmentsId>;
  addLoan_income_assessment!: Sequelize.HasManyAddAssociationMixin<loan_income_assessments, loan_income_assessmentsId>;
  addLoan_income_assessments!: Sequelize.HasManyAddAssociationsMixin<loan_income_assessments, loan_income_assessmentsId>;
  createLoan_income_assessment!: Sequelize.HasManyCreateAssociationMixin<loan_income_assessments>;
  removeLoan_income_assessment!: Sequelize.HasManyRemoveAssociationMixin<loan_income_assessments, loan_income_assessmentsId>;
  removeLoan_income_assessments!: Sequelize.HasManyRemoveAssociationsMixin<loan_income_assessments, loan_income_assessmentsId>;
  hasLoan_income_assessment!: Sequelize.HasManyHasAssociationMixin<loan_income_assessments, loan_income_assessmentsId>;
  hasLoan_income_assessments!: Sequelize.HasManyHasAssociationsMixin<loan_income_assessments, loan_income_assessmentsId>;
  countLoan_income_assessments!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany partners via user_id
  partners!: partners[];
  getPartners!: Sequelize.HasManyGetAssociationsMixin<partners>;
  setPartners!: Sequelize.HasManySetAssociationsMixin<partners, partnersId>;
  addPartner!: Sequelize.HasManyAddAssociationMixin<partners, partnersId>;
  addPartners!: Sequelize.HasManyAddAssociationsMixin<partners, partnersId>;
  createPartner!: Sequelize.HasManyCreateAssociationMixin<partners>;
  removePartner!: Sequelize.HasManyRemoveAssociationMixin<partners, partnersId>;
  removePartners!: Sequelize.HasManyRemoveAssociationsMixin<partners, partnersId>;
  hasPartner!: Sequelize.HasManyHasAssociationMixin<partners, partnersId>;
  hasPartners!: Sequelize.HasManyHasAssociationsMixin<partners, partnersId>;
  countPartners!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany payment_transactions via recorded_by
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
  // users hasMany promotions via created_by
  promotions!: promotions[];
  getPromotions!: Sequelize.HasManyGetAssociationsMixin<promotions>;
  setPromotions!: Sequelize.HasManySetAssociationsMixin<promotions, promotionsId>;
  addPromotion!: Sequelize.HasManyAddAssociationMixin<promotions, promotionsId>;
  addPromotions!: Sequelize.HasManyAddAssociationsMixin<promotions, promotionsId>;
  createPromotion!: Sequelize.HasManyCreateAssociationMixin<promotions>;
  removePromotion!: Sequelize.HasManyRemoveAssociationMixin<promotions, promotionsId>;
  removePromotions!: Sequelize.HasManyRemoveAssociationsMixin<promotions, promotionsId>;
  hasPromotion!: Sequelize.HasManyHasAssociationMixin<promotions, promotionsId>;
  hasPromotions!: Sequelize.HasManyHasAssociationsMixin<promotions, promotionsId>;
  countPromotions!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany repayment_schedules via approved_by
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
  // users hasMany repayment_schedules via created_by
  created_by_repayment_schedules!: repayment_schedules[];
  getCreated_by_repayment_schedules!: Sequelize.HasManyGetAssociationsMixin<repayment_schedules>;
  setCreated_by_repayment_schedules!: Sequelize.HasManySetAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  addCreated_by_repayment_schedule!: Sequelize.HasManyAddAssociationMixin<repayment_schedules, repayment_schedulesId>;
  addCreated_by_repayment_schedules!: Sequelize.HasManyAddAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  createCreated_by_repayment_schedule!: Sequelize.HasManyCreateAssociationMixin<repayment_schedules>;
  removeCreated_by_repayment_schedule!: Sequelize.HasManyRemoveAssociationMixin<repayment_schedules, repayment_schedulesId>;
  removeCreated_by_repayment_schedules!: Sequelize.HasManyRemoveAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  hasCreated_by_repayment_schedule!: Sequelize.HasManyHasAssociationMixin<repayment_schedules, repayment_schedulesId>;
  hasCreated_by_repayment_schedules!: Sequelize.HasManyHasAssociationsMixin<repayment_schedules, repayment_schedulesId>;
  countCreated_by_repayment_schedules!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany user_permissions via user_id
  user_permissions!: user_permissions[];
  getUser_permissions!: Sequelize.HasManyGetAssociationsMixin<user_permissions>;
  setUser_permissions!: Sequelize.HasManySetAssociationsMixin<user_permissions, user_permissionsId>;
  addUser_permission!: Sequelize.HasManyAddAssociationMixin<user_permissions, user_permissionsId>;
  addUser_permissions!: Sequelize.HasManyAddAssociationsMixin<user_permissions, user_permissionsId>;
  createUser_permission!: Sequelize.HasManyCreateAssociationMixin<user_permissions>;
  removeUser_permission!: Sequelize.HasManyRemoveAssociationMixin<user_permissions, user_permissionsId>;
  removeUser_permissions!: Sequelize.HasManyRemoveAssociationsMixin<user_permissions, user_permissionsId>;
  hasUser_permission!: Sequelize.HasManyHasAssociationMixin<user_permissions, user_permissionsId>;
  hasUser_permissions!: Sequelize.HasManyHasAssociationsMixin<user_permissions, user_permissionsId>;
  countUser_permissions!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany user_refresh_tokens via user_id
  user_refresh_tokens!: user_refresh_tokens[];
  getUser_refresh_tokens!: Sequelize.HasManyGetAssociationsMixin<user_refresh_tokens>;
  setUser_refresh_tokens!: Sequelize.HasManySetAssociationsMixin<user_refresh_tokens, user_refresh_tokensId>;
  addUser_refresh_token!: Sequelize.HasManyAddAssociationMixin<user_refresh_tokens, user_refresh_tokensId>;
  addUser_refresh_tokens!: Sequelize.HasManyAddAssociationsMixin<user_refresh_tokens, user_refresh_tokensId>;
  createUser_refresh_token!: Sequelize.HasManyCreateAssociationMixin<user_refresh_tokens>;
  removeUser_refresh_token!: Sequelize.HasManyRemoveAssociationMixin<user_refresh_tokens, user_refresh_tokensId>;
  removeUser_refresh_tokens!: Sequelize.HasManyRemoveAssociationsMixin<user_refresh_tokens, user_refresh_tokensId>;
  hasUser_refresh_token!: Sequelize.HasManyHasAssociationMixin<user_refresh_tokens, user_refresh_tokensId>;
  hasUser_refresh_tokens!: Sequelize.HasManyHasAssociationsMixin<user_refresh_tokens, user_refresh_tokensId>;
  countUser_refresh_tokens!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof users {
    return users.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "username"
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin','staff','partner','customer'),
      allowNull: false
    },
    staff_level: {
      type: DataTypes.ENUM('approver','sales','credit_officer','credit_manager','deputy_director','director','none'),
      allowNull: true,
      defaultValue: "none"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'users',
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
        name: "username",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "username" },
        ]
      },
    ]
  });
  }
}
