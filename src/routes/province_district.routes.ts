import { Router } from 'express';
import {provinceDistrictController} from '../controllers/province_district.controller';

const router = Router();

/**
 * @swagger
 * /address/provinces:
 *   get:
 *     summary: GET /address/provinces
 *     tags: [Province District]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/provinces', provinceDistrictController.getAllProvince);
/**
 * @swagger
 * /address/provinces/{id}:
 *   get:
 *     summary: GET /address/provinces/{id}
 *     tags: [Province District]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/provinces/:id', provinceDistrictController.getProvinceById);
/**
 * @swagger
 * /address/provinces/{provinceId}/districts:
 *   get:
 *     summary: GET /address/provinces/{provinceId}/districts
 *     tags: [Province District]
 *     parameters:
 *       - in: path
 *         name: provinceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/provinces/:provinceId/districts', provinceDistrictController.getAllDistrictByProvinceId);  
/**
 * @swagger
 * /address/districts/{id}:
 *   get:
 *     summary: GET /address/districts/{id}
 *     tags: [Province District]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/districts/:id', provinceDistrictController.getDistrictById);

export default router;
