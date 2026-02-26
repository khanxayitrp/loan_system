import { Router } from 'express';
import productTypeController from '../controllers/product_type.controller';
import {verifyToken, checkPermission} from '../middlewares/auth.middleware';

const router = Router();

router.get('/', productTypeController.getAllProducttypes);

router.post('/', verifyToken, productTypeController.createProductType);

router.get('/:id', productTypeController.getProductTypeById);

router.put('/:id', verifyToken, productTypeController.updateProductType);

router.delete('/:id', verifyToken, productTypeController.deActivatedProductType);

export default router;



