import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { districts, districtsId } from './districts';

export interface provincesAttributes {
  id: number;
  province_id: string;
  province_name: string;
  created_at?: Date;
  updated_at?: Date;
}

export type provincesPk = "id";
export type provincesId = provinces[provincesPk];
export type provincesOptionalAttributes = "id" | "created_at" | "updated_at";
export type provincesCreationAttributes = Optional<provincesAttributes, provincesOptionalAttributes>;

export class provinces extends Model<provincesAttributes, provincesCreationAttributes> implements provincesAttributes {
  id!: number;
  province_id!: string;
  province_name!: string;
  created_at?: Date;
  updated_at?: Date;

  // provinces hasMany districts via province_id
  districts!: districts[];
  getDistricts!: Sequelize.HasManyGetAssociationsMixin<districts>;
  setDistricts!: Sequelize.HasManySetAssociationsMixin<districts, districtsId>;
  addDistrict!: Sequelize.HasManyAddAssociationMixin<districts, districtsId>;
  addDistricts!: Sequelize.HasManyAddAssociationsMixin<districts, districtsId>;
  createDistrict!: Sequelize.HasManyCreateAssociationMixin<districts>;
  removeDistrict!: Sequelize.HasManyRemoveAssociationMixin<districts, districtsId>;
  removeDistricts!: Sequelize.HasManyRemoveAssociationsMixin<districts, districtsId>;
  hasDistrict!: Sequelize.HasManyHasAssociationMixin<districts, districtsId>;
  hasDistricts!: Sequelize.HasManyHasAssociationsMixin<districts, districtsId>;
  countDistricts!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof provinces {
    return provinces.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    province_id: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: "province_id"
    },
    province_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'provinces',
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
        name: "province_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "province_id" },
        ]
      },
    ]
  });
  }
}
