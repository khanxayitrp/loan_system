import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { customers, customersId } from './customers';

export interface customer_pointsAttributes {
  id: number;
  customer_id: number;
  total_points: number;
  updated_at?: Date;
}

export type customer_pointsPk = "id";
export type customer_pointsId = customer_points[customer_pointsPk];
export type customer_pointsOptionalAttributes = "id" | "total_points" | "updated_at";
export type customer_pointsCreationAttributes = Optional<customer_pointsAttributes, customer_pointsOptionalAttributes>;

export class customer_points extends Model<customer_pointsAttributes, customer_pointsCreationAttributes> implements customer_pointsAttributes {
  id!: number;
  customer_id!: number;
  total_points!: number;
  updated_at?: Date;

  // customer_points belongsTo customers via customer_id
  customer!: customers;
  getCustomer!: Sequelize.BelongsToGetAssociationMixin<customers>;
  setCustomer!: Sequelize.BelongsToSetAssociationMixin<customers, customersId>;
  createCustomer!: Sequelize.BelongsToCreateAssociationMixin<customers>;

  static initModel(sequelize: Sequelize.Sequelize): typeof customer_points {
    return customer_points.init({
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
      },
      unique: "customer_points_ibfk_1"
    },
    total_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'customer_points',
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
        name: "customer_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "customer_id" },
        ]
      },
    ]
  });
  }
}
