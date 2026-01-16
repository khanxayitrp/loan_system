import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { users, usersId } from './users';

export interface user_refresh_tokensAttributes {
  id: number;
  user_id: number;
  token: string;
  device_info?: string;
  ip_address?: string;
  revoked?: number;
  expires_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

export type user_refresh_tokensPk = "id";
export type user_refresh_tokensId = user_refresh_tokens[user_refresh_tokensPk];
export type user_refresh_tokensOptionalAttributes = "id" | "device_info" | "ip_address" | "revoked" | "created_at" | "updated_at";
export type user_refresh_tokensCreationAttributes = Optional<user_refresh_tokensAttributes, user_refresh_tokensOptionalAttributes>;

export class user_refresh_tokens extends Model<user_refresh_tokensAttributes, user_refresh_tokensCreationAttributes> implements user_refresh_tokensAttributes {
  id!: number;
  user_id!: number;
  token!: string;
  device_info?: string;
  ip_address?: string;
  revoked?: number;
  expires_at!: Date;
  created_at?: Date;
  updated_at?: Date;

  // user_refresh_tokens belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof user_refresh_tokens {
    return user_refresh_tokens.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'user_refresh_tokens',
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
        name: "user_id",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
