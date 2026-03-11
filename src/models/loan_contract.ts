import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { partners, partnersId } from './partners';
import type { product_types, product_typesId } from './product_types';
import type { users, usersId } from './users';

export interface loan_contractAttributes {
  id: number;
  loan_id: number;
  loan_contract_number: string;
  cus_full_name: string;
  cus_sex: string;
  cus_date_of_birth?: string;
  cus_phone: string;
  cus_marital_status: string;
  cus_id_pass_number: string;
  cus_id_pass_date?: string;
  cus_census_number?: string;
  cus_census_created?: string;
  cus_census_authorize_by: string;
  cus_house_number: string;
  cus_unit: number;
  cus_address: string;
  cus_lived_year: number;
  cus_lived_with: string;
  cus_lived_situation: string;
  cus_company_name: string;
  cus_company_businessType: string;
  cus_company_location: string;
  cus_company_workYear: number;
  cus_position: string;
  cus_income?: number;
  cus_payroll_date?: string;
  cus_company_emp_number: number;
  cus_income_other?: number;
  cus_income_other_source: string;
  product_detail: string;
  producttype_id?: number;
  product_brand: string;
  product_model: string;
  product_price?: number;
  product_down_payment?: number;
  total_amount?: number;
  interest_rate_at_apply: number;
  loan_period: number;
  total_interest?: number;
  fee?: number;
  monthly_pay: number;
  first_installment_amount?: number;
  payment_day?: number;
  motor_id?: string;
  motor_color?: string;
  tank_number?: string;
  motor_warranty?: number;
  partner_id?: number;
  shop_branch: string;
  shop_id: string;
  ref_name: string;
  ref_date_of_birth?: string;
  ref_phone: string;
  ref_sex: string;
  ref_marital_status: string;
  ref_id_pass_number: string;
  ref_id_pass_date?: string;
  ref_census_number?: string;
  ref_census_created?: string;
  ref_census_authorize_by: string;
  ref_house_number: string;
  ref_unit: number;
  ref_address: string;
  ref_lived_year: number;
  ref_lived_with: string;
  ref_lived_situation: string;
  ref_occupation?: string;
  ref_relationship?: string;
  ref_company_name?: string;
  ref_company_businessType: string;
  ref_company_location: string;
  ref_company_workYear: number;
  ref_position: string;
  ref_income?: number;
  ref_payroll_date?: string;
  ref_company_emp_number: number;
  ref_income_other?: number;
  ref_income_other_source: string;
  is_confirmed?: number;
  created_at?: Date;
  updated_at?: Date;
  version: number;
  created_by?: number;
  updated_by?: number;
}

export type loan_contractPk = "id";
export type loan_contractId = loan_contract[loan_contractPk];
export type loan_contractOptionalAttributes = "id" | "cus_date_of_birth" | "cus_id_pass_date" | "cus_census_number" | "cus_census_created" | "cus_income" | "cus_payroll_date" | "cus_income_other" | "producttype_id" | "product_price" | "product_down_payment" | "total_amount" | "total_interest" | "fee" | "first_installment_amount" | "payment_day" | "motor_id" | "motor_color" | "tank_number" | "motor_warranty" | "partner_id" | "ref_date_of_birth" | "ref_id_pass_date" | "ref_census_number" | "ref_census_created" | "ref_occupation" | "ref_relationship" | "ref_company_name" | "ref_income" | "ref_payroll_date" | "ref_income_other" | "is_confirmed" | "created_at" | "updated_at" | "version" | "created_by" | "updated_by";
export type loan_contractCreationAttributes = Optional<loan_contractAttributes, loan_contractOptionalAttributes>;

export class loan_contract extends Model<loan_contractAttributes, loan_contractCreationAttributes> implements loan_contractAttributes {
  id!: number;
  loan_id!: number;
  loan_contract_number!: string;
  cus_full_name!: string;
  cus_sex!: string;
  cus_date_of_birth?: string;
  cus_phone!: string;
  cus_marital_status!: string;
  cus_id_pass_number!: string;
  cus_id_pass_date?: string;
  cus_census_number?: string;
  cus_census_created?: string;
  cus_census_authorize_by!: string;
  cus_house_number!: string;
  cus_unit!: number;
  cus_address!: string;
  cus_lived_year!: number;
  cus_lived_with!: string;
  cus_lived_situation!: string;
  cus_company_name!: string;
  cus_company_businessType!: string;
  cus_company_location!: string;
  cus_company_workYear!: number;
  cus_position!: string;
  cus_income?: number;
  cus_payroll_date?: string;
  cus_company_emp_number!: number;
  cus_income_other?: number;
  cus_income_other_source!: string;
  product_detail!: string;
  producttype_id?: number;
  product_brand!: string;
  product_model!: string;
  product_price?: number;
  product_down_payment?: number;
  total_amount?: number;
  interest_rate_at_apply!: number;
  loan_period!: number;
  total_interest?: number;
  fee?: number;
  monthly_pay!: number;
  first_installment_amount?: number;
  payment_day?: number;
  motor_id?: string;
  motor_color?: string;
  tank_number?: string;
  motor_warranty?: number;
  partner_id?: number;
  shop_branch!: string;
  shop_id!: string;
  ref_name!: string;
  ref_date_of_birth?: string;
  ref_phone!: string;
  ref_sex!: string;
  ref_marital_status!: string;
  ref_id_pass_number!: string;
  ref_id_pass_date?: string;
  ref_census_number?: string;
  ref_census_created?: string;
  ref_census_authorize_by!: string;
  ref_house_number!: string;
  ref_unit!: number;
  ref_address!: string;
  ref_lived_year!: number;
  ref_lived_with!: string;
  ref_lived_situation!: string;
  ref_occupation?: string;
  ref_relationship?: string;
  ref_company_name?: string;
  ref_company_businessType!: string;
  ref_company_location!: string;
  ref_company_workYear!: number;
  ref_position!: string;
  ref_income?: number;
  ref_payroll_date?: string;
  ref_company_emp_number!: number;
  ref_income_other?: number;
  ref_income_other_source!: string;
  is_confirmed?: number;
  created_at?: Date;
  updated_at?: Date;
  version!: number;
  created_by?: number;
  updated_by?: number;

  // loan_contract belongsTo loan_applications via loan_id
  loan!: loan_applications;
  getLoan!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setLoan!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createLoan!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_contract belongsTo partners via partner_id
  partner!: partners;
  getPartner!: Sequelize.BelongsToGetAssociationMixin<partners>;
  setPartner!: Sequelize.BelongsToSetAssociationMixin<partners, partnersId>;
  createPartner!: Sequelize.BelongsToCreateAssociationMixin<partners>;
  // loan_contract belongsTo product_types via producttype_id
  producttype!: product_types;
  getProducttype!: Sequelize.BelongsToGetAssociationMixin<product_types>;
  setProducttype!: Sequelize.BelongsToSetAssociationMixin<product_types, product_typesId>;
  createProducttype!: Sequelize.BelongsToCreateAssociationMixin<product_types>;
  // loan_contract belongsTo users via created_by
  created_by_user!: users;
  getCreated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // loan_contract belongsTo users via updated_by
  updated_by_user!: users;
  getUpdated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUpdated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUpdated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_contract {
    return loan_contract.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    loan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loan_applications',
        key: 'id'
      }
    },
    loan_contract_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "loan_contract_unique"
    },
    cus_full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cus_sex: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    cus_date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cus_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    cus_marital_status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    cus_id_pass_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    cus_id_pass_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cus_census_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    cus_census_created: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cus_census_authorize_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    cus_house_number: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    cus_unit: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cus_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cus_lived_year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cus_lived_with: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cus_lived_situation: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cus_company_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cus_company_businessType: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cus_company_location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cus_company_workYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cus_position: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    cus_income: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    cus_payroll_date: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    cus_company_emp_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cus_income_other: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    cus_income_other_source: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    product_detail: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    producttype_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_types',
        key: 'id'
      }
    },
    product_brand: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    product_model: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    product_price: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    product_down_payment: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    interest_rate_at_apply: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    },
    loan_period: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_interest: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    fee: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    monthly_pay: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
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
    motor_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    motor_color: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tank_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    motor_warranty: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'partners',
        key: 'id'
      }
    },
    shop_branch: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    shop_id: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    ref_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ref_date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ref_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    ref_sex: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    ref_marital_status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    ref_id_pass_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ref_id_pass_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ref_census_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ref_census_created: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ref_census_authorize_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ref_house_number: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    ref_unit: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ref_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ref_lived_year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ref_lived_with: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ref_lived_situation: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ref_occupation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ref_relationship: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ref_company_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ref_company_businessType: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ref_company_location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ref_company_workYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ref_position: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ref_income: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    ref_payroll_date: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ref_company_emp_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ref_income_other: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    ref_income_other_source: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    is_confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "เลขเวอร์ชันของสัญญา"
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "พนักงานที่ออกสัญญา",
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "พนักงานที่แก้ไขล่าสุด",
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'loan_contract',
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
        name: "loan_contract_unique",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "loan_contract_number" },
        ]
      },
      {
        name: "loan_id",
        using: "BTREE",
        fields: [
          { name: "loan_id" },
        ]
      },
      {
        name: "partner_id",
        using: "BTREE",
        fields: [
          { name: "partner_id" },
        ]
      },
      {
        name: "producttype_id",
        using: "BTREE",
        fields: [
          { name: "producttype_id" },
        ]
      },
      {
        name: "fk_contract_created",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "fk_contract_updated",
        using: "BTREE",
        fields: [
          { name: "updated_by" },
        ]
      },
    ]
  });
  }
}
