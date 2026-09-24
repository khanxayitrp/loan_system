import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_accounts, credit_accountsId } from './credit_accounts';
import type { customers, customersId } from './customers';

export interface credit_reservationsAttributes {
  id: number;
  reservation_no: string;
  credit_account_id: number;
  customer_id: number;
  reference_type: string;
  reference_id: number;
  amount: number;
  status: 'RESERVED' | 'CAPTURED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
  idempotency_key: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type credit_reservationsPk = "id";
export type credit_reservationsId = credit_reservations[credit_reservationsPk];
export type credit_reservationsOptionalAttributes = "id" | "status" | "expires_at" | "created_at" | "updated_at";
export type credit_reservationsCreationAttributes = Optional<credit_reservationsAttributes, credit_reservationsOptionalAttributes>;

export class credit_reservations extends Model<credit_reservationsAttributes, credit_reservationsCreationAttributes> implements credit_reservationsAttributes {
  id!: number;
  reservation_no!: string;
  credit_account_id!: number;
  customer_id!: number;
  reference_type!: string;
  reference_id!: number;
  amount!: number;
  status!: 'RESERVED' | 'CAPTURED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
  idempotency_key!: string;
  expires_at?: Date;
  created_at!: Date;
  updated_at!: Date;

  // credit_reservations belongsTo credit_accounts via credit_account_id
  credit_account!: credit_accounts;
  getCredit_account!: Sequelize.BelongsToGetAssociationMixin<credit_accounts>;
  setCredit_account!: Sequelize.BelongsToSetAssociationMixin<credit_accounts, credit_accountsId>;
  createCredit_account!: Sequelize.BelongsToCreateAssociationMixin<credit_accounts>;
  // credit_reservations belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_reservations {
    return credit_reservations.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    reservation_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uk_cr_reservation_no"
    },
    credit_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'credit_accounts',
        key: 'id'
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    reference_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('RESERVED','CAPTURED','RELEASED','EXPIRED','CANCELLED'),
      allowNull: false,
      defaultValue: "RESERVED"
    },
    idempotency_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "uk_cr_idempotency"
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
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
  }, {
    sequelize,
    tableName: 'credit_reservations',
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
        name: "uk_cr_reservation_no",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "reservation_no" },
        ]
      },
      {
        name: "uk_cr_idempotency",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idempotency_key" },
        ]
      },
      {
        name: "idx_cr_account_status",
        using: "BTREE",
        fields: [
          { name: "credit_account_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_cr_reference",
        using: "BTREE",
        fields: [
          { name: "reference_type" },
          { name: "reference_id" },
        ]
      },
      {
        name: "idx_cr_expiry",
        using: "BTREE",
        fields: [
          { name: "status" },
          { name: "expires_at" },
        ]
      },
      {
        name: "fk_cr_customer",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
    ]
  });
  }
}
