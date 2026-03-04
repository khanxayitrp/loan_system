import { Router } from 'express';
import * as LocationController from '../controllers/customer_location.controller';

const router = Router();

/**
 * @swagger
 * /customer-locations/{customerId}/locations:
 *   post:
 *     summary: Create a new location for a customer
 *     tags: [CustomerLocation]
 *     parameters:
 *       - in: path
 *         name: customerId
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
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Location created
 */
router.post('/:customerId/locations', LocationController.createLocation);

/**
 * @swagger
 * /customer-locations/{customerId}/locations:
 *   get:
 *     summary: Get all locations for a customer
 *     tags: [CustomerLocation]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of customer locations
 */
router.get('/:customerId/locations', LocationController.getCustomerLocations);

/**
 * @swagger
 * /customer-locations/{id}:
 *   put:
 *     summary: Update a location
 *     tags: [CustomerLocation]
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
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put('/:id', LocationController.updateLocation);

/**
 * @swagger
 * /customer-locations/{id}:
 *   delete:
 *     summary: Delete a location
 *     tags: [CustomerLocation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Location deleted
 */
router.delete('/:id', LocationController.deleteLocation);

export default router;