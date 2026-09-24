import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { membership_applications, membership_applicationsId } from './membership_applications';

export interface membership_credit_purposesAttributes {
  id: number;
  purpose_code: string;
  purpose_name: string;
  description?: string;
  is_active: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export type membership_credit_purposesPk = "id";
export type membership_credit_purposesId = membership_credit_purposes[membership_credit_purposesPk];
export type membership_credit_purposesOptionalAttributes = "id" | "description" | "is_active" | "sort_order" | "created_at" | "updated_at";
export type membership_credit_purposesCreationAttributes = Optional<membership_credit_purposesAttributes, membership_credit_purposesOptionalAttributes>;

export class membership_credit_purposes extends Model<membership_credit_purposesAttributes, membership_credit_purposesCreationAttributes> implements membership_credit_purposesAttributes {
  id!: number;
  purpose_code!: string;
  purpose_name!: string;
  description?: string;
  is_active!: number;
  sort_order!: number;
  created_at!: Date;
  updated_at!: Date;

  // membership_credit_purposes hasMany membership_applications via purpose_id
  membership_applications!: membership_applications[];
  getMembership_applications!: Sequelize.HasManyGetAssociationsMixin<membership_applications>;
  setMembership_applications!: Sequelize.HasManySetAssociationsMixin<membership_applications, membership_applicationsId>;
  addMembership_application!: Sequelize.HasManyAddAssociationMixin<membership_applications, membership_applicationsId>;
  addMembership_applications!: Sequelize.HasManyAddAssociationsMixin<membership_applications, membership_applicationsId>;
  createMembership_application!: Sequelize.HasManyCreateAssociationMixin<membership_applications>;
  removeMembership_application!: Sequelize.HasManyRemoveAssociationMixin<membership_applications, membership_applicationsId>;
  removeMembership_applications!: Sequelize.HasManyRemoveAssociationsMixin<membership_applications, membership_applicationsId>;
  hasMembership_application!: Sequelize.HasManyHasAssociationMixin<membership_applications, membership_applicationsId>;
  hasMembership_applications!: Sequelize.HasManyHasAssociationsMixin<membership_applications, membership_applicationsId>;
  countMembership_applications!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_credit_purposes {
    return membership_credit_purposes.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    purpose_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uk_mcp_code"
    },
    purpose_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'membership_credit_purposes',
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
        name: "uk_mcp_code",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "purpose_code" },
        ]
      },
      {
        name: "idx_mcp_active_sort",
        using: "BTREE",
        fields: [
          { name: "is_active" },
          { name: "sort_order" },
        ]
      },
    ]
  });
  }
}
