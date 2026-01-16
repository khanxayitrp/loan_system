import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { users, usersId } from './users';

export interface promotionsAttributes {
  id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active?: number;
  created_by?: number;
}

export type promotionsPk = "id";
export type promotionsId = promotions[promotionsPk];
export type promotionsOptionalAttributes = "id" | "description" | "start_date" | "end_date" | "is_active" | "created_by";
export type promotionsCreationAttributes = Optional<promotionsAttributes, promotionsOptionalAttributes>;

export class promotions extends Model<promotionsAttributes, promotionsCreationAttributes> implements promotionsAttributes {
  id!: number;
  title!: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active?: number;
  created_by?: number;

  // promotions belongsTo users via created_by
  created_by_user!: users;
  getCreated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof promotions {
    return promotions.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'promotions',
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
        name: "created_by",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
    ]
  });
  }
}
