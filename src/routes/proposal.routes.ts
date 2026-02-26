import { Router } from 'express';
import * as ProposalController from '../controllers/proposal.controller'

const router = Router();


// ✅ POST: /api/proposal/:customerId/new
// สร้าง Proposal ใหม่ (ต้องมี customerId ใน URL)
router.post('/:customerId/new', ProposalController.createProposal);

// ✅ GET: /api/proposal/:customerId/get/:loan_id
// ดึงรายการ Proposal ของลูกค้า
router.get('/:customerId/get/:loan_id', ProposalController.getCustomerProposal);

export default router;