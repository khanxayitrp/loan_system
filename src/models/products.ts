import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { partners, partnersId } from './partners';
import type { product_types, product_typesId } from './product_types';

export interface productsAttributes {
  id: number;
  partner_id: number;
  product_type_id?: number;
  product_name: string;
  description?: string;
  price: number;
  interest_rate: number;
  image_url?: string;
  gallery?: object;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type productsPk = "id";
export type productsId = products[productsPk];
export type productsOptionalAttributes = "id" | "product_type_id" | "description" | "image_url" | "gallery" | "is_active" | "created_at" | "updated_at";
export type productsCreationAttributes = Optional<productsAttributes, productsOptionalAttributes>;

export class products extends Model<productsAttributes, productsCreationAttributes> implements productsAttributes {
  id!: number;
  partner_id!: number;
  product_type_id?: number;
  product_name!: string;
  description?: string;
  price!: number;
  interest_rate!: number;
  image_url?: string;
  gallery?: object;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;

  // products belongsTo partners via partner_id
  partner!: partners;
  getPartner!: Sequelize.BelongsToGetAssociationMixin<partners>;
  setPartner!: Sequelize.BelongsToSetAssociationMixin<partners, partnersId>;
  createPartner!: Sequelize.BelongsToCreateAssociationMixin<partners>;
  // products belongsTo product_types via product_type_id
  product_type!: product_types;
  getProduct_type!: Sequelize.BelongsToGetAssociationMixin<product_types>;
  setProduct_type!: Sequelize.BelongsToSetAssociationMixin<product_types, product_typesId>;
  createProduct_type!: Sequelize.BelongsToCreateAssociationMixin<product_types>;
  // products hasMany loan_applications via product_id
  loan_applications!: loan_applications[];
  getLoan_applications!: Sequelize.HasManyGetAssociationsMixin<loan_applications>;
  setLoan_applications!: Sequelize.HasManySetAssociationsMixin<loan_applications, loan_applicationsId>;
  addLoan_application!: Sequelize.HasManyAddAssociationMixin<loan_applications, loan_applicationsId>;
  addLoan_applications!: Sequelize.HasManyAddAssociationsMixin<loan_applications, loan_applicationsId>;
  createLoan_application!: Sequelize.HasManyCreateAssociationMixin<loan_applications>;
  removeLoan_application!: Sequelize.HasManyRemoveAssociationMixin<loan_applications, loan_applicationsId>;
  removeLoan_applications!: Sequelize.HasManyRemoveAssociationsMixin<loan_applications, loan_applicationsId>;
  hasLoan_application!: Sequelize.HasManyHasAssociationMixin<loan_applications, loan_applicationsId>;
  hasLoan_applications!: Sequelize.HasManyHasAssociationsMixin<loan_applications, loan_applicationsId>;
  countLoan_applications!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof products {
    return products.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    partner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'partners',
        key: 'id'
      }
    },
    product_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_types',
        key: 'id'
      }
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gallery: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'products',
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
      {
        name: "product_type_id",
        using: "BTREE",
        fields: [
          { name: "product_type_id" },
        ]
      },
    ]
  });
  }
}
