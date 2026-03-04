import { Router } from 'express';
import * as product_galleryController from '../controllers/product_gallery.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';

const router = Router();

// router.use(verifyToken)

/**
 * @swagger
 * /products/{productId}/gallery:
 *   get:
 *     summary: Get a product's image gallery
 *     tags: [ProductGallery]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of gallery images for the product
 */
router.get('/:productId/gallery', product_galleryController.getGallery);

/**
 * @swagger
 * /products/{productId}/gallery:
 *   post:
 *     summary: Add an image to a product's gallery
 *     tags: [ProductGallery]
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Image added to gallery
 */
router.post('/:productId/gallery', product_galleryController.saveImageToGallery);

export default router;