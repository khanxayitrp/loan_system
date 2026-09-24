import { Router } from 'express';
import * as purposeCtrl from '../controllers/credit-purpose.controller';
import { verifyToken, checkPermission } from '../middlewares/auth.middleware';

const router = Router();

// 🟢 Public (ຫຼືອາດຈະ Login ກໍໄດ້ຂຶ້ນກັບການຕັ້ງຄ່າ) ສຳລັບໃຊ້ດຶງເຂົ້າໄປໃນ Dropdown
router.get('/', purposeCtrl.getPurposes);

// 🛡️ Admin Zone: ສຳລັບພະນັກງານເຂົ້າໄປຈັດການຫຼັງບ້ານ
router.post('/', verifyToken, purposeCtrl.createPurpose);
router.put('/:id', verifyToken, purposeCtrl.updatePurpose);
router.patch('/:id/status', verifyToken, purposeCtrl.togglePurposeStatus);

export default router;