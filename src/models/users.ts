import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { application_documents, application_documentsId } from './application_documents';
import type { customers, customersId } from './customers';
import type { delivery_receipts, delivery_receiptsId } from './delivery_receipts';
import type { features, featuresId } from './features';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { partners, partnersId } from './partners';
import type { payment_transactions, payment_transactionsId } from './payment_transactions';
import type { promotions, promotionsId } from './promotions';
import type { user_permissions, user_permissionsId } from './user_permissions';
import type { user_refresh_tokens, user_refresh_tokensId } from './user_refresh_tokens';

export interface usersAttributes {
  id: number;
  username: string;
  password: string;
  full_name: string;
  role: 'admin' | 'staff' | 'partner' | 'customer';
  staff_level?: 'requester' | 'approver' | 'none';
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
  staff_level?: 'requester' | 'approver' | 'none';
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
      type: DataTypes.ENUM('requester','approver','none'),
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
