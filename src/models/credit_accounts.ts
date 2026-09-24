import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_account_requests, credit_account_requestsId } from './credit_account_requests';
import type { credit_behavior_events, credit_behavior_eventsId } from './credit_behavior_events';
import type { credit_ledger, credit_ledgerId } from './credit_ledger';
import type { credit_reservations, credit_reservationsId } from './credit_reservations';
import type { credit_risk_alerts, credit_risk_alertsId } from './credit_risk_alerts';
import type { customers, customersId } from './customers';
import type { member_cards, member_cardsId } from './member_cards';

export interface credit_accountsAttributes {
  id: number;
  customer_id: number;
  account_no: string;
  credit_limit: number;
  utilized_amount: number;
  pending_amount: number;
  available_amount?: number;
  status?: 'active' | 'suspended' | 'closed';
  opened_at?: Date;
  last_reviewed_at?: Date;
  version: number;
}

export type credit_accountsPk = "id";
export type credit_accountsId = credit_accounts[credit_accountsPk];
export type credit_accountsOptionalAttributes = "id" | "credit_limit" | "utilized_amount" | "pending_amount" | "available_amount" | "status" | "opened_at" | "last_reviewed_at" | "version";
export type credit_accountsCreationAttributes = Optional<credit_accountsAttributes, credit_accountsOptionalAttributes>;

export class credit_accounts extends Model<credit_accountsAttributes, credit_accountsCreationAttributes> implements credit_accountsAttributes {
  id!: number;
  customer_id!: number;
  account_no!: string;
  credit_limit!: number;
  utilized_amount!: number;
  pending_amount!: number;
  available_amount?: number;
  status?: 'active' | 'suspended' | 'closed';
  opened_at?: Date;
  last_reviewed_at?: Date;
  version!: number;

  // credit_accounts hasMany credit_account_requests via credit_account_id
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
  // credit_accounts hasMany credit_behavior_events via credit_account_id
  credit_behavior_events!: credit_behavior_events[];
  getCredit_behavior_events!: Sequelize.HasManyGetAssociationsMixin<credit_behavior_events>;
  setCredit_behavior_events!: Sequelize.HasManySetAssociationsMixin<credit_behavior_events, credit_behavior_eventsId>;
  addCredit_behavior_event!: Sequelize.HasManyAddAssociationMixin<credit_behavior_events, credit_behavior_eventsId>;
  addCredit_behavior_events!: Sequelize.HasManyAddAssociationsMixin<credit_behavior_events, credit_behavior_eventsId>;
  createCredit_behavior_event!: Sequelize.HasManyCreateAssociationMixin<credit_behavior_events>;
  removeCredit_behavior_event!: Sequelize.HasManyRemoveAssociationMixin<credit_behavior_events, credit_behavior_eventsId>;
  removeCredit_behavior_events!: Sequelize.HasManyRemoveAssociationsMixin<credit_behavior_events, credit_behavior_eventsId>;
  hasCredit_behavior_event!: Sequelize.HasManyHasAssociationMixin<credit_behavior_events, credit_behavior_eventsId>;
  hasCredit_behavior_events!: Sequelize.HasManyHasAssociationsMixin<credit_behavior_events, credit_behavior_eventsId>;
  countCredit_behavior_events!: Sequelize.HasManyCountAssociationsMixin;
  // credit_accounts hasMany credit_ledger via credit_account_id
  credit_ledgers!: credit_ledger[];
  getCredit_ledgers!: Sequelize.HasManyGetAssociationsMixin<credit_ledger>;
  setCredit_ledgers!: Sequelize.HasManySetAssociationsMixin<credit_ledger, credit_ledgerId>;
  addCredit_ledger!: Sequelize.HasManyAddAssociationMixin<credit_ledger, credit_ledgerId>;
  addCredit_ledgers!: Sequelize.HasManyAddAssociationsMixin<credit_ledger, credit_ledgerId>;
  createCredit_ledger!: Sequelize.HasManyCreateAssociationMixin<credit_ledger>;
  removeCredit_ledger!: Sequelize.HasManyRemoveAssociationMixin<credit_ledger, credit_ledgerId>;
  removeCredit_ledgers!: Sequelize.HasManyRemoveAssociationsMixin<credit_ledger, credit_ledgerId>;
  hasCredit_ledger!: Sequelize.HasManyHasAssociationMixin<credit_ledger, credit_ledgerId>;
  hasCredit_ledgers!: Sequelize.HasManyHasAssociationsMixin<credit_ledger, credit_ledgerId>;
  countCredit_ledgers!: Sequelize.HasManyCountAssociationsMixin;
  // credit_accounts hasMany credit_reservations via credit_account_id
  credit_reservations!: credit_reservations[];
  getCredit_reservations!: Sequelize.HasManyGetAssociationsMixin<credit_reservations>;
  setCredit_reservations!: Sequelize.HasManySetAssociationsMixin<credit_reservations, credit_reservationsId>;
  addCredit_reservation!: Sequelize.HasManyAddAssociationMixin<credit_reservations, credit_reservationsId>;
  addCredit_reservations!: Sequelize.HasManyAddAssociationsMixin<credit_reservations, credit_reservationsId>;
  createCredit_reservation!: Sequelize.HasManyCreateAssociationMixin<credit_reservations>;
  removeCredit_reservation!: Sequelize.HasManyRemoveAssociationMixin<credit_reservations, credit_reservationsId>;
  removeCredit_reservations!: Sequelize.HasManyRemoveAssociationsMixin<credit_reservations, credit_reservationsId>;
  hasCredit_reservation!: Sequelize.HasManyHasAssociationMixin<credit_reservations, credit_reservationsId>;
  hasCredit_reservations!: Sequelize.HasManyHasAssociationsMixin<credit_reservations, credit_reservationsId>;
  countCredit_reservations!: Sequelize.HasManyCountAssociationsMixin;
  // credit_accounts hasMany credit_risk_alerts via credit_account_id
  credit_risk_alerts!: credit_risk_alerts[];
  getCredit_risk_alerts!: Sequelize.HasManyGetAssociationsMixin<credit_risk_alerts>;
  setCredit_risk_alerts!: Sequelize.HasManySetAssociationsMixin<credit_risk_alerts, credit_risk_alertsId>;
  addCredit_risk_alert!: Sequelize.HasManyAddAssociationMixin<credit_risk_alerts, credit_risk_alertsId>;
  addCredit_risk_alerts!: Sequelize.HasManyAddAssociationsMixin<credit_risk_alerts, credit_risk_alertsId>;
  createCredit_risk_alert!: Sequelize.HasManyCreateAssociationMixin<credit_risk_alerts>;
  removeCredit_risk_alert!: Sequelize.HasManyRemoveAssociationMixin<credit_risk_alerts, credit_risk_alertsId>;
  removeCredit_risk_alerts!: Sequelize.HasManyRemoveAssociationsMixin<credit_risk_alerts, credit_risk_alertsId>;
  hasCredit_risk_alert!: Sequelize.HasManyHasAssociationMixin<credit_risk_alerts, credit_risk_alertsId>;
  hasCredit_risk_alerts!: Sequelize.HasManyHasAssociationsMixin<credit_risk_alerts, credit_risk_alertsId>;
  countCredit_risk_alerts!: Sequelize.HasManyCountAssociationsMixin;
  // credit_accounts hasMany member_cards via credit_account_id
  member_cards!: member_cards[];
  getMember_cards!: Sequelize.HasManyGetAssociationsMixin<member_cards>;
  setMember_cards!: Sequelize.HasManySetAssociationsMixin<member_cards, member_cardsId>;
  addMember_card!: Sequelize.HasManyAddAssociationMixin<member_cards, member_cardsId>;
  addMember_cards!: Sequelize.HasManyAddAssociationsMixin<member_cards, member_cardsId>;
  createMember_card!: Sequelize.HasManyCreateAssociationMixin<member_cards>;
  removeMember_card!: Sequelize.HasManyRemoveAssociationMixin<member_cards, member_cardsId>;
  removeMember_cards!: Sequelize.HasManyRemoveAssociationsMixin<member_cards, member_cardsId>;
  hasMember_card!: Sequelize.HasManyHasAssociationMixin<member_cards, member_cardsId>;
  hasMember_cards!: Sequelize.HasManyHasAssociationsMixin<member_cards, member_cardsId>;
  countMember_cards!: Sequelize.HasManyCountAssociationsMixin;
  // credit_accounts belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_accounts {
    return credit_accounts.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      unique: "fk_ca_cust_acct"
    },
    account_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "idx_ca_unique_account"
    },
    credit_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    utilized_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    pending_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    available_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active','suspended','closed'),
      allowNull: true,
      defaultValue: "active"
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    last_reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'credit_accounts',
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
        name: "idx_ca_unique_customer",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
      {
        name: "idx_ca_unique_account",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "account_no" },
        ]
      },
    ]
  });
  }
}
