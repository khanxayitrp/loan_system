import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_accounts, credit_accountsId } from './credit_accounts';
import type { customers, customersId } from './customers';
import type { member_cards, member_cardsId } from './member_cards';
import type { users, usersId } from './users';

export interface credit_account_requestsAttributes {
  id: number;
  request_no: string;
  customer_id: number;
  credit_account_id?: number;
  member_card_id?: number;
  request_type: 'SUSPEND_ACCOUNT' | 'BLOCK_ACCOUNT' | 'CLOSE_ACCOUNT' | 'REACTIVATE_ACCOUNT' | 'INCREASE_LIMIT' | 'DECREASE_LIMIT' | 'SUSPEND_CARD' | 'REPLACE_CARD' | 'CLOSE_CARD';
  requested_limit?: number;
  reason: string;
  status: 'PENDING' | 'MANAGER_APPROVED' | 'FINAL_APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';
  requested_by: number;
  checked_by?: number;
  approved_by?: number;
  executed_by?: number;
  requested_at: Date;
  checked_at?: Date;
  approved_at?: Date;
  executed_at?: Date;
  remarks?: string;
}

export type credit_account_requestsPk = "id";
export type credit_account_requestsId = credit_account_requests[credit_account_requestsPk];
export type credit_account_requestsOptionalAttributes = "id" | "credit_account_id" | "member_card_id" | "requested_limit" | "status" | "checked_by" | "approved_by" | "executed_by" | "requested_at" | "checked_at" | "approved_at" | "executed_at" | "remarks";
export type credit_account_requestsCreationAttributes = Optional<credit_account_requestsAttributes, credit_account_requestsOptionalAttributes>;

export class credit_account_requests extends Model<credit_account_requestsAttributes, credit_account_requestsCreationAttributes> implements credit_account_requestsAttributes {
  id!: number;
  request_no!: string;
  customer_id!: number;
  credit_account_id?: number;
  member_card_id?: number;
  request_type!: 'SUSPEND_ACCOUNT' | 'BLOCK_ACCOUNT' | 'CLOSE_ACCOUNT' | 'REACTIVATE_ACCOUNT' | 'INCREASE_LIMIT' | 'DECREASE_LIMIT' | 'SUSPEND_CARD' | 'REPLACE_CARD' | 'CLOSE_CARD';
  requested_limit?: number;
  reason!: string;
  status!: 'PENDING' | 'MANAGER_APPROVED' | 'FINAL_APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';
  requested_by!: number;
  checked_by?: number;
  approved_by?: number;
  executed_by?: number;
  requested_at!: Date;
  checked_at?: Date;
  approved_at?: Date;
  executed_at?: Date;
  remarks?: string;

  // credit_account_requests belongsTo credit_accounts via credit_account_id
  credit_account!: credit_accounts;
  getCredit_account!: Sequelize.BelongsToGetAssociationMixin<credit_accounts>;
  setCredit_account!: Sequelize.BelongsToSetAssociationMixin<credit_accounts, credit_accountsId>;
  createCredit_account!: Sequelize.BelongsToCreateAssociationMixin<credit_accounts>;
  // credit_account_requests belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;
  // credit_account_requests belongsTo member_cards via member_card_id
  member_card!: member_cards;
  getMember_card!: Sequelize.BelongsToGetAssociationMixin<member_cards>;
  setMember_card!: Sequelize.BelongsToSetAssociationMixin<member_cards, member_cardsId>;
  createMember_card!: Sequelize.BelongsToCreateAssociationMixin<member_cards>;
  // credit_account_requests belongsTo users via approved_by
  approved_by_user!: users;
  getApproved_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setApproved_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createApproved_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // credit_account_requests belongsTo users via checked_by
  checked_by_user!: users;
  getChecked_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setChecked_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createChecked_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // credit_account_requests belongsTo users via executed_by
  executed_by_user!: users;
  getExecuted_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setExecuted_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createExecuted_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // credit_account_requests belongsTo users via requested_by
  requested_by_user!: users;
  getRequested_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setRequested_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createRequested_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_account_requests {
    return credit_account_requests.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    request_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uk_car_request_no"
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
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
    member_card_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'member_cards',
        key: 'id'
      }
    },
    request_type: {
      type: DataTypes.ENUM('SUSPEND_ACCOUNT','BLOCK_ACCOUNT','CLOSE_ACCOUNT','REACTIVATE_ACCOUNT','INCREASE_LIMIT','DECREASE_LIMIT','SUSPEND_CARD','REPLACE_CARD','CLOSE_CARD'),
      allowNull: false
    },
    requested_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING','MANAGER_APPROVED','FINAL_APPROVED','REJECTED','EXECUTED','CANCELLED'),
      allowNull: false,
      defaultValue: "PENDING"
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    checked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    executed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    requested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    checked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    executed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'credit_account_requests',
    timestamps: false,
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
        name: "uk_car_request_no",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "request_no" },
        ]
      },
      {
        name: "idx_car_customer_status",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_car_account_status",
        using: "BTREE",
        fields: [
          { name: "credit_account_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_car_card_status",
        using: "BTREE",
        fields: [
          { name: "member_card_id" },
          { name: "status" },
        ]
      },
      {
        name: "fk_car_requested_by",
        using: "BTREE",
        fields: [
          { name: "requested_by" },
        ]
      },
      {
        name: "fk_car_checked_by",
        using: "BTREE",
        fields: [
          { name: "checked_by" },
        ]
      },
      {
        name: "fk_car_approved_by",
        using: "BTREE",
        fields: [
          { name: "approved_by" },
        ]
      },
      {
        name: "fk_car_executed_by",
        using: "BTREE",
        fields: [
          { name: "executed_by" },
        ]
      },
    ]
  });
  }
}
