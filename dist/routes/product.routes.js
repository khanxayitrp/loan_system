"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// 🟢 2. ตั้งค่า Multer ให้เก็บไฟล์ในหน่วยความจำ (Memory Storage) 
// เพื่อให้ Controller สามารถอ่านไฟล์ Excel ได้ทันทีโดยไม่ต้องเซฟลงเซิร์ฟเวอร์
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 5MB
});
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
 * /products/import:
 *   post:
 *     summary: Import products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The Excel file (.xlsx)
 *     responses:
 *       201:
 *         description: Products imported successfully
 *       400:
 *         description: Invalid file or data format
 */
// 🟢 3. เพิ่ม Route เส้นนี้เข้าไป โดยใช้ upload.single('file') เพื่อรับไฟล์
router.post('/import', auth_middleware_1.verifyToken, upload.single('file'), product_controller_1.default.importProductsFromExcel);
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
/**
 * @swagger
 * /products/bulk-status:
 *   patch:
 *     summary: Update multiple products status
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
 *               product_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Products status updated
 */
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
