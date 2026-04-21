import { Router } from 'express';
import {provinceDistrictController} from '../controllers/province_district.controller';

const router = Router();

router.get('/provinces', provinceDistrictController.getAllProvince);
router.get('/provinces/:id', provinceDistrictController.getProvinceById);
router.get('/provinces/:provinceId/districts', provinceDistrictController.getAllDistrictByProvinceId);  
router.get('/districts/:id', provinceDistrictController.getDistrictById);

export default router;
