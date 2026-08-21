import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface membership_historyAttributes {
  id: number;
  customer_id: number;
  old_tier_id?: number;
  new_tier_id: number;
  change_type: 'upgrade' | 'downgrade' | 'initial';
  reason?: string;
  changed_at?: Date;
}

export type membership_historyPk = "id";
export type membership_historyId = membership_history[membership_historyPk];
export type membership_historyOptionalAttributes = "id" | "old_tier_id" | "reason" | "changed_at";
export type membership_historyCreationAttributes = Optional<membership_historyAttributes, membership_historyOptionalAttributes>;

export class membership_history extends Model<membership_historyAttributes, membership_historyCreationAttributes> implements membership_historyAttributes {
  id!: number;
  customer_id!: number;
  old_tier_id?: number;
  new_tier_id!: number;
  change_type!: 'upgrade' | 'downgrade' | 'initial';
  reason?: string;
  changed_at?: Date;

  // membership_history belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_history {
    return membership_history.init({
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
      }
    },
    old_tier_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    new_tier_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    change_type: {
      type: DataTypes.ENUM('upgrade','downgrade','initial'),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "เหตุผล เช่น จ่ายตรงเวลาต่อเนื่อง, หรือค้างชำระ"
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'membership_history',
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
        name: "customer_id",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
    ]
  });
  }
}
