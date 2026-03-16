"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all products
 */
router.get('/', product_controller_1.default.getAllProduct);
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
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
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', auth_middleware_1.verifyToken, product_controller_1.default.createProduct);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product data
 */
router.get('/:id', product_controller_1.default.getProductById);
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Product]
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
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', auth_middleware_1.verifyToken, product_controller_1.default.updateProduct);
// ຕົວຢ່າງ routes/product.routes.ts
router.patch('/bulk-status', auth_middleware_1.verifyToken, // Middleware ກວດສອບ Token ຂອງທ່ານ
product_controller_1.default.updateMultipleProductStatus);
/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Deactivate a product
 *     tags: [Product]
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
 *         description: Product deactivated
 */
router.patch('/:id', auth_middleware_1.verifyToken, product_controller_1.default.deActivatedOneProduct);
/**
 * @swagger
 * /products/all:
 *   delete:
 *     summary: Deactivate all products by partner ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All products for the partner are deactivated
 */
router.delete('/all', auth_middleware_1.verifyToken, product_controller_1.default.deActivatedAllProductByPartnerId);
exports.default = router;
