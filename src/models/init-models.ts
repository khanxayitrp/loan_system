import type { Sequelize } from "sequelize";
import { application_documents as _application_documents } from "./application_documents";
import type { application_documentsAttributes, application_documentsCreationAttributes } from "./application_documents";
import { customers as _customers } from "./customers";
import type { customersAttributes, customersCreationAttributes } from "./customers";
import { features as _features } from "./features";
import type { featuresAttributes, featuresCreationAttributes } from "./features";
import { loan_applications as _loan_applications } from "./loan_applications";
import type { loan_applicationsAttributes, loan_applicationsCreationAttributes } from "./loan_applications";
import { partners as _partners } from "./partners";
import type { partnersAttributes, partnersCreationAttributes } from "./partners";
import { payment_transactions as _payment_transactions } from "./payment_transactions";
import type { payment_transactionsAttributes, payment_transactionsCreationAttributes } from "./payment_transactions";
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
import {sequelize} from "../config/db.config";

export {
  _application_documents as application_documents,
  _customers as customers,
  _features as features,
  _loan_applications as loan_applications,
  _partners as partners,
  _payment_transactions as payment_transactions,
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
  customersAttributes,
  customersCreationAttributes,
  featuresAttributes,
  featuresCreationAttributes,
  loan_applicationsAttributes,
  loan_applicationsCreationAttributes,
  partnersAttributes,
  partnersCreationAttributes,
  payment_transactionsAttributes,
  payment_transactionsCreationAttributes,
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
  const customers = _customers.initModel(sequelize);
  const features = _features.initModel(sequelize);
  const loan_applications = _loan_applications.initModel(sequelize);
  const partners = _partners.initModel(sequelize);
  const payment_transactions = _payment_transactions.initModel(sequelize);
  const product_types = _product_types.initModel(sequelize);
  const products = _products.initModel(sequelize);
  const promotions = _promotions.initModel(sequelize);
  const repayments = _repayments.initModel(sequelize);
  const user_permissions = _user_permissions.initModel(sequelize);
  const user_refresh_tokens = _user_refresh_tokens.initModel(sequelize);
  const users = _users.initModel(sequelize);

  features.belongsToMany(users, { as: 'user_id_users', through: user_permissions, foreignKey: "feature_id", otherKey: "user_id" });
  users.belongsToMany(features, { as: 'feature_id_features', through: user_permissions, foreignKey: "user_id", otherKey: "feature_id" });
  loan_applications.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(loan_applications, { as: "loan_applications", foreignKey: "customer_id"});
  user_permissions.belongsTo(features, { as: "feature", foreignKey: "feature_id"});
  features.hasMany(user_permissions, { as: "user_permissions", foreignKey: "feature_id"});
  application_documents.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(application_documents, { as: "application_documents", foreignKey: "application_id"});
  payment_transactions.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "application_id"});
  repayments.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(repayments, { as: "repayments", foreignKey: "application_id"});
  product_types.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(product_types, { as: "product_types", foreignKey: "partner_id"});
  products.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(products, { as: "products", foreignKey: "partner_id"});
  products.belongsTo(product_types, { as: "product_type", foreignKey: "product_type_id"});
  product_types.hasMany(products, { as: "products", foreignKey: "product_type_id"});
  loan_applications.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(loan_applications, { as: "loan_applications", foreignKey: "product_id"});
  payment_transactions.belongsTo(repayments, { as: "schedule", foreignKey: "schedule_id"});
  repayments.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "schedule_id"});
  customers.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(customers, { as: "customers", foreignKey: "user_id"});
  loan_applications.belongsTo(users, { as: "requester", foreignKey: "requester_id"});
  users.hasMany(loan_applications, { as: "loan_applications", foreignKey: "requester_id"});
  loan_applications.belongsTo(users, { as: "approver", foreignKey: "approver_id"});
  users.hasMany(loan_applications, { as: "approver_loan_applications", foreignKey: "approver_id"});
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
    customers: customers,
    features: features,
    loan_applications: loan_applications,
    partners: partners,
    payment_transactions: payment_transactions,
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
