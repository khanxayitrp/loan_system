import { Router } from "express";
import partnerController from "../controllers/partner.controller";
import { verifyToken } from "@/middlewares/auth.middleware";

const router = Router();

router.get('/current', verifyToken, partnerController.getShop);

router.get('/all', partnerController.getAllShop);

router.post('/', verifyToken, partnerController.createShop);

router.put('/:id', verifyToken, partnerController.updateShop);

router.put('/status/:id', verifyToken, partnerController.changeStatusShop);

export default router;