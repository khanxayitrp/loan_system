import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { products, productsId } from './products';

export interface product_galleryAttributes {
  id: number;
  product_id: number;
  image_url: string;
}

export type product_galleryPk = "id";
export type product_galleryId = product_gallery[product_galleryPk];
export type product_galleryOptionalAttributes = "id";
export type product_galleryCreationAttributes = Optional<product_galleryAttributes, product_galleryOptionalAttributes>;

export class product_gallery extends Model<product_galleryAttributes, product_galleryCreationAttributes> implements product_galleryAttributes {
  id!: number;
  product_id!: number;
  image_url!: string;

  // product_gallery belongsTo products via product_id
  product!: products;
  getProduct!: Sequelize.BelongsToGetAssociationMixin<products>;
  setProduct!: Sequelize.BelongsToSetAssociationMixin<products, productsId>;
  createProduct!: Sequelize.BelongsToCreateAssociationMixin<products>;

  static initModel(sequelize: Sequelize.Sequelize): typeof product_gallery {
    return product_gallery.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'product_gallery',
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
        name: "product_gallery_products_FK",
        using: "BTREE",
        fields: [
          { name: "product_id" },
        ]
      },
    ]
  });
  }
}
