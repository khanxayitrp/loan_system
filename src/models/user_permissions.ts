import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { features, featuresId } from './features';
import type { users, usersId } from './users';

export interface user_permissionsAttributes {
  user_id: number;
  feature_id: number;
  can_access?: number;
}

export type user_permissionsPk = "user_id" | "feature_id";
export type user_permissionsId = user_permissions[user_permissionsPk];
export type user_permissionsOptionalAttributes = "can_access";
export type user_permissionsCreationAttributes = Optional<user_permissionsAttributes, user_permissionsOptionalAttributes>;

export class user_permissions extends Model<user_permissionsAttributes, user_permissionsCreationAttributes> implements user_permissionsAttributes {
  user_id!: number;
  feature_id!: number;
  can_access?: number;

  // user_permissions belongsTo features via feature_id
  feature!: features;
  getFeature!: Sequelize.BelongsToGetAssociationMixin<features>;
  setFeature!: Sequelize.BelongsToSetAssociationMixin<features, featuresId>;
  createFeature!: Sequelize.BelongsToCreateAssociationMixin<features>;
  // user_permissions belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof user_permissions {
    return user_permissions.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    feature_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'features',
        key: 'id'
      }
    },
    can_access: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'user_permissions',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "user_id" },
          { name: "feature_id" },
        ]
      },
      {
        name: "feature_id",
        using: "BTREE",
        fields: [
          { name: "feature_id" },
        ]
      },
    ]
  });
  }
}
