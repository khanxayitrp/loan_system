import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface user_devicesAttributes {
  id: number;
  owner_type: string;
  owner_id: number;
  device_token: string;
  platform: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type user_devicesPk = "id";
export type user_devicesId = user_devices[user_devicesPk];
export type user_devicesOptionalAttributes = "id" | "is_active" | "created_at" | "updated_at";
export type user_devicesCreationAttributes = Optional<user_devicesAttributes, user_devicesOptionalAttributes>;

export class user_devices extends Model<user_devicesAttributes, user_devicesCreationAttributes> implements user_devicesAttributes {
  id!: number;
  owner_type!: string;
  owner_id!: number;
  device_token!: string;
  platform!: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof user_devices {
    return user_devices.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    owner_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "เช่น CUSTOMER, STAFF"
    },
    owner_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "รหัสของลูกค้าหรือพนักงาน"
    },
    device_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "FCM Token หรือ APNs Token",
      unique: "idx_unique_device_token"
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "เช่น IOS, ANDROID, WEB"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1,
      comment: "ถ้าส่งไม่ผ่านให้ปรับเป็น FALSE"
    }
  }, {
    sequelize,
    tableName: 'user_devices',
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
        name: "idx_unique_device_token",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "device_token" },
        ]
      },
      {
        name: "idx_owner_active_devices",
        using: "BTREE",
        fields: [
          { name: "owner_type" },
          { name: "owner_id" },
          { name: "is_active" },
        ]
      },
    ]
  });
  }
}
