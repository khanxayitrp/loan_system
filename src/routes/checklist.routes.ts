import {Router} from 'express';
import checklistController from '../controllers/checklist.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/income-assessment/:loanId', verifyToken, checklistController.saveIncomeAssessment);
router.post('/basic/:loanId', verifyToken, checklistController.saveBasicChecklist);
router.post('/call/:loanId', verifyToken, checklistController.saveCallChecklist);
router.post('/cib/:loanId', verifyToken, checklistController.saveCIBChecklist);
router.post('/field/:loanId', verifyToken, checklistController.saveFieldChecklist);
router.get('/cib/:loanId', verifyToken, checklistController.getCIBChecklist);
router.get('/field/:loanId', verifyToken, checklistController.getFieldChecklist);
router.get('/call/:loanId', verifyToken, checklistController.getCallChecklist);
router.get('/basic/:loanId', verifyToken, checklistController.getBasicChecklist);
router.get('/income-assessment/:loanId', verifyToken, checklistController.getIncomeAssessment);
router.get('/summary/:loanId', verifyToken, checklistController.getChecklist);

export default router;