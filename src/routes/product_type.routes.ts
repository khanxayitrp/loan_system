import { Router } from 'express';
import productTypeController from '../controllers/product_type.controller';
import {verifyToken, checkPermission} from '../middlewares/auth.middleware';

const router = Router();

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
router.get('/',  productTypeController.getAllProducttypes);

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
router.post('/', verifyToken, productTypeController.createProductType);

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
router.get('/:id',  productTypeController.getProductTypeById);

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
router.put('/:id', verifyToken, productTypeController.updateProductType);

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
router.delete('/:id', verifyToken, productTypeController.deActivatedProductType);

export default router;



