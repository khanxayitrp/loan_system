import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { users, usersId } from './users';

export interface credit_scoring_rulesAttributes {
  id: number;
  rule_code: string;
  rule_name: string;
  rule_type: string;
  version: string;
  weight?: number;
  config_json: object;
  effective_from: Date;
  effective_to?: Date;
  is_active: number;
  created_by?: number;
  created_at: Date;
}

export type credit_scoring_rulesPk = "id";
export type credit_scoring_rulesId = credit_scoring_rules[credit_scoring_rulesPk];
export type credit_scoring_rulesOptionalAttributes = "id" | "weight" | "effective_to" | "is_active" | "created_by" | "created_at";
export type credit_scoring_rulesCreationAttributes = Optional<credit_scoring_rulesAttributes, credit_scoring_rulesOptionalAttributes>;

export class credit_scoring_rules extends Model<credit_scoring_rulesAttributes, credit_scoring_rulesCreationAttributes> implements credit_scoring_rulesAttributes {
  id!: number;
  rule_code!: string;
  rule_name!: string;
  rule_type!: string;
  version!: string;
  weight?: number;
  config_json!: object;
  effective_from!: Date;
  effective_to?: Date;
  is_active!: number;
  created_by?: number;
  created_at!: Date;

  // credit_scoring_rules belongsTo users via created_by
  created_by_user!: users;
  getCreated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_scoring_rules {
    return credit_scoring_rules.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    rule_code: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    rule_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rule_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    weight: {
      type: DataTypes.DECIMAL(10,4),
      allowNull: true
    },
    config_json: {
      type: DataTypes.JSON,
      allowNull: false
    },
    effective_from: {
      type: DataTypes.DATE,
      allowNull: false
    },
    effective_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
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
    
  }, {
    sequelize,
    tableName: 'credit_scoring_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
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
        name: "uk_csr_rule_version",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "rule_code" },
          { name: "version" },
        ]
      },
      {
        name: "idx_csr_active_effective",
        using: "BTREE",
        fields: [
          { name: "is_active" },
          { name: "effective_from" },
          { name: "effective_to" },
        ]
      },
      {
        name: "fk_csr_created_by",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
    ]
  });
  }
}
