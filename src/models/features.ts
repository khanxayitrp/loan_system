import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { user_permissions, user_permissionsId } from './user_permissions';
import type { users, usersId } from './users';

export interface featuresAttributes {
  id: number;
  feature_name: string;
  description?: string;
}

export type featuresPk = "id";
export type featuresId = features[featuresPk];
export type featuresOptionalAttributes = "id" | "description";
export type featuresCreationAttributes = Optional<featuresAttributes, featuresOptionalAttributes>;

export class features extends Model<featuresAttributes, featuresCreationAttributes> implements featuresAttributes {
  id!: number;
  feature_name!: string;
  description?: string;

  // features hasMany user_permissions via feature_id
  user_permissions!: user_permissions[];
  getUser_permissions!: Sequelize.HasManyGetAssociationsMixin<user_permissions>;
  setUser_permissions!: Sequelize.HasManySetAssociationsMixin<user_permissions, user_permissionsId>;
  addUser_permission!: Sequelize.HasManyAddAssociationMixin<user_permissions, user_permissionsId>;
  addUser_permissions!: Sequelize.HasManyAddAssociationsMixin<user_permissions, user_permissionsId>;
  createUser_permission!: Sequelize.HasManyCreateAssociationMixin<user_permissions>;
  removeUser_permission!: Sequelize.HasManyRemoveAssociationMixin<user_permissions, user_permissionsId>;
  removeUser_permissions!: Sequelize.HasManyRemoveAssociationsMixin<user_permissions, user_permissionsId>;
  hasUser_permission!: Sequelize.HasManyHasAssociationMixin<user_permissions, user_permissionsId>;
  hasUser_permissions!: Sequelize.HasManyHasAssociationsMixin<user_permissions, user_permissionsId>;
  countUser_permissions!: Sequelize.HasManyCountAssociationsMixin;
  // features belongsToMany users via feature_id and user_id
  user_id_users!: users[];
  getUser_id_users!: Sequelize.BelongsToManyGetAssociationsMixin<users>;
  setUser_id_users!: Sequelize.BelongsToManySetAssociationsMixin<users, usersId>;
  addUser_id_user!: Sequelize.BelongsToManyAddAssociationMixin<users, usersId>;
  addUser_id_users!: Sequelize.BelongsToManyAddAssociationsMixin<users, usersId>;
  createUser_id_user!: Sequelize.BelongsToManyCreateAssociationMixin<users>;
  removeUser_id_user!: Sequelize.BelongsToManyRemoveAssociationMixin<users, usersId>;
  removeUser_id_users!: Sequelize.BelongsToManyRemoveAssociationsMixin<users, usersId>;
  hasUser_id_user!: Sequelize.BelongsToManyHasAssociationMixin<users, usersId>;
  hasUser_id_users!: Sequelize.BelongsToManyHasAssociationsMixin<users, usersId>;
  countUser_id_users!: Sequelize.BelongsToManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof features {
    return features.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    feature_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "feature_name"
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'features',
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
        name: "feature_name",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "feature_name" },
        ]
      },
    ]
  });
  }
}
