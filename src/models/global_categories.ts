import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { products, productsId } from './products';

export interface global_categoriesAttributes {
  id: number;
  category_name: string;
  prefix_code: string;
  description?: string;
  icon_url?: string;
  is_active?: number;
  created_at?: Date;
}

export type global_categoriesPk = "id";
export type global_categoriesId = global_categories[global_categoriesPk];
export type global_categoriesOptionalAttributes = "id" | "description" | "icon_url" | "is_active" | "created_at";
export type global_categoriesCreationAttributes = Optional<global_categoriesAttributes, global_categoriesOptionalAttributes>;

export class global_categories extends Model<global_categoriesAttributes, global_categoriesCreationAttributes> implements global_categoriesAttributes {
  id!: number;
  category_name!: string;
  prefix_code!: string;
  description?: string;
  icon_url?: string;
  is_active?: number;
  created_at?: Date;

  // global_categories hasMany products via global_category_id
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

  static initModel(sequelize: Sequelize.Sequelize): typeof global_categories {
    return global_categories.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    prefix_code: {
      type: DataTypes.STRING(5),
      allowNull: false,
      comment: "ตัวย่อหมวดหมู่ 2-3 ตัวอักษร เช่น MB, MC, GD",
      unique: "prefix_code"
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    icon_url: {
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
    tableName: 'global_categories',
    timestamps: true,
    createdAt: 'created_at',    // แมปชื่อให้ตรงกับใน DB
    updatedAt: false,
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
        name: "prefix_code",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "prefix_code" },
        ]
      },
    ]
  });
  }
}
