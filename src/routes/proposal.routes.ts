import { Router } from 'express';
import * as ProposalController from '../controllers/proposal.controller'

const router = Router();


/**
 * @swagger
 * /proposal/{customerId}/new:
 *   post:
 *     summary: Create a new proposal for a customer
 *     tags: [Proposal]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loan_id:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proposal created
 */
router.post('/:customerId/new', ProposalController.createProposal);

/**
 * @swagger
 * /proposal/{customerId}/get/{loan_id}:
 *   get:
 *     summary: Get a customer's proposal for a specific loan
 *     tags: [Proposal]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: loan_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proposal data
 *       404:
 *         description: Proposal not found
 */
router.get('/:customerId/get/:loan_id', ProposalController.getCustomerProposal);

export default router;