import type { Sequelize } from "sequelize";
import { application_documents as _application_documents } from "./application_documents";
import type { application_documentsAttributes, application_documentsCreationAttributes } from "./application_documents";
import { cus_requestform as _cus_requestform } from "./cus_requestform";
import type { cus_requestformAttributes, cus_requestformCreationAttributes } from "./cus_requestform";
import { customer_locations as _customer_locations } from "./customer_locations";
import type { customer_locationsAttributes, customer_locationsCreationAttributes } from "./customer_locations";
import { customer_work_info as _customer_work_info } from "./customer_work_info";
import type { customer_work_infoAttributes, customer_work_infoCreationAttributes } from "./customer_work_info";
import { customers as _customers } from "./customers";
import type { customersAttributes, customersCreationAttributes } from "./customers";
import { delivery_receipts as _delivery_receipts } from "./delivery_receipts";
import type { delivery_receiptsAttributes, delivery_receiptsCreationAttributes } from "./delivery_receipts";
import { features as _features } from "./features";
import type { featuresAttributes, featuresCreationAttributes } from "./features";
import { loan_applications as _loan_applications } from "./loan_applications";
import type { loan_applicationsAttributes, loan_applicationsCreationAttributes } from "./loan_applications";
import { loan_approval_logs as _loan_approval_logs } from "./loan_approval_logs";
import type { loan_approval_logsAttributes, loan_approval_logsCreationAttributes } from "./loan_approval_logs";
import { loan_basic_verifications as _loan_basic_verifications } from "./loan_basic_verifications";
import type { loan_basic_verificationsAttributes, loan_basic_verificationsCreationAttributes } from "./loan_basic_verifications";
import { loan_call_verifications as _loan_call_verifications } from "./loan_call_verifications";
import type { loan_call_verificationsAttributes, loan_call_verificationsCreationAttributes } from "./loan_call_verifications";
import { loan_cib_checks as _loan_cib_checks } from "./loan_cib_checks";
import type { loan_cib_checksAttributes, loan_cib_checksCreationAttributes } from "./loan_cib_checks";
import { loan_contract as _loan_contract } from "./loan_contract";
import type { loan_contractAttributes, loan_contractCreationAttributes } from "./loan_contract";
import { loan_field_visits as _loan_field_visits } from "./loan_field_visits";
import type { loan_field_visitsAttributes, loan_field_visitsCreationAttributes } from "./loan_field_visits";
import { loan_guarantors as _loan_guarantors } from "./loan_guarantors";
import type { loan_guarantorsAttributes, loan_guarantorsCreationAttributes } from "./loan_guarantors";
import { loan_income_assessments as _loan_income_assessments } from "./loan_income_assessments";
import type { loan_income_assessmentsAttributes, loan_income_assessmentsCreationAttributes } from "./loan_income_assessments";
import { loan_payments as _loan_payments } from "./loan_payments";
import type { loan_paymentsAttributes, loan_paymentsCreationAttributes } from "./loan_payments";
import { partners as _partners } from "./partners";
import type { partnersAttributes, partnersCreationAttributes } from "./partners";
import { payment_transactions as _payment_transactions } from "./payment_transactions";
import type { payment_transactionsAttributes, payment_transactionsCreationAttributes } from "./payment_transactions";
import { product_gallery as _product_gallery } from "./product_gallery";
import type { product_galleryAttributes, product_galleryCreationAttributes } from "./product_gallery";
import { product_types as _product_types } from "./product_types";
import type { product_typesAttributes, product_typesCreationAttributes } from "./product_types";
import { products as _products } from "./products";
import type { productsAttributes, productsCreationAttributes } from "./products";
import { promotions as _promotions } from "./promotions";
import type { promotionsAttributes, promotionsCreationAttributes } from "./promotions";
import { repayments as _repayments } from "./repayments";
import type { repaymentsAttributes, repaymentsCreationAttributes } from "./repayments";
import { user_permissions as _user_permissions } from "./user_permissions";
import type { user_permissionsAttributes, user_permissionsCreationAttributes } from "./user_permissions";
import { user_refresh_tokens as _user_refresh_tokens } from "./user_refresh_tokens";
import type { user_refresh_tokensAttributes, user_refresh_tokensCreationAttributes } from "./user_refresh_tokens";
import { users as _users } from "./users";
import type { usersAttributes, usersCreationAttributes } from "./users";
import connect from "../config/db.config";
import { sequelize } from "../config/db.config";

export {
  _application_documents as application_documents,
  _cus_requestform as cus_requestform,
  _customer_locations as customer_locations,
  _customer_work_info as customer_work_info,
  _customers as customers,
  _delivery_receipts as delivery_receipts,
  _features as features,
  _loan_applications as loan_applications,
  _loan_approval_logs as loan_approval_logs,
  _loan_basic_verifications as loan_basic_verifications,
  _loan_call_verifications as loan_call_verifications,
  _loan_cib_checks as loan_cib_checks,
  _loan_contract as loan_contract,
  _loan_field_visits as loan_field_visits,
  _loan_guarantors as loan_guarantors,
  _loan_income_assessments as loan_income_assessments,
  _loan_payments as loan_payments,
  _partners as partners,
  _payment_transactions as payment_transactions,
  _product_gallery as product_gallery,
  _product_types as product_types,
  _products as products,
  _promotions as promotions,
  _repayments as repayments,
  _user_permissions as user_permissions,
  _user_refresh_tokens as user_refresh_tokens,
  _users as users,
};

export type {
  sequelize,
  application_documentsAttributes,
  application_documentsCreationAttributes,
  cus_requestformAttributes,
  cus_requestformCreationAttributes,
  customer_locationsAttributes,
  customer_locationsCreationAttributes,
  customer_work_infoAttributes,
  customer_work_infoCreationAttributes,
  customersAttributes,
  customersCreationAttributes,
  delivery_receiptsAttributes,
  delivery_receiptsCreationAttributes,
  featuresAttributes,
  featuresCreationAttributes,
  loan_applicationsAttributes,
  loan_applicationsCreationAttributes,
  loan_approval_logsAttributes,
  loan_approval_logsCreationAttributes,
  loan_basic_verificationsAttributes,
  loan_basic_verificationsCreationAttributes,
  loan_call_verificationsAttributes,
  loan_call_verificationsCreationAttributes,
  loan_cib_checksAttributes,
  loan_cib_checksCreationAttributes,
  loan_contractAttributes,
  loan_contractCreationAttributes,
  loan_field_visitsAttributes,
  loan_field_visitsCreationAttributes,
  loan_guarantorsAttributes,
  loan_guarantorsCreationAttributes,
  loan_income_assessmentsAttributes,
  loan_income_assessmentsCreationAttributes,
  loan_paymentsAttributes,
  loan_paymentsCreationAttributes,
  partnersAttributes,
  partnersCreationAttributes,
  payment_transactionsAttributes,
  payment_transactionsCreationAttributes,
  product_galleryAttributes,
  product_galleryCreationAttributes,
  product_typesAttributes,
  product_typesCreationAttributes,
  productsAttributes,
  productsCreationAttributes,
  promotionsAttributes,
  promotionsCreationAttributes,
  repaymentsAttributes,
  repaymentsCreationAttributes,
  user_permissionsAttributes,
  user_permissionsCreationAttributes,
  user_refresh_tokensAttributes,
  user_refresh_tokensCreationAttributes,
  usersAttributes,
  usersCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const application_documents = _application_documents.initModel(sequelize);
  const cus_requestform = _cus_requestform.initModel(sequelize);
  const customer_locations = _customer_locations.initModel(sequelize);
  const customer_work_info = _customer_work_info.initModel(sequelize);
  const customers = _customers.initModel(sequelize);
  const delivery_receipts = _delivery_receipts.initModel(sequelize);
  const features = _features.initModel(sequelize);
  const loan_applications = _loan_applications.initModel(sequelize);
  const loan_approval_logs = _loan_approval_logs.initModel(sequelize);
  const loan_basic_verifications = _loan_basic_verifications.initModel(sequelize);
  const loan_call_verifications = _loan_call_verifications.initModel(sequelize);
  const loan_cib_checks = _loan_cib_checks.initModel(sequelize);
  const loan_contract = _loan_contract.initModel(sequelize);
  const loan_field_visits = _loan_field_visits.initModel(sequelize);
  const loan_guarantors = _loan_guarantors.initModel(sequelize);
  const loan_income_assessments = _loan_income_assessments.initModel(sequelize);
  const loan_payments = _loan_payments.initModel(sequelize);
  const partners = _partners.initModel(sequelize);
  const payment_transactions = _payment_transactions.initModel(sequelize);
  const product_gallery = _product_gallery.initModel(sequelize);
  const product_types = _product_types.initModel(sequelize);
  const products = _products.initModel(sequelize);
  const promotions = _promotions.initModel(sequelize);
  const repayments = _repayments.initModel(sequelize);
  const user_permissions = _user_permissions.initModel(sequelize);
  const user_refresh_tokens = _user_refresh_tokens.initModel(sequelize);
  const users = _users.initModel(sequelize);

  features.belongsToMany(users, { as: 'user_id_users', through: user_permissions, foreignKey: "feature_id", otherKey: "user_id" });
  users.belongsToMany(features, { as: 'feature_id_features', through: user_permissions, foreignKey: "user_id", otherKey: "feature_id" });
  cus_requestform.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "customer_id"});
  customer_locations.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(customer_locations, { as: "customer_locations", foreignKey: "customer_id"});
  customer_work_info.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(customer_work_info, { as: "customer_work_infos", foreignKey: "customer_id"});
  loan_applications.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(loan_applications, { as: "loan_applications", foreignKey: "customer_id"});
  user_permissions.belongsTo(features, { as: "feature", foreignKey: "feature_id"});
  features.hasMany(user_permissions, { as: "user_permissions", foreignKey: "feature_id"});
  application_documents.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(application_documents, { as: "application_documents", foreignKey: "application_id"});
  cus_requestform.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "application_id"});
  delivery_receipts.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(delivery_receipts, { as: "delivery_receipts", foreignKey: "application_id"});
  loan_approval_logs.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_approval_logs, { as: "loan_approval_logs", foreignKey: "application_id"});
  loan_basic_verifications.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_basic_verifications, { as: "loan_basic_verifications", foreignKey: "application_id"});
  loan_call_verifications.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_call_verifications, { as: "loan_call_verifications", foreignKey: "application_id"});
  loan_cib_checks.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasOne(loan_cib_checks, { as: "loan_cib_check", foreignKey: "application_id"});
  loan_contract.belongsTo(loan_applications, { as: "loan", foreignKey: "loan_id"});
  loan_applications.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "loan_id"});
  loan_field_visits.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_field_visits, { as: "loan_field_visits", foreignKey: "application_id"});
  loan_guarantors.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_guarantors, { as: "loan_guarantors", foreignKey: "application_id"});
  loan_income_assessments.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasOne(loan_income_assessments, { as: "loan_income_assessment", foreignKey: "application_id"});
  loan_payments.belongsTo(loan_applications, { as: "loan_application", foreignKey: "loan_application_id"});
  loan_applications.hasMany(loan_payments, { as: "loan_payments", foreignKey: "loan_application_id"});
  payment_transactions.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "application_id"});
  repayments.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(repayments, { as: "repayments", foreignKey: "application_id"});
  loan_contract.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "partner_id"});
  loan_payments.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(loan_payments, { as: "loan_payments", foreignKey: "partner_id"});
  product_types.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(product_types, { as: "product_types", foreignKey: "partner_id"});
  products.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(products, { as: "products", foreignKey: "partner_id"});
  loan_contract.belongsTo(product_types, { as: "producttype", foreignKey: "producttype_id"});
  product_types.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "producttype_id"});
  products.belongsTo(product_types, { as: "productType", foreignKey: "productType_id"});
  product_types.hasMany(products, { as: "products", foreignKey: "productType_id"});
  loan_applications.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(loan_applications, { as: "loan_applications", foreignKey: "product_id"});
  product_gallery.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(product_gallery, { as: "product_galleries", foreignKey: "product_id"});
  payment_transactions.belongsTo(repayments, { as: "schedule", foreignKey: "schedule_id"});
  repayments.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "schedule_id"});
  application_documents.belongsTo(users, { as: "uploaded_by_user", foreignKey: "uploaded_by"});
  users.hasMany(application_documents, { as: "application_documents", foreignKey: "uploaded_by"});
  customers.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(customers, { as: "customers", foreignKey: "user_id"});
  delivery_receipts.belongsTo(users, { as: "approver", foreignKey: "approver_id"});
  users.hasMany(delivery_receipts, { as: "delivery_receipts", foreignKey: "approver_id"});
  loan_applications.belongsTo(users, { as: "requester", foreignKey: "requester_id"});
  users.hasMany(loan_applications, { as: "loan_applications", foreignKey: "requester_id"});
  loan_applications.belongsTo(users, { as: "approver", foreignKey: "approver_id"});
  users.hasMany(loan_applications, { as: "approver_loan_applications", foreignKey: "approver_id"});
  loan_approval_logs.belongsTo(users, { as: "performed_by_user", foreignKey: "performed_by"});
  users.hasMany(loan_approval_logs, { as: "loan_approval_logs", foreignKey: "performed_by"});
  loan_basic_verifications.belongsTo(users, { as: "verified_by_user", foreignKey: "verified_by"});
  users.hasMany(loan_basic_verifications, { as: "loan_basic_verifications", foreignKey: "verified_by"});
  loan_call_verifications.belongsTo(users, { as: "called_by_user", foreignKey: "called_by"});
  users.hasMany(loan_call_verifications, { as: "loan_call_verifications", foreignKey: "called_by"});
  loan_cib_checks.belongsTo(users, { as: "checked_by_user", foreignKey: "checked_by"});
  users.hasMany(loan_cib_checks, { as: "loan_cib_checks", foreignKey: "checked_by"});
  loan_field_visits.belongsTo(users, { as: "visited_by_user", foreignKey: "visited_by"});
  users.hasMany(loan_field_visits, { as: "loan_field_visits", foreignKey: "visited_by"});
  loan_income_assessments.belongsTo(users, { as: "assessed_by_user", foreignKey: "assessed_by"});
  users.hasMany(loan_income_assessments, { as: "loan_income_assessments", foreignKey: "assessed_by"});
  partners.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(partners, { as: "partners", foreignKey: "user_id"});
  payment_transactions.belongsTo(users, { as: "recorded_by_user", foreignKey: "recorded_by"});
  users.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "recorded_by"});
  promotions.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(promotions, { as: "promotions", foreignKey: "created_by"});
  user_permissions.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_permissions, { as: "user_permissions", foreignKey: "user_id"});
  user_refresh_tokens.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_refresh_tokens, { as: "user_refresh_tokens", foreignKey: "user_id"});

  return {
    sequelize: sequelize,
    application_documents: application_documents,
    cus_requestform: cus_requestform,
    customer_locations: customer_locations,
    customer_work_info: customer_work_info,
    customers: customers,
    delivery_receipts: delivery_receipts,
    features: features,
    loan_applications: loan_applications,
    loan_approval_logs: loan_approval_logs,
    loan_basic_verifications: loan_basic_verifications,
    loan_call_verifications: loan_call_verifications,
    loan_cib_checks: loan_cib_checks,
    loan_contract: loan_contract,
    loan_field_visits: loan_field_visits,
    loan_guarantors: loan_guarantors,
    loan_income_assessments: loan_income_assessments,
    loan_payments: loan_payments,
    partners: partners,
    payment_transactions: payment_transactions,
    product_gallery: product_gallery,
    product_types: product_types,
    products: products,
    promotions: promotions,
    repayments: repayments,
    user_permissions: user_permissions,
    user_refresh_tokens: user_refresh_tokens,
    users: users,
  };
}

export const db = initModels(connect);