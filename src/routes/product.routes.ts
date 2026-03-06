import { Router } from 'express';
import productController from '../controllers/product.controller';
import {verifyToken, checkPermission} from '../middlewares/auth.middleware';

const router = Router();

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
router.get('/', verifyToken, productController.getAllProduct);

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
router.post('/', verifyToken, productController.createProduct);

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
router.get('/:id', productController.getProductById);

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
router.put('/:id', verifyToken, productController.updateProduct);

// ຕົວຢ່າງ routes/product.routes.ts
router.patch(
    '/bulk-status', 
    verifyToken, // Middleware ກວດສອບ Token ຂອງທ່ານ
    productController.updateMultipleProductStatus
);

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
router.patch('/:id', verifyToken, productController.deActivatedOneProduct);

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
router.delete('/all', verifyToken, productController.deActivatedAllProductByPartnerId)



export default router;
