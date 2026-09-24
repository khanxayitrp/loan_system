import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_accounts, credit_accountsId } from './credit_accounts';
import type { customers, customersId } from './customers';

export interface credit_behavior_eventsAttributes {
  id: number;
  customer_id: number;
  credit_account_id?: number;
  event_type: 'ACCOUNT_OPENED' | 'PURCHASE' | 'PAYMENT_ON_TIME' | 'PAYMENT_LATE' | 'PAYMENT_MISSED' | 'FRAUD_FLAG';
  reference_type?: string;
  reference_id?: number;
  event_value?: number;
  event_date?: Date;
}

export type credit_behavior_eventsPk = "id";
export type credit_behavior_eventsId = credit_behavior_events[credit_behavior_eventsPk];
export type credit_behavior_eventsOptionalAttributes = "id" | "credit_account_id" | "reference_type" | "reference_id" | "event_value" | "event_date";
export type credit_behavior_eventsCreationAttributes = Optional<credit_behavior_eventsAttributes, credit_behavior_eventsOptionalAttributes>;

export class credit_behavior_events extends Model<credit_behavior_eventsAttributes, credit_behavior_eventsCreationAttributes> implements credit_behavior_eventsAttributes {
  id!: number;
  customer_id!: number;
  credit_account_id?: number;
  event_type!: 'ACCOUNT_OPENED' | 'PURCHASE' | 'PAYMENT_ON_TIME' | 'PAYMENT_LATE' | 'PAYMENT_MISSED' | 'FRAUD_FLAG';
  reference_type?: string;
  reference_id?: number;
  event_value?: number;
  event_date?: Date;

  // credit_behavior_events belongsTo credit_accounts via credit_account_id
  credit_account!: credit_accounts;
  getCredit_account!: Sequelize.BelongsToGetAssociationMixin<credit_accounts>;
  setCredit_account!: Sequelize.BelongsToSetAssociationMixin<credit_accounts, credit_accountsId>;
  createCredit_account!: Sequelize.BelongsToCreateAssociationMixin<credit_accounts>;
  // credit_behavior_events belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_behavior_events {
    return credit_behavior_events.init({
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
    credit_account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'credit_accounts',
        key: 'id'
      }
    },
    event_type: {
      type: DataTypes.ENUM('ACCOUNT_OPENED','PURCHASE','PAYMENT_ON_TIME','PAYMENT_LATE','PAYMENT_MISSED','FRAUD_FLAG'),
      allowNull: false
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    event_value: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    event_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'credit_behavior_events',
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
        name: "idx_cbe_cust_event",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "event_type" },
        ]
      },
      {
        name: "fk_cbe_acct",
        using: "BTREE",
        fields: [
          { name: "credit_account_id" },
        ]
      },
    ]
  });
  }
}
