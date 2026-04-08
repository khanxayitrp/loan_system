import { Router } from 'express';
import * as repaymentController from '../controllers/repayment.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();

router.get('/early-payoff/:application_id', verifyToken, repaymentController.getEarlyPayoffSummary);

router.post('/pay', verifyToken, repaymentController.processPayment);

export default router;