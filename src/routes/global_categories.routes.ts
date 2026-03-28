import { Router } from 'express';
import { GlobalCategoriesController } from '../controllers/global_categories.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);


router.get('/', GlobalCategoriesController.getAll);
router.get('/:id', GlobalCategoriesController.getById);
router.get('/prefix/:prefixCode', GlobalCategoriesController.getByPrefix);
router.post('/' , GlobalCategoriesController.create);
router.put('/:id', GlobalCategoriesController.update);
router.delete('/:id',  GlobalCategoriesController.delete);

export default router;