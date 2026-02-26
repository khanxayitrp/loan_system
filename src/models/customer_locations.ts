import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface customer_locationsAttributes {
  id: number;
  customer_id: number;
  location_type: 'home' | 'work' | 'other';
  latitude?: number;
  longitude?: number;
  map_url?: string;
  address_detail?: string;
  is_primary?: number;
}

export type customer_locationsPk = "id";
export type customer_locationsId = customer_locations[customer_locationsPk];
export type customer_locationsOptionalAttributes = "id" | "latitude" | "longitude" | "map_url" | "address_detail" | "is_primary";
export type customer_locationsCreationAttributes = Optional<customer_locationsAttributes, customer_locationsOptionalAttributes>;

export class customer_locations extends Model<customer_locationsAttributes, customer_locationsCreationAttributes> implements customer_locationsAttributes {
  id!: number;
  customer_id!: number;
  location_type!: 'home' | 'work' | 'other';
  latitude?: number;
  longitude?: number;
  map_url?: string;
  address_detail?: string;
  is_primary?: number;

  // customer_locations belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_locations {
    return customer_locations.init({
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
    location_type: {
      type: DataTypes.ENUM('home','work','other'),
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11,8),
      allowNull: true
    },
    map_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address_detail: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'customer_locations',
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
        name: "fk_location_customer",
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
    ]
  });
  }
}
