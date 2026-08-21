import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface membership_tiersAttributes {
  id: number;
  tier_name: string;
  min_score: number;
  base_credit_limit: number;
  cash_advance_percent: number;
  benefits_desc?: string;
}

export type membership_tiersPk = "id";
export type membership_tiersId = membership_tiers[membership_tiersPk];
export type membership_tiersOptionalAttributes = "id" | "min_score" | "cash_advance_percent" | "benefits_desc";
export type membership_tiersCreationAttributes = Optional<membership_tiersAttributes, membership_tiersOptionalAttributes>;

export class membership_tiers extends Model<membership_tiersAttributes, membership_tiersCreationAttributes> implements membership_tiersAttributes {
  id!: number;
  tier_name!: string;
  min_score!: number;
  base_credit_limit!: number;
  cash_advance_percent!: number;
  benefits_desc?: string;

  // membership_tiers hasMany customers via membership_tier_id
  customers!: customers[];
  getCustomers!: Sequelize.HasManyGetAssociationsMixin<customers>;
  setCustomers!: Sequelize.HasManySetAssociationsMixin<customers, customersId>;
  addCustomer!: Sequelize.HasManyAddAssociationMixin<customers, customersId>;
  addCustomers!: Sequelize.HasManyAddAssociationsMixin<customers, customersId>;
  createCustomer!: Sequelize.HasManyCreateAssociationMixin<customers>;
  removeCustomer!: Sequelize.HasManyRemoveAssociationMixin<customers, customersId>;
  removeCustomers!: Sequelize.HasManyRemoveAssociationsMixin<customers, customersId>;
  hasCustomer!: Sequelize.HasManyHasAssociationMixin<customers, customersId>;
  hasCustomers!: Sequelize.HasManyHasAssociationsMixin<customers, customersId>;
  countCustomers!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_tiers {
    return membership_tiers.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    tier_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Silver, Gold, Platinum, Infinity"
    },
    min_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "คะแนนขั้นต่ำในการขึ้นระดับนี้"
    },
    base_credit_limit: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      comment: "วงเงินเริ่มต้นที่ระบบจะอนุมัติให้เมื่อได้ Rank นี้"
    },
    cash_advance_percent: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false,
      defaultValue: 30.00,
      comment: "เปอร์เซ็นต์ที่สามารถถอนเป็นเงินสดได้ (ค่าเริ่มต้น 30.00)"
    },
    benefits_desc: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "สิทธิประโยชน์อื่นๆ"
    }
  }, {
    sequelize,
    tableName: 'membership_tiers',
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
    ]
  });
  }
}
