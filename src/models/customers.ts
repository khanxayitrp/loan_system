import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { carts, cartsCreationAttributes, cartsId } from './carts';
import type { credit_ledgers, credit_ledgersId } from './credit_ledgers';
import type { cus_requestform, cus_requestformId } from './cus_requestform';
import type { customer_credits, customer_creditsCreationAttributes, customer_creditsId } from './customer_credits';
import type { customer_locations, customer_locationsId } from './customer_locations';
import type { customer_points, customer_pointsCreationAttributes, customer_pointsId } from './customer_points';
import type { customer_vouchers, customer_vouchersId } from './customer_vouchers';
import type { customer_work_info, customer_work_infoId } from './customer_work_info';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { orders, ordersId } from './orders';
import type { point_ledgers, point_ledgersId } from './point_ledgers';
import type { product_reviews, product_reviewsId } from './product_reviews';
import type { users, usersId } from './users';
import type { wishlists, wishlistsId } from './wishlists';

export interface customersAttributes {
  id: number;
  identity_number: string;
  census_number?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone: string;
  address?: string;
  age?: number;
  occupation?: string;
  income_per_month?: number;
  other_debt?: number;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
  unit?: string;
  issue_place?: string;
  issue_date?: string;
  kyc_status?: 'unverified' | 'verified' | 'expired' | 'rejected';
  kyc_verified_at?: Date;
  income_verified_at?: Date;
}

export type customersPk = "id";
export type customersId = customers[customersPk];
export type customersOptionalAttributes = "id" | "census_number" | "date_of_birth" | "address" | "age" | "occupation" | "income_per_month" | "other_debt" | "user_id" | "created_at" | "updated_at" | "unit" | "issue_place" | "issue_date" | "kyc_status" | "kyc_verified_at" | "income_verified_at";
export type customersCreationAttributes = Optional<customersAttributes, customersOptionalAttributes>;

export class customers extends Model<customersAttributes, customersCreationAttributes> implements customersAttributes {
  id!: number;
  identity_number!: string;
  census_number?: string;
  first_name!: string;
  last_name!: string;
  date_of_birth?: string;
  phone!: string;
  address?: string;
  age?: number;
  occupation?: string;
  income_per_month?: number;
  other_debt?: number;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
  unit?: string;
  issue_place?: string;
  issue_date?: string;
  kyc_status?: 'unverified' | 'verified' | 'expired' | 'rejected';
  kyc_verified_at?: Date;
  income_verified_at?: Date;

  // customers hasOne carts via customer_id
  cart!: carts;
  getCart!: Sequelize.HasOneGetAssociationMixin<carts>;
  setCart!: Sequelize.HasOneSetAssociationMixin<carts, cartsId>;
  createCart!: Sequelize.HasOneCreateAssociationMixin<carts>;
  // customers hasMany credit_ledgers via customer_id
  credit_ledgers!: credit_ledgers[];
  getCredit_ledgers!: Sequelize.HasManyGetAssociationsMixin<credit_ledgers>;
  setCredit_ledgers!: Sequelize.HasManySetAssociationsMixin<credit_ledgers, credit_ledgersId>;
  addCredit_ledger!: Sequelize.HasManyAddAssociationMixin<credit_ledgers, credit_ledgersId>;
  addCredit_ledgers!: Sequelize.HasManyAddAssociationsMixin<credit_ledgers, credit_ledgersId>;
  createCredit_ledger!: Sequelize.HasManyCreateAssociationMixin<credit_ledgers>;
  removeCredit_ledger!: Sequelize.HasManyRemoveAssociationMixin<credit_ledgers, credit_ledgersId>;
  removeCredit_ledgers!: Sequelize.HasManyRemoveAssociationsMixin<credit_ledgers, credit_ledgersId>;
  hasCredit_ledger!: Sequelize.HasManyHasAssociationMixin<credit_ledgers, credit_ledgersId>;
  hasCredit_ledgers!: Sequelize.HasManyHasAssociationsMixin<credit_ledgers, credit_ledgersId>;
  countCredit_ledgers!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasMany cus_requestform via customer_id
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
  // customers hasOne customer_credits via customer_id
  customer_credit!: customer_credits;
  getCustomer_credit!: Sequelize.HasOneGetAssociationMixin<customer_credits>;
  setCustomer_credit!: Sequelize.HasOneSetAssociationMixin<customer_credits, customer_creditsId>;
  createCustomer_credit!: Sequelize.HasOneCreateAssociationMixin<customer_credits>;
  // customers hasMany customer_locations via customer_id
  customer_locations!: customer_locations[];
  getCustomer_locations!: Sequelize.HasManyGetAssociationsMixin<customer_locations>;
  setCustomer_locations!: Sequelize.HasManySetAssociationsMixin<customer_locations, customer_locationsId>;
  addCustomer_location!: Sequelize.HasManyAddAssociationMixin<customer_locations, customer_locationsId>;
  addCustomer_locations!: Sequelize.HasManyAddAssociationsMixin<customer_locations, customer_locationsId>;
  createCustomer_location!: Sequelize.HasManyCreateAssociationMixin<customer_locations>;
  removeCustomer_location!: Sequelize.HasManyRemoveAssociationMixin<customer_locations, customer_locationsId>;
  removeCustomer_locations!: Sequelize.HasManyRemoveAssociationsMixin<customer_locations, customer_locationsId>;
  hasCustomer_location!: Sequelize.HasManyHasAssociationMixin<customer_locations, customer_locationsId>;
  hasCustomer_locations!: Sequelize.HasManyHasAssociationsMixin<customer_locations, customer_locationsId>;
  countCustomer_locations!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasOne customer_points via customer_id
  customer_point!: customer_points;
  getCustomer_point!: Sequelize.HasOneGetAssociationMixin<customer_points>;
  setCustomer_point!: Sequelize.HasOneSetAssociationMixin<customer_points, customer_pointsId>;
  createCustomer_point!: Sequelize.HasOneCreateAssociationMixin<customer_points>;
  // customers hasMany customer_vouchers via customer_id
  customer_vouchers!: customer_vouchers[];
  getCustomer_vouchers!: Sequelize.HasManyGetAssociationsMixin<customer_vouchers>;
  setCustomer_vouchers!: Sequelize.HasManySetAssociationsMixin<customer_vouchers, customer_vouchersId>;
  addCustomer_voucher!: Sequelize.HasManyAddAssociationMixin<customer_vouchers, customer_vouchersId>;
  addCustomer_vouchers!: Sequelize.HasManyAddAssociationsMixin<customer_vouchers, customer_vouchersId>;
  createCustomer_voucher!: Sequelize.HasManyCreateAssociationMixin<customer_vouchers>;
  removeCustomer_voucher!: Sequelize.HasManyRemoveAssociationMixin<customer_vouchers, customer_vouchersId>;
  removeCustomer_vouchers!: Sequelize.HasManyRemoveAssociationsMixin<customer_vouchers, customer_vouchersId>;
  hasCustomer_voucher!: Sequelize.HasManyHasAssociationMixin<customer_vouchers, customer_vouchersId>;
  hasCustomer_vouchers!: Sequelize.HasManyHasAssociationsMixin<customer_vouchers, customer_vouchersId>;
  countCustomer_vouchers!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasMany customer_work_info via customer_id
  customer_work_infos!: customer_work_info[];
  getCustomer_work_infos!: Sequelize.HasManyGetAssociationsMixin<customer_work_info>;
  setCustomer_work_infos!: Sequelize.HasManySetAssociationsMixin<customer_work_info, customer_work_infoId>;
  addCustomer_work_info!: Sequelize.HasManyAddAssociationMixin<customer_work_info, customer_work_infoId>;
  addCustomer_work_infos!: Sequelize.HasManyAddAssociationsMixin<customer_work_info, customer_work_infoId>;
  createCustomer_work_info!: Sequelize.HasManyCreateAssociationMixin<customer_work_info>;
  removeCustomer_work_info!: Sequelize.HasManyRemoveAssociationMixin<customer_work_info, customer_work_infoId>;
  removeCustomer_work_infos!: Sequelize.HasManyRemoveAssociationsMixin<customer_work_info, customer_work_infoId>;
  hasCustomer_work_info!: Sequelize.HasManyHasAssociationMixin<customer_work_info, customer_work_infoId>;
  hasCustomer_work_infos!: Sequelize.HasManyHasAssociationsMixin<customer_work_info, customer_work_infoId>;
  countCustomer_work_infos!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasMany loan_applications via customer_id
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
  // customers hasMany orders via customer_id
  orders!: orders[];
  getOrders!: Sequelize.HasManyGetAssociationsMixin<orders>;
  setOrders!: Sequelize.HasManySetAssociationsMixin<orders, ordersId>;
  addOrder!: Sequelize.HasManyAddAssociationMixin<orders, ordersId>;
  addOrders!: Sequelize.HasManyAddAssociationsMixin<orders, ordersId>;
  createOrder!: Sequelize.HasManyCreateAssociationMixin<orders>;
  removeOrder!: Sequelize.HasManyRemoveAssociationMixin<orders, ordersId>;
  removeOrders!: Sequelize.HasManyRemoveAssociationsMixin<orders, ordersId>;
  hasOrder!: Sequelize.HasManyHasAssociationMixin<orders, ordersId>;
  hasOrders!: Sequelize.HasManyHasAssociationsMixin<orders, ordersId>;
  countOrders!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasMany point_ledgers via customer_id
  point_ledgers!: point_ledgers[];
  getPoint_ledgers!: Sequelize.HasManyGetAssociationsMixin<point_ledgers>;
  setPoint_ledgers!: Sequelize.HasManySetAssociationsMixin<point_ledgers, point_ledgersId>;
  addPoint_ledger!: Sequelize.HasManyAddAssociationMixin<point_ledgers, point_ledgersId>;
  addPoint_ledgers!: Sequelize.HasManyAddAssociationsMixin<point_ledgers, point_ledgersId>;
  createPoint_ledger!: Sequelize.HasManyCreateAssociationMixin<point_ledgers>;
  removePoint_ledger!: Sequelize.HasManyRemoveAssociationMixin<point_ledgers, point_ledgersId>;
  removePoint_ledgers!: Sequelize.HasManyRemoveAssociationsMixin<point_ledgers, point_ledgersId>;
  hasPoint_ledger!: Sequelize.HasManyHasAssociationMixin<point_ledgers, point_ledgersId>;
  hasPoint_ledgers!: Sequelize.HasManyHasAssociationsMixin<point_ledgers, point_ledgersId>;
  countPoint_ledgers!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasMany product_reviews via customer_id
  product_reviews!: product_reviews[];
  getProduct_reviews!: Sequelize.HasManyGetAssociationsMixin<product_reviews>;
  setProduct_reviews!: Sequelize.HasManySetAssociationsMixin<product_reviews, product_reviewsId>;
  addProduct_review!: Sequelize.HasManyAddAssociationMixin<product_reviews, product_reviewsId>;
  addProduct_reviews!: Sequelize.HasManyAddAssociationsMixin<product_reviews, product_reviewsId>;
  createProduct_review!: Sequelize.HasManyCreateAssociationMixin<product_reviews>;
  removeProduct_review!: Sequelize.HasManyRemoveAssociationMixin<product_reviews, product_reviewsId>;
  removeProduct_reviews!: Sequelize.HasManyRemoveAssociationsMixin<product_reviews, product_reviewsId>;
  hasProduct_review!: Sequelize.HasManyHasAssociationMixin<product_reviews, product_reviewsId>;
  hasProduct_reviews!: Sequelize.HasManyHasAssociationsMixin<product_reviews, product_reviewsId>;
  countProduct_reviews!: Sequelize.HasManyCountAssociationsMixin;
  // customers hasMany wishlists via customer_id
  wishlists!: wishlists[];
  getWishlists!: Sequelize.HasManyGetAssociationsMixin<wishlists>;
  setWishlists!: Sequelize.HasManySetAssociationsMixin<wishlists, wishlistsId>;
  addWishlist!: Sequelize.HasManyAddAssociationMixin<wishlists, wishlistsId>;
  addWishlists!: Sequelize.HasManyAddAssociationsMixin<wishlists, wishlistsId>;
  createWishlist!: Sequelize.HasManyCreateAssociationMixin<wishlists>;
  removeWishlist!: Sequelize.HasManyRemoveAssociationMixin<wishlists, wishlistsId>;
  removeWishlists!: Sequelize.HasManyRemoveAssociationsMixin<wishlists, wishlistsId>;
  hasWishlist!: Sequelize.HasManyHasAssociationMixin<wishlists, wishlistsId>;
  hasWishlists!: Sequelize.HasManyHasAssociationsMixin<wishlists, wishlistsId>;
  countWishlists!: Sequelize.HasManyCountAssociationsMixin;
  // customers belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customers {
    return customers.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    identity_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "identity_number"
    },
    census_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "phone"
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    occupation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    income_per_month: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    other_debt: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    issue_place: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    kyc_status: {
      type: DataTypes.ENUM('unverified','verified','expired','rejected'),
      allowNull: true,
      defaultValue: "unverified"
    },
    kyc_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    income_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'customers',
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
        name: "identity_number",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "identity_number" },
        ]
      },
      {
        name: "phone",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "phone" },
        ]
      },
      {
        name: "user_id",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
