import { Router } from 'express';
import * as product_galleryController from '../controllers/product_gallery.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';

const router = Router();

// router.use(verifyToken)

router.get('/:productId/gallery', product_galleryController.getGallery);
router.post('/:productId/gallery', product_galleryController.saveImageToGallery);

export default router;