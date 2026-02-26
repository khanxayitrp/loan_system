import { Router } from 'express';
import productController from '../controllers/product.controller';
import {verifyToken, checkPermission} from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyToken, productController.getAllProduct);

router.post('/', verifyToken, productController.createProduct);

router.get('/:id', productController.getProductById);

router.put('/:id', verifyToken, productController.updateProduct);

router.patch('/:id', verifyToken, productController.deActivatedOneProduct);

router.delete('/all', verifyToken, productController.deActivatedAllProductByPartnerId)

export default router;
