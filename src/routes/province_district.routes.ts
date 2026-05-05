import { Router } from 'express';
import {provinceDistrictController} from '../controllers/province_district.controller';

const router = Router();

/**
 * @swagger
 * /address/provinces:
 *   get:
 *     summary: Get all provinces
 *     tags: [Address]
 *     responses:
 *       200:
 *         description: List of all provinces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/provinces', provinceDistrictController.getAllProvince);

/**
 * @swagger
 * /address/provinces/{id}:
 *   get:
 *     summary: Get province by ID
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Province ID
 *     responses:
 *       200:
 *         description: Province details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *       404:
 *         description: Province not found
 *       500:
 *         description: Server error
 */
router.get('/provinces/:id', provinceDistrictController.getProvinceById);

/**
 * @swagger
 * /address/provinces/{provinceId}/districts:
 *   get:
 *     summary: Get all districts for a specific province
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: provinceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Province ID
 *     responses:
 *       200:
 *         description: List of districts in the province
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   province_id:
 *                     type: integer
 *       404:
 *         description: Province not found or has no districts
 *       500:
 *         description: Server error
 */
router.get('/provinces/:provinceId/districts', provinceDistrictController.getAllDistrictByProvinceId);  

/**
 * @swagger
 * /address/districts/{id}:
 *   get:
 *     summary: Get district by ID
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: District ID
 *     responses:
 *       200:
 *         description: District details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 province_id:
 *                   type: integer
 *       404:
 *         description: District not found
 *       500:
 *         description: Server error
 */
router.get('/districts/:id', provinceDistrictController.getDistrictById);

export default router;
