import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { provinces, provincesId } from './provinces';

export interface districtsAttributes {
  id: number;
  district_id: string;
  district_name: string;
  province_id: string;
  created_at?: Date;
  updated_at?: Date;
}

export type districtsPk = "id";
export type districtsId = districts[districtsPk];
export type districtsOptionalAttributes = "id" | "created_at" | "updated_at";
export type districtsCreationAttributes = Optional<districtsAttributes, districtsOptionalAttributes>;

export class districts extends Model<districtsAttributes, districtsCreationAttributes> implements districtsAttributes {
  id!: number;
  district_id!: string;
  district_name!: string;
  province_id!: string;
  created_at?: Date;
  updated_at?: Date;

  // districts belongsTo provinces via province_id
  province!: provinces;
  getProvince!: Sequelize.BelongsToGetAssociationMixin<provinces>;
  setProvince!: Sequelize.BelongsToSetAssociationMixin<provinces, provincesId>;
  createProvince!: Sequelize.BelongsToCreateAssociationMixin<provinces>;

  static initModel(sequelize: Sequelize.Sequelize): typeof districts {
    return districts.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    district_id: {
      type: DataTypes.STRING(4),
      allowNull: false,
      unique: "district_id"
    },
    district_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    province_id: {
      type: DataTypes.STRING(2),
      allowNull: false,
      references: {
        model: 'provinces',
        key: 'province_id'
      }
    }
  }, {
    sequelize,
    tableName: 'districts',
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
        name: "district_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "district_id" },
        ]
      },
      {
        name: "idx_province_id_ref",
        using: "BTREE",
        fields: [
          { name: "province_id" },
        ]
      },
    ]
  });
  }
}
