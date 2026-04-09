"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checklist_controller_1 = __importDefault(require("../controllers/checklist.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
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
router.post('/income-assessment/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.saveIncomeAssessment);
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
router.post('/basic/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.saveBasicChecklist);
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
router.post('/call/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.saveCallChecklist);
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
router.post('/cib/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.saveCIBChecklist);
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
router.post('/field/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.saveFieldChecklist);
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
router.get('/cib/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.getCIBChecklist);
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
router.get('/field/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.getFieldChecklist);
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
router.get('/call/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.getCallChecklist);
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
router.get('/basic/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.getBasicChecklist);
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
router.get('/income-assessment/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.getIncomeAssessment);
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
router.get('/summary/:loanId', auth_middleware_1.verifyToken, checklist_controller_1.default.getChecklist);
exports.default = router;
