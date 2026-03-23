import {Router} from 'express';
import checklistController from '../controllers/checklist.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Checklist
 *   description: Loan checklist management
 */

/**
 * @swagger
 * /checklist/income-assessment/{loanId}:
 *   post:
 *     summary: Save income assessment checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Saved successfully
 */
router.post('/income-assessment/:loanId', verifyToken, checklistController.saveIncomeAssessment);

/**
 * @swagger
 * /checklist/basic/{loanId}:
 *   post:
 *     summary: Save basic verification checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Saved successfully
 */
router.post('/basic/:loanId', verifyToken, checklistController.saveBasicChecklist);

/**
 * @swagger
 * /checklist/call/{loanId}:
 *   post:
 *     summary: Save call verification checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Saved successfully
 */
router.post('/call/:loanId', verifyToken, checklistController.saveCallChecklist);

/**
 * @swagger
 * /checklist/cib/{loanId}:
 *   post:
 *     summary: Save CIB checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Saved successfully
 */
router.post('/cib/:loanId', verifyToken, checklistController.saveCIBChecklist);

/**
 * @swagger
 * /checklist/field/{loanId}:
 *   post:
 *     summary: Save field visit checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Saved successfully
 */
router.post('/field/:loanId', verifyToken, checklistController.saveFieldChecklist);

/**
 * @swagger
 * /checklist/cib/{loanId}:
 *   get:
 *     summary: Get CIB checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CIB checklist data
 */
router.get('/cib/:loanId', verifyToken, checklistController.getCIBChecklist);

/**
 * @swagger
 * /checklist/field/{loanId}:
 *   get:
 *     summary: Get field visit checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Field visit checklist data
 */
router.get('/field/:loanId', verifyToken, checklistController.getFieldChecklist);

/**
 * @swagger
 * /checklist/call/{loanId}:
 *   get:
 *     summary: Get call verification checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Call checklist data
 */
router.get('/call/:loanId', verifyToken, checklistController.getCallChecklist);

/**
 * @swagger
 * /checklist/basic/{loanId}:
 *   get:
 *     summary: Get basic verification checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Basic checklist data
 */
router.get('/basic/:loanId', verifyToken, checklistController.getBasicChecklist);

/**
 * @swagger
 * /checklist/income-assessment/{loanId}:
 *   get:
 *     summary: Get income assessment checklist
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Income assessment data
 */
router.get('/income-assessment/:loanId', verifyToken, checklistController.getIncomeAssessment);

/**
 * @swagger
 * /checklist/summary/{loanId}:
 *   get:
 *     summary: Get all checklist summary
 *     tags: [Checklist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Checklist summary data
 */
router.get('/summary/:loanId', verifyToken, checklistController.getChecklist);

export default router;