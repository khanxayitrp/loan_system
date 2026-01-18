import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { partners, partnersId } from './partners';

export interface loan_paymentsAttributes {
  id: number;
  loan_application_id: number;
  partner_id?: number;
  amount: number;
  payment_type: 'cash' | 'bank_transfer';
  payment_slip?: string;
  payment_date?: Date;
  remark?: string;
  status?: 'pending' | 'verified' | 'rejected';
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type loan_paymentsPk = "id";
export type loan_paymentsId = loan_payments[loan_paymentsPk];
export type loan_paymentsOptionalAttributes = "id" | "partner_id" | "payment_slip" | "payment_date" | "remark" | "status" | "created_by" | "created_at" | "updated_at";
export type loan_paymentsCreationAttributes = Optional<loan_paymentsAttributes, loan_paymentsOptionalAttributes>;

export class loan_payments extends Model<loan_paymentsAttributes, loan_paymentsCreationAttributes> implements loan_paymentsAttributes {
  id!: number;
  loan_application_id!: number;
  partner_id?: number;
  amount!: number;
  payment_type!: 'cash' | 'bank_transfer';
  payment_slip?: string;
  payment_date?: Date;
  remark?: string;
  status?: 'pending' | 'verified' | 'rejected';
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;

  // loan_payments belongsTo loan_applications via loan_application_id
  loan_application!: loan_applications;
  getLoan_application!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setLoan_application!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createLoan_application!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_payments belongsTo partners via partner_id
  partner!: partners;
  getPartner!: Sequelize.BelongsToGetAssociationMixin<partners>;
  setPartner!: Sequelize.BelongsToSetAssociationMixin<partners, partnersId>;
  createPartner!: Sequelize.BelongsToCreateAssociationMixin<partners>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_payments {
    return loan_payments.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    loan_application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loan_applications',
        key: 'id'
      }
    },
    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'partners',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    payment_type: {
      type: DataTypes.ENUM('cash','bank_transfer'),
      allowNull: false
    },
    payment_slip: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending','verified','rejected'),
      allowNull: true,
      defaultValue: "pending"
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'loan_payments',
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
        name: "fk_payment_loan",
        using: "BTREE",
        fields: [
          { name: "loan_application_id" },
        ]
      },
      {
        name: "fk_payment_partner",
        using: "BTREE",
        fields: [
          { name: "partner_id" },
        ]
      },
    ]
  });
  }
}
