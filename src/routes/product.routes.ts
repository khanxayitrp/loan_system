import { Router } from 'express';
import multer from 'multer';
import productController from '../controllers/product.controller';
import {verifyToken, checkPermission} from '../middlewares/auth.middleware';

const router = Router();

// 🟢 2. ตั้งค่า Multer ให้เก็บไฟล์ในหน่วยความจำ (Memory Storage) 
// เพื่อให้ Controller สามารถอ่านไฟล์ Excel ได้ทันทีโดยไม่ต้องเซฟลงเซิร์ฟเวอร์
const upload = multer({ 
    storage: multer.memoryStorage(),
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
router.get('/',  productController.getAllProduct);

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
router.post('/import', verifyToken, upload.single('file'), productController.importProductsFromExcel);

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
