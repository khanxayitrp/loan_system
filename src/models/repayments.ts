import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { payment_transactions, payment_transactionsId } from './payment_transactions';

export interface repaymentsAttributes {
  id: number;
  application_id: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  total_due: number;
  discounts?: number;
  penalty?: number;
  remaining_principal: number;
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  paid_at?: Date;
}

export type repaymentsPk = "id";
export type repaymentsId = repayments[repaymentsPk];
export type repaymentsOptionalAttributes = "id" | "discounts" | "penalty" | "payment_status" | "paid_at";
export type repaymentsCreationAttributes = Optional<repaymentsAttributes, repaymentsOptionalAttributes>;

export class repayments extends Model<repaymentsAttributes, repaymentsCreationAttributes> implements repaymentsAttributes {
  id!: number;
  application_id!: number;
  due_date!: string;
  principal_amount!: number;
  interest_amount!: number;
  total_due!: number;
  discounts?: number;
  penalty?: number;
  remaining_principal!: number;
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  paid_at?: Date;

  // repayments belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // repayments hasMany payment_transactions via schedule_id
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

  static initModel(sequelize: Sequelize.Sequelize): typeof repayments {
    return repayments.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loan_applications',
        key: 'id'
      }
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    principal_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    interest_amount: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    total_due: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    discounts: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    penalty: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    remaining_principal: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid','partial','paid','overdue'),
      allowNull: true,
      defaultValue: "unpaid"
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'repayments',
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
        name: "application_id",
        using: "BTREE",
        fields: [
          { name: "application_id" },
        ]
      },
    ]
  });
  }
}
