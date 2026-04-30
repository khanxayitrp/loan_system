"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.wishlists = exports.vouchers = exports.users = exports.user_refresh_tokens = exports.user_permissions = exports.repayments = exports.repayment_schedules = exports.provinces = exports.promotions = exports.products = exports.product_variants = exports.product_types = exports.product_reviews = exports.product_gallery = exports.point_ledgers = exports.payment_transactions = exports.partners = exports.orders = exports.order_items = exports.loan_payments = exports.loan_income_assessments = exports.loan_guarantors = exports.loan_field_visits = exports.loan_contract = exports.loan_cib_history_details = exports.loan_cib_checks = exports.loan_call_verifications = exports.loan_basic_verifications = exports.loan_approval_logs = exports.loan_applications = exports.global_categories = exports.features = exports.document_signatures = exports.districts = exports.delivery_receipts = exports.customers = exports.customer_work_info = exports.customer_vouchers = exports.customer_points = exports.customer_locations = exports.customer_documents = exports.customer_credits = exports.cus_requestform = exports.credit_ledgers = exports.carts = exports.cart_items = exports.audit_logs = exports.application_documents = void 0;
exports.initModels = initModels;
const application_documents_1 = require("./application_documents");
Object.defineProperty(exports, "application_documents", { enumerable: true, get: function () { return application_documents_1.application_documents; } });
const audit_logs_1 = require("./audit_logs");
Object.defineProperty(exports, "audit_logs", { enumerable: true, get: function () { return audit_logs_1.audit_logs; } });
const cart_items_1 = require("./cart_items");
Object.defineProperty(exports, "cart_items", { enumerable: true, get: function () { return cart_items_1.cart_items; } });
const carts_1 = require("./carts");
Object.defineProperty(exports, "carts", { enumerable: true, get: function () { return carts_1.carts; } });
const credit_ledgers_1 = require("./credit_ledgers");
Object.defineProperty(exports, "credit_ledgers", { enumerable: true, get: function () { return credit_ledgers_1.credit_ledgers; } });
const cus_requestform_1 = require("./cus_requestform");
Object.defineProperty(exports, "cus_requestform", { enumerable: true, get: function () { return cus_requestform_1.cus_requestform; } });
const customer_credits_1 = require("./customer_credits");
Object.defineProperty(exports, "customer_credits", { enumerable: true, get: function () { return customer_credits_1.customer_credits; } });
const customer_documents_1 = require("./customer_documents");
Object.defineProperty(exports, "customer_documents", { enumerable: true, get: function () { return customer_documents_1.customer_documents; } });
const customer_locations_1 = require("./customer_locations");
Object.defineProperty(exports, "customer_locations", { enumerable: true, get: function () { return customer_locations_1.customer_locations; } });
const customer_points_1 = require("./customer_points");
Object.defineProperty(exports, "customer_points", { enumerable: true, get: function () { return customer_points_1.customer_points; } });
const customer_vouchers_1 = require("./customer_vouchers");
Object.defineProperty(exports, "customer_vouchers", { enumerable: true, get: function () { return customer_vouchers_1.customer_vouchers; } });
const customer_work_info_1 = require("./customer_work_info");
Object.defineProperty(exports, "customer_work_info", { enumerable: true, get: function () { return customer_work_info_1.customer_work_info; } });
const customers_1 = require("./customers");
Object.defineProperty(exports, "customers", { enumerable: true, get: function () { return customers_1.customers; } });
const delivery_receipts_1 = require("./delivery_receipts");
Object.defineProperty(exports, "delivery_receipts", { enumerable: true, get: function () { return delivery_receipts_1.delivery_receipts; } });
const districts_1 = require("./districts");
Object.defineProperty(exports, "districts", { enumerable: true, get: function () { return districts_1.districts; } });
const document_signatures_1 = require("./document_signatures");
Object.defineProperty(exports, "document_signatures", { enumerable: true, get: function () { return document_signatures_1.document_signatures; } });
const features_1 = require("./features");
Object.defineProperty(exports, "features", { enumerable: true, get: function () { return features_1.features; } });
const global_categories_1 = require("./global_categories");
Object.defineProperty(exports, "global_categories", { enumerable: true, get: function () { return global_categories_1.global_categories; } });
const loan_applications_1 = require("./loan_applications");
Object.defineProperty(exports, "loan_applications", { enumerable: true, get: function () { return loan_applications_1.loan_applications; } });
const loan_approval_logs_1 = require("./loan_approval_logs");
Object.defineProperty(exports, "loan_approval_logs", { enumerable: true, get: function () { return loan_approval_logs_1.loan_approval_logs; } });
const loan_basic_verifications_1 = require("./loan_basic_verifications");
Object.defineProperty(exports, "loan_basic_verifications", { enumerable: true, get: function () { return loan_basic_verifications_1.loan_basic_verifications; } });
const loan_call_verifications_1 = require("./loan_call_verifications");
Object.defineProperty(exports, "loan_call_verifications", { enumerable: true, get: function () { return loan_call_verifications_1.loan_call_verifications; } });
const loan_cib_checks_1 = require("./loan_cib_checks");
Object.defineProperty(exports, "loan_cib_checks", { enumerable: true, get: function () { return loan_cib_checks_1.loan_cib_checks; } });
const loan_cib_history_details_1 = require("./loan_cib_history_details");
Object.defineProperty(exports, "loan_cib_history_details", { enumerable: true, get: function () { return loan_cib_history_details_1.loan_cib_history_details; } });
const loan_contract_1 = require("./loan_contract");
Object.defineProperty(exports, "loan_contract", { enumerable: true, get: function () { return loan_contract_1.loan_contract; } });
const loan_field_visits_1 = require("./loan_field_visits");
Object.defineProperty(exports, "loan_field_visits", { enumerable: true, get: function () { return loan_field_visits_1.loan_field_visits; } });
const loan_guarantors_1 = require("./loan_guarantors");
Object.defineProperty(exports, "loan_guarantors", { enumerable: true, get: function () { return loan_guarantors_1.loan_guarantors; } });
const loan_income_assessments_1 = require("./loan_income_assessments");
Object.defineProperty(exports, "loan_income_assessments", { enumerable: true, get: function () { return loan_income_assessments_1.loan_income_assessments; } });
const loan_payments_1 = require("./loan_payments");
Object.defineProperty(exports, "loan_payments", { enumerable: true, get: function () { return loan_payments_1.loan_payments; } });
const order_items_1 = require("./order_items");
Object.defineProperty(exports, "order_items", { enumerable: true, get: function () { return order_items_1.order_items; } });
const orders_1 = require("./orders");
Object.defineProperty(exports, "orders", { enumerable: true, get: function () { return orders_1.orders; } });
const partners_1 = require("./partners");
Object.defineProperty(exports, "partners", { enumerable: true, get: function () { return partners_1.partners; } });
const payment_transactions_1 = require("./payment_transactions");
Object.defineProperty(exports, "payment_transactions", { enumerable: true, get: function () { return payment_transactions_1.payment_transactions; } });
const point_ledgers_1 = require("./point_ledgers");
Object.defineProperty(exports, "point_ledgers", { enumerable: true, get: function () { return point_ledgers_1.point_ledgers; } });
const product_gallery_1 = require("./product_gallery");
Object.defineProperty(exports, "product_gallery", { enumerable: true, get: function () { return product_gallery_1.product_gallery; } });
const product_reviews_1 = require("./product_reviews");
Object.defineProperty(exports, "product_reviews", { enumerable: true, get: function () { return product_reviews_1.product_reviews; } });
const product_types_1 = require("./product_types");
Object.defineProperty(exports, "product_types", { enumerable: true, get: function () { return product_types_1.product_types; } });
const product_variants_1 = require("./product_variants");
Object.defineProperty(exports, "product_variants", { enumerable: true, get: function () { return product_variants_1.product_variants; } });
const products_1 = require("./products");
Object.defineProperty(exports, "products", { enumerable: true, get: function () { return products_1.products; } });
const promotions_1 = require("./promotions");
Object.defineProperty(exports, "promotions", { enumerable: true, get: function () { return promotions_1.promotions; } });
const provinces_1 = require("./provinces");
Object.defineProperty(exports, "provinces", { enumerable: true, get: function () { return provinces_1.provinces; } });
const repayment_schedules_1 = require("./repayment_schedules");
Object.defineProperty(exports, "repayment_schedules", { enumerable: true, get: function () { return repayment_schedules_1.repayment_schedules; } });
const repayments_1 = require("./repayments");
Object.defineProperty(exports, "repayments", { enumerable: true, get: function () { return repayments_1.repayments; } });
const user_permissions_1 = require("./user_permissions");
Object.defineProperty(exports, "user_permissions", { enumerable: true, get: function () { return user_permissions_1.user_permissions; } });
const user_refresh_tokens_1 = require("./user_refresh_tokens");
Object.defineProperty(exports, "user_refresh_tokens", { enumerable: true, get: function () { return user_refresh_tokens_1.user_refresh_tokens; } });
const users_1 = require("./users");
Object.defineProperty(exports, "users", { enumerable: true, get: function () { return users_1.users; } });
const vouchers_1 = require("./vouchers");
Object.defineProperty(exports, "vouchers", { enumerable: true, get: function () { return vouchers_1.vouchers; } });
const wishlists_1 = require("./wishlists");
Object.defineProperty(exports, "wishlists", { enumerable: true, get: function () { return wishlists_1.wishlists; } });
const db_config_1 = __importDefault(require("../config/db.config"));
function initModels(sequelize) {
    const application_documents = application_documents_1.application_documents.initModel(sequelize);
    const audit_logs = audit_logs_1.audit_logs.initModel(sequelize);
    const cart_items = cart_items_1.cart_items.initModel(sequelize);
    const carts = carts_1.carts.initModel(sequelize);
    const credit_ledgers = credit_ledgers_1.credit_ledgers.initModel(sequelize);
    const cus_requestform = cus_requestform_1.cus_requestform.initModel(sequelize);
    const customer_credits = customer_credits_1.customer_credits.initModel(sequelize);
    const customer_documents = customer_documents_1.customer_documents.initModel(sequelize);
    const customer_locations = customer_locations_1.customer_locations.initModel(sequelize);
    const customer_points = customer_points_1.customer_points.initModel(sequelize);
    const customer_vouchers = customer_vouchers_1.customer_vouchers.initModel(sequelize);
    const customer_work_info = customer_work_info_1.customer_work_info.initModel(sequelize);
    const customers = customers_1.customers.initModel(sequelize);
    const delivery_receipts = delivery_receipts_1.delivery_receipts.initModel(sequelize);
    const districts = districts_1.districts.initModel(sequelize);
    const document_signatures = document_signatures_1.document_signatures.initModel(sequelize);
    const features = features_1.features.initModel(sequelize);
    const global_categories = global_categories_1.global_categories.initModel(sequelize);
    const loan_applications = loan_applications_1.loan_applications.initModel(sequelize);
    const loan_approval_logs = loan_approval_logs_1.loan_approval_logs.initModel(sequelize);
    const loan_basic_verifications = loan_basic_verifications_1.loan_basic_verifications.initModel(sequelize);
    const loan_call_verifications = loan_call_verifications_1.loan_call_verifications.initModel(sequelize);
    const loan_cib_checks = loan_cib_checks_1.loan_cib_checks.initModel(sequelize);
    const loan_cib_history_details = loan_cib_history_details_1.loan_cib_history_details.initModel(sequelize);
    const loan_contract = loan_contract_1.loan_contract.initModel(sequelize);
    const loan_field_visits = loan_field_visits_1.loan_field_visits.initModel(sequelize);
    const loan_guarantors = loan_guarantors_1.loan_guarantors.initModel(sequelize);
    const loan_income_assessments = loan_income_assessments_1.loan_income_assessments.initModel(sequelize);
    const loan_payments = loan_payments_1.loan_payments.initModel(sequelize);
    const order_items = order_items_1.order_items.initModel(sequelize);
    const orders = orders_1.orders.initModel(sequelize);
    const partners = partners_1.partners.initModel(sequelize);
    const payment_transactions = payment_transactions_1.payment_transactions.initModel(sequelize);
    const point_ledgers = point_ledgers_1.point_ledgers.initModel(sequelize);
    const product_gallery = product_gallery_1.product_gallery.initModel(sequelize);
    const product_reviews = product_reviews_1.product_reviews.initModel(sequelize);
    const product_types = product_types_1.product_types.initModel(sequelize);
    const product_variants = product_variants_1.product_variants.initModel(sequelize);
    const products = products_1.products.initModel(sequelize);
    const promotions = promotions_1.promotions.initModel(sequelize);
    const provinces = provinces_1.provinces.initModel(sequelize);
    const repayment_schedules = repayment_schedules_1.repayment_schedules.initModel(sequelize);
    const repayments = repayments_1.repayments.initModel(sequelize);
    const user_permissions = user_permissions_1.user_permissions.initModel(sequelize);
    const user_refresh_tokens = user_refresh_tokens_1.user_refresh_tokens.initModel(sequelize);
    const users = users_1.users.initModel(sequelize);
    const vouchers = vouchers_1.vouchers.initModel(sequelize);
    const wishlists = wishlists_1.wishlists.initModel(sequelize);
    features.belongsToMany(users, { as: 'user_id_users', through: user_permissions, foreignKey: "feature_id", otherKey: "user_id" });
    users.belongsToMany(features, { as: 'feature_id_features', through: user_permissions, foreignKey: "user_id", otherKey: "feature_id" });
    cart_items.belongsTo(carts, { as: "cart", foreignKey: "cart_id" });
    carts.hasMany(cart_items, { as: "cart_items", foreignKey: "cart_id" });
    carts.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasOne(carts, { as: "cart", foreignKey: "customer_id" });
    credit_ledgers.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(credit_ledgers, { as: "credit_ledgers", foreignKey: "customer_id" });
    cus_requestform.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "customer_id" });
    customer_credits.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasOne(customer_credits, { as: "customer_credit", foreignKey: "customer_id" });
    customer_documents.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(customer_documents, { as: "customer_documents", foreignKey: "customer_id" });
    customer_locations.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(customer_locations, { as: "customer_locations", foreignKey: "customer_id" });
    customer_points.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasOne(customer_points, { as: "customer_point", foreignKey: "customer_id" });
    customer_vouchers.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(customer_vouchers, { as: "customer_vouchers", foreignKey: "customer_id" });
    customer_work_info.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(customer_work_info, { as: "customer_work_infos", foreignKey: "customer_id" });
    loan_applications.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(loan_applications, { as: "loan_applications", foreignKey: "customer_id" });
    orders.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(orders, { as: "orders", foreignKey: "customer_id" });
    point_ledgers.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(point_ledgers, { as: "point_ledgers", foreignKey: "customer_id" });
    product_reviews.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(product_reviews, { as: "product_reviews", foreignKey: "customer_id" });
    wishlists.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    customers.hasMany(wishlists, { as: "wishlists", foreignKey: "customer_id" });
    user_permissions.belongsTo(features, { as: "feature", foreignKey: "feature_id" });
    features.hasMany(user_permissions, { as: "user_permissions", foreignKey: "feature_id" });
    products.belongsTo(global_categories, { as: "global_category", foreignKey: "global_category_id" });
    global_categories.hasMany(products, { as: "products", foreignKey: "global_category_id" });
    application_documents.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(application_documents, { as: "application_documents", foreignKey: "application_id" });
    cus_requestform.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "application_id" });
    delivery_receipts.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasOne(delivery_receipts, { as: "delivery_receipt", foreignKey: "application_id" });
    document_signatures.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(document_signatures, { as: "document_signatures", foreignKey: "application_id" });
    loan_approval_logs.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(loan_approval_logs, { as: "loan_approval_logs", foreignKey: "application_id" });
    loan_basic_verifications.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(loan_basic_verifications, { as: "loan_basic_verifications", foreignKey: "application_id" });
    loan_call_verifications.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(loan_call_verifications, { as: "loan_call_verifications", foreignKey: "application_id" });
    loan_cib_checks.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasOne(loan_cib_checks, { as: "loan_cib_check", foreignKey: "application_id" });
    loan_cib_history_details.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(loan_cib_history_details, { as: "loan_cib_history_details", foreignKey: "application_id" });
    loan_contract.belongsTo(loan_applications, { as: "loan", foreignKey: "loan_id" });
    loan_applications.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "loan_id" });
    loan_field_visits.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(loan_field_visits, { as: "loan_field_visits", foreignKey: "application_id" });
    loan_guarantors.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(loan_guarantors, { as: "loan_guarantors", foreignKey: "application_id" });
    loan_income_assessments.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasOne(loan_income_assessments, { as: "loan_income_assessment", foreignKey: "application_id" });
    loan_payments.belongsTo(loan_applications, { as: "loan_application", foreignKey: "loan_application_id" });
    loan_applications.hasMany(loan_payments, { as: "loan_payments", foreignKey: "loan_application_id" });
    payment_transactions.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "application_id" });
    repayment_schedules.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(repayment_schedules, { as: "repayment_schedules", foreignKey: "application_id" });
    repayments.belongsTo(loan_applications, { as: "application", foreignKey: "application_id" });
    loan_applications.hasMany(repayments, { as: "repayments", foreignKey: "application_id" });
    loan_applications.belongsTo(orders, { as: "order", foreignKey: "order_id" });
    orders.hasMany(loan_applications, { as: "loan_applications", foreignKey: "order_id" });
    order_items.belongsTo(orders, { as: "order", foreignKey: "order_id" });
    orders.hasMany(order_items, { as: "order_items", foreignKey: "order_id" });
    loan_contract.belongsTo(partners, { as: "partner", foreignKey: "partner_id" });
    partners.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "partner_id" });
    loan_payments.belongsTo(partners, { as: "partner", foreignKey: "partner_id" });
    partners.hasMany(loan_payments, { as: "loan_payments", foreignKey: "partner_id" });
    order_items.belongsTo(partners, { as: "partner", foreignKey: "partner_id" });
    partners.hasMany(order_items, { as: "order_items", foreignKey: "partner_id" });
    product_types.belongsTo(partners, { as: "partner", foreignKey: "partner_id" });
    partners.hasMany(product_types, { as: "product_types", foreignKey: "partner_id" });
    products.belongsTo(partners, { as: "partner", foreignKey: "partner_id" });
    partners.hasMany(products, { as: "products", foreignKey: "partner_id" });
    loan_contract.belongsTo(product_types, { as: "producttype", foreignKey: "producttype_id" });
    product_types.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "producttype_id" });
    products.belongsTo(product_types, { as: "productType", foreignKey: "productType_id" });
    product_types.hasMany(products, { as: "products", foreignKey: "productType_id" });
    cart_items.belongsTo(products, { as: "product", foreignKey: "product_id" });
    products.hasMany(cart_items, { as: "cart_items", foreignKey: "product_id" });
    loan_applications.belongsTo(products, { as: "product", foreignKey: "product_id" });
    products.hasMany(loan_applications, { as: "loan_applications", foreignKey: "product_id" });
    order_items.belongsTo(products, { as: "product", foreignKey: "product_id" });
    products.hasMany(order_items, { as: "order_items", foreignKey: "product_id" });
    product_gallery.belongsTo(products, { as: "product", foreignKey: "product_id" });
    products.hasMany(product_gallery, { as: "product_galleries", foreignKey: "product_id" });
    product_reviews.belongsTo(products, { as: "product", foreignKey: "product_id" });
    products.hasMany(product_reviews, { as: "product_reviews", foreignKey: "product_id" });
    product_variants.belongsTo(products, { as: "product", foreignKey: "product_id" });
    products.hasMany(product_variants, { as: "product_variants", foreignKey: "product_id" });
    wishlists.belongsTo(products, { as: "product", foreignKey: "product_id" });
    products.hasMany(wishlists, { as: "wishlists", foreignKey: "product_id" });
    districts.belongsTo(provinces, { as: "province", foreignKey: "province_id" });
    provinces.hasMany(districts, { as: "districts", foreignKey: "province_id" });
    repayments.belongsTo(repayment_schedules, { as: "schedule", foreignKey: "schedule_id" });
    repayment_schedules.hasMany(repayments, { as: "repayments", foreignKey: "schedule_id" });
    payment_transactions.belongsTo(repayments, { as: "schedule", foreignKey: "schedule_id" });
    repayments.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "schedule_id" });
    application_documents.belongsTo(users, { as: "uploaded_by_user", foreignKey: "uploaded_by" });
    users.hasMany(application_documents, { as: "application_documents", foreignKey: "uploaded_by" });
    audit_logs.belongsTo(users, { as: "performed_by_user", foreignKey: "performed_by" });
    users.hasMany(audit_logs, { as: "audit_logs", foreignKey: "performed_by" });
    cus_requestform.belongsTo(users, { as: "created_by_user", foreignKey: "created_by" });
    users.hasMany(cus_requestform, { as: "cus_requestforms", foreignKey: "created_by" });
    cus_requestform.belongsTo(users, { as: "updated_by_user", foreignKey: "updated_by" });
    users.hasMany(cus_requestform, { as: "updated_by_cus_requestforms", foreignKey: "updated_by" });
    customers.belongsTo(users, { as: "user", foreignKey: "user_id" });
    users.hasMany(customers, { as: "customers", foreignKey: "user_id" });
    delivery_receipts.belongsTo(users, { as: "approver", foreignKey: "approver_id" });
    users.hasMany(delivery_receipts, { as: "delivery_receipts", foreignKey: "approver_id" });
    document_signatures.belongsTo(users, { as: "user", foreignKey: "user_id" });
    users.hasMany(document_signatures, { as: "document_signatures", foreignKey: "user_id" });
    loan_applications.belongsTo(users, { as: "requester", foreignKey: "requester_id" });
    users.hasMany(loan_applications, { as: "loan_applications", foreignKey: "requester_id" });
    loan_applications.belongsTo(users, { as: "approver", foreignKey: "approver_id" });
    users.hasMany(loan_applications, { as: "approver_loan_applications", foreignKey: "approver_id" });
    loan_approval_logs.belongsTo(users, { as: "performed_by_user", foreignKey: "performed_by" });
    users.hasMany(loan_approval_logs, { as: "loan_approval_logs", foreignKey: "performed_by" });
    loan_basic_verifications.belongsTo(users, { as: "verified_by_user", foreignKey: "verified_by" });
    users.hasMany(loan_basic_verifications, { as: "loan_basic_verifications", foreignKey: "verified_by" });
    loan_call_verifications.belongsTo(users, { as: "called_by_user", foreignKey: "called_by" });
    users.hasMany(loan_call_verifications, { as: "loan_call_verifications", foreignKey: "called_by" });
    loan_cib_checks.belongsTo(users, { as: "checked_by_user", foreignKey: "checked_by" });
    users.hasMany(loan_cib_checks, { as: "loan_cib_checks", foreignKey: "checked_by" });
    loan_contract.belongsTo(users, { as: "created_by_user", foreignKey: "created_by" });
    users.hasMany(loan_contract, { as: "loan_contracts", foreignKey: "created_by" });
    loan_contract.belongsTo(users, { as: "updated_by_user", foreignKey: "updated_by" });
    users.hasMany(loan_contract, { as: "updated_by_loan_contracts", foreignKey: "updated_by" });
    loan_field_visits.belongsTo(users, { as: "visited_by_user", foreignKey: "visited_by" });
    users.hasMany(loan_field_visits, { as: "loan_field_visits", foreignKey: "visited_by" });
    loan_income_assessments.belongsTo(users, { as: "assessed_by_user", foreignKey: "assessed_by" });
    users.hasMany(loan_income_assessments, { as: "loan_income_assessments", foreignKey: "assessed_by" });
    partners.belongsTo(users, { as: "user", foreignKey: "user_id" });
    users.hasMany(partners, { as: "partners", foreignKey: "user_id" });
    payment_transactions.belongsTo(users, { as: "recorded_by_user", foreignKey: "recorded_by" });
    users.hasMany(payment_transactions, { as: "payment_transactions", foreignKey: "recorded_by" });
    promotions.belongsTo(users, { as: "created_by_user", foreignKey: "created_by" });
    users.hasMany(promotions, { as: "promotions", foreignKey: "created_by" });
    repayment_schedules.belongsTo(users, { as: "approved_by_user", foreignKey: "approved_by" });
    users.hasMany(repayment_schedules, { as: "repayment_schedules", foreignKey: "approved_by" });
    repayment_schedules.belongsTo(users, { as: "created_by_user", foreignKey: "created_by" });
    users.hasMany(repayment_schedules, { as: "created_by_repayment_schedules", foreignKey: "created_by" });
    user_permissions.belongsTo(users, { as: "user", foreignKey: "user_id" });
    users.hasMany(user_permissions, { as: "user_permissions", foreignKey: "user_id" });
    user_refresh_tokens.belongsTo(users, { as: "user", foreignKey: "user_id" });
    users.hasMany(user_refresh_tokens, { as: "user_refresh_tokens", foreignKey: "user_id" });
    customer_vouchers.belongsTo(vouchers, { as: "voucher", foreignKey: "voucher_id" });
    vouchers.hasMany(customer_vouchers, { as: "customer_vouchers", foreignKey: "voucher_id" });
    customer_documents.belongsTo(users, { as: "uploaded_by_user", foreignKey: "uploaded_by" });
    users.hasMany(customer_documents, { as: "uploaded_customer_documents", foreignKey: "uploaded_by" });
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
exports.db = initModels(db_config_1.default);
