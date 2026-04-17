import type { Sequelize } from "sequelize";
import { application_documents as _application_documents } from "./application_documents";
import type { application_documentsAttributes, application_documentsCreationAttributes } from "./application_documents";
import { audit_logs as _audit_logs } from "./audit_logs";
import type { audit_logsAttributes, audit_logsCreationAttributes } from "./audit_logs";
import { cart_items as _cart_items } from "./cart_items";
import type { cart_itemsAttributes, cart_itemsCreationAttributes } from "./cart_items";
import { carts as _carts } from "./carts";
import type { cartsAttributes, cartsCreationAttributes } from "./carts";
import { credit_ledgers as _credit_ledgers } from "./credit_ledgers";
import type { credit_ledgersAttributes, credit_ledgersCreationAttributes } from "./credit_ledgers";
import { cus_requestform as _cus_requestform } from "./cus_requestform";
import type { cus_requestformAttributes, cus_requestformCreationAttributes } from "./cus_requestform";
import { customer_credits as _customer_credits } from "./customer_credits";
import type { customer_creditsAttributes, customer_creditsCreationAttributes } from "./customer_credits";
import { customer_documents as _customer_documents } from "./customer_documents";
import type { customer_documentsAttributes, customer_documentsCreationAttributes } from "./customer_documents";
import { customer_locations as _customer_locations } from "./customer_locations";
import type { customer_locationsAttributes, customer_locationsCreationAttributes } from "./customer_locations";
import { customer_points as _customer_points } from "./customer_points";
import type { customer_pointsAttributes, customer_pointsCreationAttributes } from "./customer_points";
import { customer_vouchers as _customer_vouchers } from "./customer_vouchers";
import type { customer_vouchersAttributes, customer_vouchersCreationAttributes } from "./customer_vouchers";
import { customer_work_info as _customer_work_info } from "./customer_work_info";
import type { customer_work_infoAttributes, customer_work_infoCreationAttributes } from "./customer_work_info";
import { customers as _customers } from "./customers";
import type { customersAttributes, customersCreationAttributes } from "./customers";
import { delivery_receipts as _delivery_receipts } from "./delivery_receipts";
import type { delivery_receiptsAttributes, delivery_receiptsCreationAttributes } from "./delivery_receipts";
import { districts as _districts } from "./districts";
import type { districtsAttributes, districtsCreationAttributes } from "./districts";
import { document_signatures as _document_signatures } from "./document_signatures";
import type { document_signaturesAttributes, document_signaturesCreationAttributes } from "./document_signatures";
import { features as _features } from "./features";
import type { featuresAttributes, featuresCreationAttributes } from "./features";
import { global_categories as _global_categories } from "./global_categories";
import type { global_categoriesAttributes, global_categoriesCreationAttributes } from "./global_categories";
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
import { loan_cib_history_details as _loan_cib_history_details } from "./loan_cib_history_details";
import type { loan_cib_history_detailsAttributes, loan_cib_history_detailsCreationAttributes } from "./loan_cib_history_details";
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
import { order_items as _order_items } from "./order_items";
import type { order_itemsAttributes, order_itemsCreationAttributes } from "./order_items";
import { orders as _orders } from "./orders";
import type { ordersAttributes, ordersCreationAttributes } from "./orders";
import { partners as _partners } from "./partners";
import type { partnersAttributes, partnersCreationAttributes } from "./partners";
import { payment_transactions as _payment_transactions } from "./payment_transactions";
import type { payment_transactionsAttributes, payment_transactionsCreationAttributes } from "./payment_transactions";
import { point_ledgers as _point_ledgers } from "./point_ledgers";
import type { point_ledgersAttributes, point_ledgersCreationAttributes } from "./point_ledgers";
import { product_gallery as _product_gallery } from "./product_gallery";
import type { product_galleryAttributes, product_galleryCreationAttributes } from "./product_gallery";
import { product_reviews as _product_reviews } from "./product_reviews";
import type { product_reviewsAttributes, product_reviewsCreationAttributes } from "./product_reviews";
import { product_types as _product_types } from "./product_types";
import type { product_typesAttributes, product_typesCreationAttributes } from "./product_types";
import { product_variants as _product_variants } from "./product_variants";
import type { product_variantsAttributes, product_variantsCreationAttributes } from "./product_variants";
import { products as _products } from "./products";
import type { productsAttributes, productsCreationAttributes } from "./products";
import { promotions as _promotions } from "./promotions";
import type { promotionsAttributes, promotionsCreationAttributes } from "./promotions";
import { provinces as _provinces } from "./provinces";
import type { provincesAttributes, provincesCreationAttributes } from "./provinces";
import { repayment_schedules as _repayment_schedules } from "./repayment_schedules";
import type { repayment_schedulesAttributes, repayment_schedulesCreationAttributes } from "./repayment_schedules";
import { repayments as _repayments } from "./repayments";
import type { repaymentsAttributes, repaymentsCreationAttributes } from "./repayments";
import { user_permissions as _user_permissions } from "./user_permissions";
import type { user_permissionsAttributes, user_permissionsCreationAttributes } from "./user_permissions";
import { user_refresh_tokens as _user_refresh_tokens } from "./user_refresh_tokens";
import type { user_refresh_tokensAttributes, user_refresh_tokensCreationAttributes } from "./user_refresh_tokens";
import { users as _users } from "./users";
import type { usersAttributes, usersCreationAttributes } from "./users";
import { vouchers as _vouchers } from "./vouchers";
import type { vouchersAttributes, vouchersCreationAttributes } from "./vouchers";
import { wishlists as _wishlists } from "./wishlists";
import type { wishlistsAttributes, wishlistsCreationAttributes } from "./wishlists";
import connect from "../config/db.config";
import { sequelize } from "../config/db.config";

export {
  _application_documents as application_documents,
  _audit_logs as audit_logs,
  _cart_items as cart_items,
  _carts as carts,
  _credit_ledgers as credit_ledgers,
  _cus_requestform as cus_requestform,
  _customer_credits as customer_credits,
  _customer_documents as customer_documents,
  _customer_locations as customer_locations,
  _customer_points as customer_points,
  _customer_vouchers as customer_vouchers,
  _customer_work_info as customer_work_info,
  _customers as customers,
  _delivery_receipts as delivery_receipts,
  _districts as districts,
  _document_signatures as document_signatures,
  _features as features,
  _global_categories as global_categories,
  _loan_applications as loan_applications,
  _loan_approval_logs as loan_approval_logs,
  _loan_basic_verifications as loan_basic_verifications,
  _loan_call_verifications as loan_call_verifications,
  _loan_cib_checks as loan_cib_checks,
  _loan_cib_history_details as loan_cib_history_details,
  _loan_contract as loan_contract,
  _loan_field_visits as loan_field_visits,
  _loan_guarantors as loan_guarantors,
  _loan_income_assessments as loan_income_assessments,
  _loan_payments as loan_payments,
  _order_items as order_items,
  _orders as orders,
  _partners as partners,
  _payment_transactions as payment_transactions,
  _point_ledgers as point_ledgers,
  _product_gallery as product_gallery,
  _product_reviews as product_reviews,
  _product_types as product_types,
  _product_variants as product_variants,
  _products as products,
  _promotions as promotions,
  _provinces as provinces,
  _repayment_schedules as repayment_schedules,
  _repayments as repayments,
  _user_permissions as user_permissions,
  _user_refresh_tokens as user_refresh_tokens,
  _users as users,
  _vouchers as vouchers,
  _wishlists as wishlists,
};

export type {
    sequelize,
  application_documentsAttributes,
  application_documentsCreationAttributes,
  audit_logsAttributes,
  audit_logsCreationAttributes,
  cart_itemsAttributes,
  cart_itemsCreationAttributes,
  cartsAttributes,
  cartsCreationAttributes,
  credit_ledgersAttributes,
  credit_ledgersCreationAttributes,
  cus_requestformAttributes,
  cus_requestformCreationAttributes,
  customer_creditsAttributes,
  customer_creditsCreationAttributes,
  customer_documentsAttributes,
  customer_documentsCreationAttributes,
  customer_locationsAttributes,
  customer_locationsCreationAttributes,
  customer_pointsAttributes,
  customer_pointsCreationAttributes,
  customer_vouchersAttributes,
  customer_vouchersCreationAttributes,
  customer_work_infoAttributes,
  customer_work_infoCreationAttributes,
  customersAttributes,
  customersCreationAttributes,
  delivery_receiptsAttributes,
  delivery_receiptsCreationAttributes,
  districtsAttributes,
  districtsCreationAttributes,
  document_signaturesAttributes,
  document_signaturesCreationAttributes,
  featuresAttributes,
  featuresCreationAttributes,
  global_categoriesAttributes,
  global_categoriesCreationAttributes,
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
  loan_cib_history_detailsAttributes,
  loan_cib_history_detailsCreationAttributes,
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
  order_itemsAttributes,
  order_itemsCreationAttributes,
  ordersAttributes,
  ordersCreationAttributes,
  partnersAttributes,
  partnersCreationAttributes,
  payment_transactionsAttributes,
  payment_transactionsCreationAttributes,
  point_ledgersAttributes,
  point_ledgersCreationAttributes,
  product_galleryAttributes,
  product_galleryCreationAttributes,
  product_reviewsAttributes,
  product_reviewsCreationAttributes,
  product_typesAttributes,
  product_typesCreationAttributes,
  product_variantsAttributes,
  product_variantsCreationAttributes,
  productsAttributes,
  productsCreationAttributes,
  promotionsAttributes,
  promotionsCreationAttributes,
  provincesAttributes,
  provincesCreationAttributes,
  repayment_schedulesAttributes,
  repayment_schedulesCreationAttributes,
  repaymentsAttributes,
  repaymentsCreationAttributes,
  user_permissionsAttributes,
  user_permissionsCreationAttributes,
  user_refresh_tokensAttributes,
  user_refresh_tokensCreationAttributes,
  usersAttributes,
  usersCreationAttributes,
  vouchersAttributes,
  vouchersCreationAttributes,
  wishlistsAttributes,
  wishlistsCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const application_documents = _application_documents.initModel(sequelize);
  const audit_logs = _audit_logs.initModel(sequelize);
  const cart_items = _cart_items.initModel(sequelize);
  const carts = _carts.initModel(sequelize);
  const credit_ledgers = _credit_ledgers.initModel(sequelize);
  const cus_requestform = _cus_requestform.initModel(sequelize);
  const customer_credits = _customer_credits.initModel(sequelize);
  const customer_documents = _customer_documents.initModel(sequelize);
  const customer_locations = _customer_locations.initModel(sequelize);
  const customer_points = _customer_points.initModel(sequelize);
  const customer_vouchers = _customer_vouchers.initModel(sequelize);
  const customer_work_info = _customer_work_info.initModel(sequelize);
  const customers = _customers.initModel(sequelize);
  const delivery_receipts = _delivery_receipts.initModel(sequelize);
  const districts = _districts.initModel(sequelize);
  const document_signatures = _document_signatures.initModel(sequelize);
  const features = _features.initModel(sequelize);
  const global_categories = _global_categories.initModel(sequelize);
  const loan_applications = _loan_applications.initModel(sequelize);
  const loan_approval_logs = _loan_approval_logs.initModel(sequelize);
  const loan_basic_verifications = _loan_basic_verifications.initModel(sequelize);
  const loan_call_verifications = _loan_call_verifications.initModel(sequelize);
  const loan_cib_checks = _loan_cib_checks.initModel(sequelize);
  const loan_cib_history_details = _loan_cib_history_details.initModel(sequelize);
  const loan_contract = _loan_contract.initModel(sequelize);
  const loan_field_visits = _loan_field_visits.initModel(sequelize);
  const loan_guarantors = _loan_guarantors.initModel(sequelize);
  const loan_income_assessments = _loan_income_assessments.initModel(sequelize);
  const loan_payments = _loan_payments.initModel(sequelize);
  const order_items = _order_items.initModel(sequelize);
  const orders = _orders.initModel(sequelize);
  const partners = _partners.initModel(sequelize);
  const payment_transactions = _payment_transactions.initModel(sequelize);
  const point_ledgers = _point_ledgers.initModel(sequelize);
  const product_gallery = _product_gallery.initModel(sequelize);
  const product_reviews = _product_reviews.initModel(sequelize);
  const product_types = _product_types.initModel(sequelize);
  const product_variants = _product_variants.initModel(sequelize);
  const products = _products.initModel(sequelize);
  const promotions = _promotions.initModel(sequelize);
  const provinces = _provinces.initModel(sequelize);
  const repayment_schedules = _repayment_schedules.initModel(sequelize);
  const repayments = _repayments.initModel(sequelize);
  const user_permissions = _user_permissions.initModel(sequelize);
  const user_refresh_tokens = _user_refresh_tokens.initModel(sequelize);
  const users = _users.initModel(sequelize);
  const vouchers = _vouchers.initModel(sequelize);
  const wishlists = _wishlists.initModel(sequelize);

  features.belongsToMany(users, { as: 'user_id_users', through: user_permissions, foreignKey: "feature_id", otherKey: "user_id" });
  users.belongsToMany(features, { as: 'feature_id_features', through: user_permissions, foreignKey: "user_id", otherKey: "feature_id" });
  cart_items.belongsTo(carts, { as: "cart", foreignKey: "cart_id"});
  carts.hasMany(cart_items, { as: "cart_items", foreignKey: "cart_id"});
  carts.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasOne(carts, { as: "cart", foreignKey: "customer_id"});
  credit_ledgers.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(credit_ledgers, { as: "credit_ledgers", foreignKey: "customer_id"});
  cus_requestform.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "customer_id"});
  customer_credits.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasOne(customer_credits, { as: "customer_credit", foreignKey: "customer_id"});
  customer_documents.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(customer_documents, { as: "customer_documents", foreignKey: "customer_id"});
  customer_locations.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(customer_locations, { as: "customer_locations", foreignKey: "customer_id"});
  customer_points.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasOne(customer_points, { as: "customer_point", foreignKey: "customer_id"});
  customer_vouchers.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(customer_vouchers, { as: "customer_vouchers", foreignKey: "customer_id"});
  customer_work_info.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(customer_work_info, { as: "customer_work_infos", foreignKey: "customer_id"});
  loan_applications.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(loan_applications, { as: "loan_applications", foreignKey: "customer_id"});
  orders.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(orders, { as: "orders", foreignKey: "customer_id"});
  point_ledgers.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(point_ledgers, { as: "point_ledgers", foreignKey: "customer_id"});
  product_reviews.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(product_reviews, { as: "product_reviews", foreignKey: "customer_id"});
  wishlists.belongsTo(customers, { as: "customer", foreignKey: "customer_id"});
  customers.hasMany(wishlists, { as: "wishlists", foreignKey: "customer_id"});
  user_permissions.belongsTo(features, { as: "feature", foreignKey: "feature_id"});
  features.hasMany(user_permissions, { as: "user_permissions", foreignKey: "feature_id"});
  products.belongsTo(global_categories, { as: "global_category", foreignKey: "global_category_id"});
  global_categories.hasMany(products, { as: "products", foreignKey: "global_category_id"});
  application_documents.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(application_documents, { as: "application_documents", foreignKey: "application_id"});
  cus_requestform.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "application_id"});
  delivery_receipts.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasOne(delivery_receipts, { as: "delivery_receipt", foreignKey: "application_id"});
  document_signatures.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(document_signatures, { as: "document_signatures", foreignKey: "application_id"});
  loan_approval_logs.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_approval_logs, { as: "loan_approval_logs", foreignKey: "application_id"});
  loan_basic_verifications.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_basic_verifications, { as: "loan_basic_verifications", foreignKey: "application_id"});
  loan_call_verifications.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_call_verifications, { as: "loan_call_verifications", foreignKey: "application_id"});
  loan_cib_checks.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasOne(loan_cib_checks, { as: "loan_cib_check", foreignKey: "application_id"});
  loan_cib_history_details.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(loan_cib_history_details, { as: "loan_cib_history_details", foreignKey: "application_id"});
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
  repayment_schedules.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(repayment_schedules, { as: "repayment_schedules", foreignKey: "application_id"});
  repayments.belongsTo(loan_applications, { as: "application", foreignKey: "application_id"});
  loan_applications.hasMany(repayments, { as: "repayments", foreignKey: "application_id"});
  loan_applications.belongsTo(orders, { as: "order", foreignKey: "order_id"});
  orders.hasMany(loan_applications, { as: "loan_applications", foreignKey: "order_id"});
  order_items.belongsTo(orders, { as: "order", foreignKey: "order_id"});
  orders.hasMany(order_items, { as: "order_items", foreignKey: "order_id"});
  loan_contract.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "partner_id"});
  loan_payments.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(loan_payments, { as: "loan_payments", foreignKey: "partner_id"});
  order_items.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(order_items, { as: "order_items", foreignKey: "partner_id"});
  product_types.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(product_types, { as: "product_types", foreignKey: "partner_id"});
  products.belongsTo(partners, { as: "partner", foreignKey: "partner_id"});
  partners.hasMany(products, { as: "products", foreignKey: "partner_id"});
  loan_contract.belongsTo(product_types, { as: "producttype", foreignKey: "producttype_id"});
  product_types.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "producttype_id"});
  products.belongsTo(product_types, { as: "productType", foreignKey: "productType_id"});
  product_types.hasMany(products, { as: "products", foreignKey: "productType_id"});
  cart_items.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(cart_items, { as: "cart_items", foreignKey: "product_id"});
  loan_applications.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(loan_applications, { as: "loan_applications", foreignKey: "product_id"});
  order_items.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(order_items, { as: "order_items", foreignKey: "product_id"});
  product_gallery.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(product_gallery, { as: "product_galleries", foreignKey: "product_id"});
  product_reviews.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(product_reviews, { as: "product_reviews", foreignKey: "product_id"});
  product_variants.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(product_variants, { as: "product_variants", foreignKey: "product_id"});
  wishlists.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(wishlists, { as: "wishlists", foreignKey: "product_id"});
  districts.belongsTo(provinces, { as: "province", foreignKey: "province_id"});
  provinces.hasMany(districts, { as: "districts", foreignKey: "province_id"});
  repayments.belongsTo(repayment_schedules, { as: "schedule", foreignKey: "schedule_id"});
  repayment_schedules.hasMany(repayments, { as: "repayments", foreignKey: "schedule_id"});
  payment_transactions.belongsTo(repayments, { as: "schedule", foreignKey: "schedule_id"});
  repayments.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "schedule_id"});
  application_documents.belongsTo(users, { as: "uploaded_by_user", foreignKey: "uploaded_by"});
  users.hasMany(application_documents, { as: "application_documents", foreignKey: "uploaded_by"});
  audit_logs.belongsTo(users, { as: "performed_by_user", foreignKey: "performed_by"});
  users.hasMany(audit_logs, { as: "audit_logs", foreignKey: "performed_by"});
  cus_requestform.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "created_by"});
  cus_requestform.belongsTo(users, { as: "updated_by_user", foreignKey: "updated_by"});
  users.hasMany(cus_requestform, { as: "updated_by_cus_requestforms", foreignKey: "updated_by"});
  customers.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(customers, { as: "customers", foreignKey: "user_id"});
  delivery_receipts.belongsTo(users, { as: "approver", foreignKey: "approver_id"});
  users.hasMany(delivery_receipts, { as: "delivery_receipts", foreignKey: "approver_id"});
  document_signatures.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(document_signatures, { as: "document_signatures", foreignKey: "user_id"});
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
  loan_contract.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "created_by"});
  loan_contract.belongsTo(users, { as: "updated_by_user", foreignKey: "updated_by"});
  users.hasMany(loan_contract, { as: "updated_by_loan_contracts", foreignKey: "updated_by"});
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
  repayment_schedules.belongsTo(users, { as: "approved_by_user", foreignKey: "approved_by"});
  users.hasMany(repayment_schedules, { as: "repayment_schedules", foreignKey: "approved_by"});
  repayment_schedules.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(repayment_schedules, { as: "created_by_repayment_schedules", foreignKey: "created_by"});
  user_permissions.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_permissions, { as: "user_permissions", foreignKey: "user_id"});
  user_refresh_tokens.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_refresh_tokens, { as: "user_refresh_tokens", foreignKey: "user_id"});
  customer_vouchers.belongsTo(vouchers, { as: "voucher", foreignKey: "voucher_id"});
  vouchers.hasMany(customer_vouchers, { as: "customer_vouchers", foreignKey: "voucher_id"});
  customer_documents.belongsTo(users, { as: "uploaded_by_user", foreignKey: "uploaded_by"});
  users.hasMany(customer_documents, { as: "uploaded_customer_documents", foreignKey: "uploaded_by"});

  return {
    sequelize: sequelize,
    application_documents: application_documents,
    audit_logs: audit_logs,
    cart_items: cart_items,
    carts: carts,
    credit_ledgers: credit_ledgers,
    cus_requestform: cus_requestform,
    customer_credits: customer_credits,
    customer_documents: customer_documents,
    customer_locations: customer_locations,
    customer_points: customer_points,
    customer_vouchers: customer_vouchers,
    customer_work_info: customer_work_info,
    customers: customers,
    delivery_receipts: delivery_receipts,
    districts: districts,
    document_signatures: document_signatures,
    features: features,
    global_categories: global_categories,
    loan_applications: loan_applications,
    loan_approval_logs: loan_approval_logs,
    loan_basic_verifications: loan_basic_verifications,
    loan_call_verifications: loan_call_verifications,
    loan_cib_checks: loan_cib_checks,
    loan_cib_history_details: loan_cib_history_details,
    loan_contract: loan_contract,
    loan_field_visits: loan_field_visits,
    loan_guarantors: loan_guarantors,
    loan_income_assessments: loan_income_assessments,
    loan_payments: loan_payments,
    order_items: order_items,
    orders: orders,
    partners: partners,
    payment_transactions: payment_transactions,
    point_ledgers: point_ledgers,
    product_gallery: product_gallery,
    product_reviews: product_reviews,
    product_types: product_types,
    product_variants: product_variants,
    products: products,
    promotions: promotions,
    provinces: provinces,
    repayment_schedules: repayment_schedules,
    repayments: repayments,
    user_permissions: user_permissions,
    user_refresh_tokens: user_refresh_tokens,
    users: users,
    vouchers: vouchers,
    wishlists: wishlists,
  };
}

export const db = initModels(connect);
