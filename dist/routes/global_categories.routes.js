"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const global_categories_controller_1 = require("../controllers/global_categories.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken);
/**
 * @swagger
 * /global-categories:
 *   get:
 *     summary: Get all global categories
 *     tags: [Global Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all global categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', global_categories_controller_1.GlobalCategoriesController.getAll);
/**
 * @swagger
 * /global-categories/{id}:
 *   get:
 *     summary: Get global category by ID
 *     tags: [Global Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the global category
 *     responses:
 *       200:
 *         description: Global category data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', global_categories_controller_1.GlobalCategoriesController.getById);
/**
 * @swagger
 * /global-categories/prefix/{prefixCode}:
 *   get:
 *     summary: Get global category by prefix code
 *     tags: [Global Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prefixCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The prefix code of the global category
 *     responses:
 *       200:
 *         description: Global category data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.get('/prefix/:prefixCode', global_categories_controller_1.GlobalCategoriesController.getByPrefix);
/**
 * @swagger
 * /global-categories:
 *   post:
 *     summary: Create a new global category
 *     tags: [Global Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prefix_code
 *               - name
 *             properties:
 *               prefix_code:
 *                 type: string
 *                 description: Unique prefix code for the category
 *               name:
 *                 type: string
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 description: Optional description
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request - prefix code must be unique
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', global_categories_controller_1.GlobalCategoriesController.create);
/**
 * @swagger
 * /global-categories/{id}:
 *   put:
 *     summary: Update a global category
 *     tags: [Global Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the global category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prefix_code:
 *                 type: string
 *                 description: Unique prefix code for the category
 *               name:
 *                 type: string
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 description: Optional description
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', global_categories_controller_1.GlobalCategoriesController.update);
/**
 * @swagger
 * /global-categories/{id}:
 *   delete:
 *     summary: Delete a global category
 *     tags: [Global Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the global category to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', global_categories_controller_1.GlobalCategoriesController.delete);
exports.default = router;
