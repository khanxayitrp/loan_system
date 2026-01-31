import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { partners, partnersId } from './partners';
import type { products, productsId } from './products';

export interface product_typesAttributes {
  id: number;
  partner_id?: number;
  type_name: string;
  description?: string;
  is_active?: number;
  created_at?: Date;
}

export type product_typesPk = "id";
export type product_typesId = product_types[product_typesPk];
export type product_typesOptionalAttributes = "id" | "partner_id" | "description" | "is_active" | "created_at";
export type product_typesCreationAttributes = Optional<product_typesAttributes, product_typesOptionalAttributes>;

export class product_types extends Model<product_typesAttributes, product_typesCreationAttributes> implements product_typesAttributes {
  id!: number;
  partner_id?: number;
  type_name!: string;
  description?: string;
  is_active?: number;
  created_at?: Date;

  // product_types belongsTo partners via partner_id
  partner!: partners;
  getPartner!: Sequelize.BelongsToGetAssociationMixin<partners>;
  setPartner!: Sequelize.BelongsToSetAssociationMixin<partners, partnersId>;
  createPartner!: Sequelize.BelongsToCreateAssociationMixin<partners>;
  // product_types hasMany products via productType_id
  products!: products[];
  getProducts!: Sequelize.HasManyGetAssociationsMixin<products>;
  setProducts!: Sequelize.HasManySetAssociationsMixin<products, productsId>;
  addProduct!: Sequelize.HasManyAddAssociationMixin<products, productsId>;
  addProducts!: Sequelize.HasManyAddAssociationsMixin<products, productsId>;
  createProduct!: Sequelize.HasManyCreateAssociationMixin<products>;
  removeProduct!: Sequelize.HasManyRemoveAssociationMixin<products, productsId>;
  removeProducts!: Sequelize.HasManyRemoveAssociationsMixin<products, productsId>;
  hasProduct!: Sequelize.HasManyHasAssociationMixin<products, productsId>;
  hasProducts!: Sequelize.HasManyHasAssociationsMixin<products, productsId>;
  countProducts!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof product_types {
    return product_types.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'partners',
        key: 'id'
      }
    },
    type_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'product_types',
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
        name: "partner_id",
        using: "BTREE",
        fields: [
          { name: "partner_id" },
        ]
      },
    ]
  });
  }
}
