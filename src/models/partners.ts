import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { product_types, product_typesId } from './product_types';
import type { products, productsId } from './products';
import type { users, usersId } from './users';

export interface partnersAttributes {
  id: number;
  user_id: number;
  shop_name: string;
  contact_number?: string;
  shop_logo_url?: string;
  address?: string;
}

export type partnersPk = "id";
export type partnersId = partners[partnersPk];
export type partnersOptionalAttributes = "id" | "contact_number" | "shop_logo_url" | "address";
export type partnersCreationAttributes = Optional<partnersAttributes, partnersOptionalAttributes>;

export class partners extends Model<partnersAttributes, partnersCreationAttributes> implements partnersAttributes {
  id!: number;
  user_id!: number;
  shop_name!: string;
  contact_number?: string;
  shop_logo_url?: string;
  address?: string;

  // partners hasMany product_types via partner_id
  product_types!: product_types[];
  getProduct_types!: Sequelize.HasManyGetAssociationsMixin<product_types>;
  setProduct_types!: Sequelize.HasManySetAssociationsMixin<product_types, product_typesId>;
  addProduct_type!: Sequelize.HasManyAddAssociationMixin<product_types, product_typesId>;
  addProduct_types!: Sequelize.HasManyAddAssociationsMixin<product_types, product_typesId>;
  createProduct_type!: Sequelize.HasManyCreateAssociationMixin<product_types>;
  removeProduct_type!: Sequelize.HasManyRemoveAssociationMixin<product_types, product_typesId>;
  removeProduct_types!: Sequelize.HasManyRemoveAssociationsMixin<product_types, product_typesId>;
  hasProduct_type!: Sequelize.HasManyHasAssociationMixin<product_types, product_typesId>;
  hasProduct_types!: Sequelize.HasManyHasAssociationsMixin<product_types, product_typesId>;
  countProduct_types!: Sequelize.HasManyCountAssociationsMixin;
  // partners hasMany products via partner_id
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
  // partners belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof partners {
    return partners.init({
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
    shop_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    shop_logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'partners',
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
