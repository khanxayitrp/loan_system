import { Router } from "express";
import loan_contractController from "../controllers/loan_contract.controller";
import { verifyToken } from "../middlewares/auth.middleware";
const router = Router();

/***************** LOAN CONTRACT ROUTES *****************/

router.post('/:loanId/created', verifyToken, loan_contractController.createLoanContract);

router.get('/:loanId', verifyToken, loan_contractController.getLoanContract);



export default router;