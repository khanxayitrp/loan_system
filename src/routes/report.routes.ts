import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API ສຳລັບການດຶງຂໍ້ມູນລາຍງານຕ່າງໆ
 */

/**
 * @swagger
 * /reports/disbursed-loans:
 *   get:
 *     summary: ດຶງຂໍ້ມູນລາຍງານສິນເຊື່ອທີ່ປ່ອຍແລ້ວ
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: ວັນທີເລີ່ມຕົ້ນ (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: ວັນທີສິ້ນສຸດ (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: ດຶງຂໍ້ມູນສຳເລັດ
 */
// 🟢 ຕ້ອງ Login ແລະ ມີສິດ loan_view_all ຈຶ່ງສາມາດເບິ່ງລາຍງານໄດ້
router.get('/disbursed-loans', verifyToken, reportController.getDisbursedLoans);

export default router;