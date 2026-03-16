"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_type_controller_1 = __importDefault(require("../controllers/product_type.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /product-types:
 *   get:
 *     summary: Get all product types
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: List of all product types
 */
router.get('/', product_type_controller_1.default.getAllProducttypes);
/**
 * @swagger
 * /product-types:
 *   post:
 *     summary: Create a new product type
 *     tags: [ProductType]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product type created
 */
router.post('/', auth_middleware_1.verifyToken, product_type_controller_1.default.createProductType);
/**
 * @swagger
 * /product-types/{id}:
 *   get:
 *     summary: Get product type by ID
 *     tags: [ProductType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product type data
 */
router.get('/:id', product_type_controller_1.default.getProductTypeById);
/**
 * @swagger
 * /product-types/{id}:
 *   put:
 *     summary: Update a product type
 *     tags: [ProductType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product type updated
 */
router.put('/:id', auth_middleware_1.verifyToken, product_type_controller_1.default.updateProductType);
/**
 * @swagger
 * /product-types/{id}:
 *   delete:
 *     summary: Deactivate a product type
 *     tags: [ProductType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product type deactivated
 */
router.delete('/:id', auth_middleware_1.verifyToken, product_type_controller_1.default.deActivatedProductType);
exports.default = router;
