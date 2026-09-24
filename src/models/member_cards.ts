import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_account_requests, credit_account_requestsId } from './credit_account_requests';
import type { credit_accounts, credit_accountsId } from './credit_accounts';
import type { customers, customersId } from './customers';
import type { membership_applications, membership_applicationsId } from './membership_applications';
import type { users, usersId } from './users';

export interface member_cardsAttributes {
  id: number;
  customer_id: number;
  membership_application_id?: number;
  credit_account_id?: number;
  card_no: string;
  member_code: string;
  status: 'PENDING_ISSUANCE' | 'ISSUED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CLOSED';
  issued_at?: Date;
  activated_at?: Date;
  expired_at?: Date;
  suspended_at?: Date;
  closed_at?: Date;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export type member_cardsPk = "id";
export type member_cardsId = member_cards[member_cardsPk];
export type member_cardsOptionalAttributes = "id" | "membership_application_id" | "credit_account_id" | "status" | "issued_at" | "activated_at" | "expired_at" | "suspended_at" | "closed_at" | "created_by" | "created_at" | "updated_at";
export type member_cardsCreationAttributes = Optional<member_cardsAttributes, member_cardsOptionalAttributes>;

export class member_cards extends Model<member_cardsAttributes, member_cardsCreationAttributes> implements member_cardsAttributes {
  id!: number;
  customer_id!: number;
  membership_application_id?: number;
  credit_account_id?: number;
  card_no!: string;
  member_code!: string;
  status!: 'PENDING_ISSUANCE' | 'ISSUED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CLOSED';
  issued_at?: Date;
  activated_at?: Date;
  expired_at?: Date;
  suspended_at?: Date;
  closed_at?: Date;
  created_by?: number;
  created_at!: Date;
  updated_at!: Date;

  // member_cards belongsTo credit_accounts via credit_account_id
  credit_account!: credit_accounts;
  getCredit_account!: Sequelize.BelongsToGetAssociationMixin<credit_accounts>;
  setCredit_account!: Sequelize.BelongsToSetAssociationMixin<credit_accounts, credit_accountsId>;
  createCredit_account!: Sequelize.BelongsToCreateAssociationMixin<credit_accounts>;
  // member_cards belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // member_cards hasMany credit_account_requests via member_card_id
  credit_account_requests!: credit_account_requests[];
  getCredit_account_requests!: Sequelize.HasManyGetAssociationsMixin<credit_account_requests>;
  setCredit_account_requests!: Sequelize.HasManySetAssociationsMixin<credit_account_requests, credit_account_requestsId>;
  addCredit_account_request!: Sequelize.HasManyAddAssociationMixin<credit_account_requests, credit_account_requestsId>;
  addCredit_account_requests!: Sequelize.HasManyAddAssociationsMixin<credit_account_requests, credit_account_requestsId>;
  createCredit_account_request!: Sequelize.HasManyCreateAssociationMixin<credit_account_requests>;
  removeCredit_account_request!: Sequelize.HasManyRemoveAssociationMixin<credit_account_requests, credit_account_requestsId>;
  removeCredit_account_requests!: Sequelize.HasManyRemoveAssociationsMixin<credit_account_requests, credit_account_requestsId>;
  hasCredit_account_request!: Sequelize.HasManyHasAssociationMixin<credit_account_requests, credit_account_requestsId>;
  hasCredit_account_requests!: Sequelize.HasManyHasAssociationsMixin<credit_account_requests, credit_account_requestsId>;
  countCredit_account_requests!: Sequelize.HasManyCountAssociationsMixin;
  // member_cards belongsTo membership_applications via membership_application_id
  membership_application!: membership_applications;
  getMembership_application!: Sequelize.BelongsToGetAssociationMixin<membership_applications>;
  setMembership_application!: Sequelize.BelongsToSetAssociationMixin<membership_applications, membership_applicationsId>;
  createMembership_application!: Sequelize.BelongsToCreateAssociationMixin<membership_applications>;
  // member_cards belongsTo users via created_by
  created_by_user!: users;
  getCreated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof member_cards {
    return member_cards.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
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
    membership_application_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'membership_applications',
        key: 'id'
      }
    },
    credit_account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'credit_accounts',
        key: 'id'
      }
    },
    card_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uk_mc_card_no"
    },
    member_code: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING_ISSUANCE','ISSUED','ACTIVE','SUSPENDED','EXPIRED','CLOSED'),
      allowNull: false,
      defaultValue: "PENDING_ISSUANCE"
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    activated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    suspended_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // 🌟 ເພີ່ມ 2 ຟິວນີ້ເຂົ້າໄປກ່ອນປິດວົງເລັບ
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },{
    sequelize,
    tableName: 'member_cards',
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
        name: "uk_mc_card_no",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "card_no" },
        ]
      },
      {
        name: "idx_mc_customer_status",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_mc_member_code",
        using: "BTREE",
        fields: [
          { name: "member_code" },
        ]
      },
      {
        name: "idx_mc_application",
        using: "BTREE",
        fields: [
          { name: "membership_application_id" },
        ]
      },
      {
        name: "idx_mc_account",
        using: "BTREE",
        fields: [
          { name: "credit_account_id" },
        ]
      },
      {
        name: "fk_mc_created_by",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
    ]
  });
  }
}
