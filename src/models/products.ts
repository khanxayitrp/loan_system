import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { cart_items, cart_itemsId } from './cart_items';
import type { global_categories, global_categoriesId } from './global_categories';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { order_items, order_itemsId } from './order_items';
import type { partners, partnersId } from './partners';
import type { product_gallery, product_galleryId } from './product_gallery';
import type { product_reviews, product_reviewsId } from './product_reviews';
import type { product_types, product_typesId } from './product_types';
import type { product_variants, product_variantsId } from './product_variants';
import type { wishlists, wishlistsId } from './wishlists';

export interface productsAttributes {
  id: number;
  partner_id: number;
  productType_id: number;
  global_category_id?: number;
  product_name: string;
  description?: string;
  brand?: string;
  model?: string;
  price: number;
  image_url?: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
  system_sku?: string;
  merchant_sku?: string;
  stock_quantity: number;
  reserved_stock: number;
  allowed_loan_type: 'single_item' | 'bnpl_cart' | 'both';
}

export type productsPk = "id";
export type productsId = products[productsPk];
export type productsOptionalAttributes = "id" | "global_category_id" | "description" | "brand" | "model" | "image_url" | "is_active" | "created_at" | "updated_at" | "system_sku" | "merchant_sku" | "stock_quantity" | "reserved_stock" | "allowed_loan_type";
export type productsCreationAttributes = Optional<productsAttributes, productsOptionalAttributes>;

export class products extends Model<productsAttributes, productsCreationAttributes> implements productsAttributes {
  id!: number;
  partner_id!: number;
  productType_id!: number;
  global_category_id?: number;
  product_name!: string;
  description?: string;
  brand?: string;
  model?: string;
  price!: number;
  image_url?: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
  system_sku?: string;
  merchant_sku?: string;
  stock_quantity!: number;
  reserved_stock!: number;
  allowed_loan_type!: 'single_item' | 'bnpl_cart' | 'both';

  // products belongsTo global_categories via global_category_id
  global_category!: global_categories;
  getGlobal_category!: Sequelize.BelongsToGetAssociationMixin<global_categories>;
  setGlobal_category!: Sequelize.BelongsToSetAssociationMixin<global_categories, global_categoriesId>;
  createGlobal_category!: Sequelize.BelongsToCreateAssociationMixin<global_categories>;
  // products belongsTo partners via partner_id
  partner!: partners;
  getPartner!: Sequelize.BelongsToGetAssociationMixin<partners>;
  setPartner!: Sequelize.BelongsToSetAssociationMixin<partners, partnersId>;
  createPartner!: Sequelize.BelongsToCreateAssociationMixin<partners>;
  // products belongsTo product_types via productType_id
  productType!: product_types;
  getProductType!: Sequelize.BelongsToGetAssociationMixin<product_types>;
  setProductType!: Sequelize.BelongsToSetAssociationMixin<product_types, product_typesId>;
  createProductType!: Sequelize.BelongsToCreateAssociationMixin<product_types>;
  // products hasMany cart_items via product_id
  cart_items!: cart_items[];
  getCart_items!: Sequelize.HasManyGetAssociationsMixin<cart_items>;
  setCart_items!: Sequelize.HasManySetAssociationsMixin<cart_items, cart_itemsId>;
  addCart_item!: Sequelize.HasManyAddAssociationMixin<cart_items, cart_itemsId>;
  addCart_items!: Sequelize.HasManyAddAssociationsMixin<cart_items, cart_itemsId>;
  createCart_item!: Sequelize.HasManyCreateAssociationMixin<cart_items>;
  removeCart_item!: Sequelize.HasManyRemoveAssociationMixin<cart_items, cart_itemsId>;
  removeCart_items!: Sequelize.HasManyRemoveAssociationsMixin<cart_items, cart_itemsId>;
  hasCart_item!: Sequelize.HasManyHasAssociationMixin<cart_items, cart_itemsId>;
  hasCart_items!: Sequelize.HasManyHasAssociationsMixin<cart_items, cart_itemsId>;
  countCart_items!: Sequelize.HasManyCountAssociationsMixin;
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
  // products hasMany order_items via product_id
  order_items!: order_items[];
  getOrder_items!: Sequelize.HasManyGetAssociationsMixin<order_items>;
  setOrder_items!: Sequelize.HasManySetAssociationsMixin<order_items, order_itemsId>;
  addOrder_item!: Sequelize.HasManyAddAssociationMixin<order_items, order_itemsId>;
  addOrder_items!: Sequelize.HasManyAddAssociationsMixin<order_items, order_itemsId>;
  createOrder_item!: Sequelize.HasManyCreateAssociationMixin<order_items>;
  removeOrder_item!: Sequelize.HasManyRemoveAssociationMixin<order_items, order_itemsId>;
  removeOrder_items!: Sequelize.HasManyRemoveAssociationsMixin<order_items, order_itemsId>;
  hasOrder_item!: Sequelize.HasManyHasAssociationMixin<order_items, order_itemsId>;
  hasOrder_items!: Sequelize.HasManyHasAssociationsMixin<order_items, order_itemsId>;
  countOrder_items!: Sequelize.HasManyCountAssociationsMixin;
  // products hasMany product_gallery via product_id
  product_galleries!: product_gallery[];
  getProduct_galleries!: Sequelize.HasManyGetAssociationsMixin<product_gallery>;
  setProduct_galleries!: Sequelize.HasManySetAssociationsMixin<product_gallery, product_galleryId>;
  addProduct_gallery!: Sequelize.HasManyAddAssociationMixin<product_gallery, product_galleryId>;
  addProduct_galleries!: Sequelize.HasManyAddAssociationsMixin<product_gallery, product_galleryId>;
  createProduct_gallery!: Sequelize.HasManyCreateAssociationMixin<product_gallery>;
  removeProduct_gallery!: Sequelize.HasManyRemoveAssociationMixin<product_gallery, product_galleryId>;
  removeProduct_galleries!: Sequelize.HasManyRemoveAssociationsMixin<product_gallery, product_galleryId>;
  hasProduct_gallery!: Sequelize.HasManyHasAssociationMixin<product_gallery, product_galleryId>;
  hasProduct_galleries!: Sequelize.HasManyHasAssociationsMixin<product_gallery, product_galleryId>;
  countProduct_galleries!: Sequelize.HasManyCountAssociationsMixin;
  // products hasMany product_reviews via product_id
  product_reviews!: product_reviews[];
  getProduct_reviews!: Sequelize.HasManyGetAssociationsMixin<product_reviews>;
  setProduct_reviews!: Sequelize.HasManySetAssociationsMixin<product_reviews, product_reviewsId>;
  addProduct_review!: Sequelize.HasManyAddAssociationMixin<product_reviews, product_reviewsId>;
  addProduct_reviews!: Sequelize.HasManyAddAssociationsMixin<product_reviews, product_reviewsId>;
  createProduct_review!: Sequelize.HasManyCreateAssociationMixin<product_reviews>;
  removeProduct_review!: Sequelize.HasManyRemoveAssociationMixin<product_reviews, product_reviewsId>;
  removeProduct_reviews!: Sequelize.HasManyRemoveAssociationsMixin<product_reviews, product_reviewsId>;
  hasProduct_review!: Sequelize.HasManyHasAssociationMixin<product_reviews, product_reviewsId>;
  hasProduct_reviews!: Sequelize.HasManyHasAssociationsMixin<product_reviews, product_reviewsId>;
  countProduct_reviews!: Sequelize.HasManyCountAssociationsMixin;
  // products hasMany product_variants via product_id
  product_variants!: product_variants[];
  getProduct_variants!: Sequelize.HasManyGetAssociationsMixin<product_variants>;
  setProduct_variants!: Sequelize.HasManySetAssociationsMixin<product_variants, product_variantsId>;
  addProduct_variant!: Sequelize.HasManyAddAssociationMixin<product_variants, product_variantsId>;
  addProduct_variants!: Sequelize.HasManyAddAssociationsMixin<product_variants, product_variantsId>;
  createProduct_variant!: Sequelize.HasManyCreateAssociationMixin<product_variants>;
  removeProduct_variant!: Sequelize.HasManyRemoveAssociationMixin<product_variants, product_variantsId>;
  removeProduct_variants!: Sequelize.HasManyRemoveAssociationsMixin<product_variants, product_variantsId>;
  hasProduct_variant!: Sequelize.HasManyHasAssociationMixin<product_variants, product_variantsId>;
  hasProduct_variants!: Sequelize.HasManyHasAssociationsMixin<product_variants, product_variantsId>;
  countProduct_variants!: Sequelize.HasManyCountAssociationsMixin;
  // products hasMany wishlists via product_id
  wishlists!: wishlists[];
  getWishlists!: Sequelize.HasManyGetAssociationsMixin<wishlists>;
  setWishlists!: Sequelize.HasManySetAssociationsMixin<wishlists, wishlistsId>;
  addWishlist!: Sequelize.HasManyAddAssociationMixin<wishlists, wishlistsId>;
  addWishlists!: Sequelize.HasManyAddAssociationsMixin<wishlists, wishlistsId>;
  createWishlist!: Sequelize.HasManyCreateAssociationMixin<wishlists>;
  removeWishlist!: Sequelize.HasManyRemoveAssociationMixin<wishlists, wishlistsId>;
  removeWishlists!: Sequelize.HasManyRemoveAssociationsMixin<wishlists, wishlistsId>;
  hasWishlist!: Sequelize.HasManyHasAssociationMixin<wishlists, wishlistsId>;
  hasWishlists!: Sequelize.HasManyHasAssociationsMixin<wishlists, wishlistsId>;
  countWishlists!: Sequelize.HasManyCountAssociationsMixin;

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
    productType_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'productType_id',
      references: {
        model: 'product_types',
        key: 'id'
      }
    },
    global_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "หมวดหมู่บนแอป E-commerce",
      references: {
        model: 'global_categories',
        key: 'id'
      }
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "รายละเอียดสินค้า"
    },
    brand: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    },
    system_sku: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "รหัสระบบ (System SKU) แพลตฟอร์มสร้างให้",
      unique: "system_sku"
    },
    merchant_sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "รหัสสินค้าที่ร้านค้าตั้งเอง (Seller SKU)"
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "สต๊อกคงเหลือรวม"
    },
    reserved_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "สต๊อกที่จองไว้ตอนรออนุมัติ"
    },
    allowed_loan_type: {
      type: DataTypes.ENUM('single_item','bnpl_cart','both'),
      allowNull: false,
      defaultValue: "both",
      comment: "ช่องทางอนุญาตการผ่อน"
    }
  }, {
    sequelize,
    tableName: 'products',
    timestamps: true,
    // 🟢 เพิ่ม 2 บรรทัดนี้ เพื่อบอกให้ Sequelize รู้ว่าคอลัมน์ใน DB ชื่ออะไรแน่ๆ
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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
        name: "system_sku",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "system_sku" },
        ]
      },
      {
        name: "unique_product_merchant_sku",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "partner_id" },
          { name: "merchant_sku" },
        ]
      },
      {
        name: "productType_id",
        using: "BTREE",
        fields: [
          { name: "productType_id" },
        ]
      },
      {
        name: "fk_products_global_cat",
        using: "BTREE",
        fields: [
          { name: "global_category_id" },
        ]
      },
    ]
  });
  }
}
