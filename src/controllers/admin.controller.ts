import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { db } from '../models/init-models';
import { Op } from 'sequelize';
import fileUploadService from '../services/fileUpload.service'; // 🌟 นำเข้า MinIO Service
import { FILE_UPLOAD_CONFIG } from '../types/file.types';

const overrideService = new AdminService();

export class AdminController {

    async getLoanDetails(req: Request, res: Response) {
        try {
            const loan = await db.loan_applications.findOne({
                where: { loan_id: req.params.loanIdStr },
                include: [
                    { model: db.products, as: 'product', include: ['partner'] },
                    { model: db.product_variants, as: 'variant' },
                    { model: db.customers, as: 'customer' }
                ]
            });
            
            if (!loan) return res.status(404).json({ message: 'Loan not found' });

            // ກຳນົດ Type ໃຫ້ເປັນ any
            const loanData: any = loan.toJSON();
            loanData.partner_name = loanData.product?.partner?.shop_name || 'N/A';

            // ==========================================
            // 🌟 ແກ້ໄຂແລ້ວ: ດຶງຂໍ້ມູນຕາຕະລາງຜ່ອນຊຳລະ ທີ່ເປັນ 'approved' ຫຼື 'draft' ຫຼ້າສຸດ
            // ==========================================
            const activeSchedule = await db.repayment_schedules.findOne({
                where: { 
                    application_id: loan.id, 
                    status: { [Op.in]: ['approved', 'draft'] } // <-- 🌟 ແກ້ໄຂຈຸດນີ້ 
                },
                order: [['version', 'DESC'], ['id', 'DESC']]
            });

            if (activeSchedule) {
                // ດຶງລາຍລະອຽດຄ່າງວດ ທີ່ຜູກກັບ Schedule ID ນີ້ ແລະ ລຽງລຳດັບງວດ
                const repaymentsDetails = await db.repayments.findAll({
                    where: { schedule_id: activeSchedule.id },
                    order: [['installment_no', 'ASC']]
                });
                
                loanData.repayments = repaymentsDetails;
            } else {
                loanData.repayments = []; // ຖ້າບໍ່ມີໃຫ້ສົ່ງ Array ວ່າງໄປ
            }

            return res.status(200).json({ success: true, data: loanData });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async executeOverride(req: Request, res: Response) {
        let evidenceUrl: string | null = null;
        let evidencePath: string | null = null;

        try {
            const loanId = Number(req.params.loanId);
            const performedBy = req.userPayload?.userId || 1;


            // 1. 🌟 แปลง Payload ຈາກ FormData
            if (!req.body.payload) {
                return res.status(400).json({ message: 'Payload is required.' });
            }
            const payload = JSON.parse(req.body.payload);

            console.log("-------------payload---------------:", payload)

            if (!payload.audit?.reference_doc || !payload.audit?.reason) {
                return res.status(400).json({ message: 'Audit Reference and Reason are required.' });
            }

            // 2. 🌟 ອັບໂຫຼດຟາຍຂຶ້ນ MinIO ກ່ອນ
            if (!req.file) {
                return res.status(400).json({ message: 'Approval document file is required.' });
            }

            const uploadResult = await fileUploadService.uploadSingleFile(
                req.file,
                FILE_UPLOAD_CONFIG.OVERRIDE_EVIDENCES,
                `ovr_${loanId}`
            );

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Failed to upload document to MinIO');
            }

            evidenceUrl = uploadResult.fileUrl!;
            evidencePath = uploadResult.filePath!; // ເກັບໄວ້ເພື່ອລົບຖ້າ Error

            // 3. 🌟 ສົ່ງຂໍ້ມູນ ແລະ URL ໄປໃຫ້ Service ບັນທຶກລົງ Database
            const updatedLoan = await overrideService.executeFullOverride(loanId, payload, evidenceUrl, performedBy);

            return res.status(200).json({ success: true, data: updatedLoan });

        } catch (error: any) {
            // 🔴 Rollback MinIO ຖ້າການບັນທຶກ Database ລົ້ມເຫຼວ (ປ້ອງກັນໄຟລ໌ຂີ້ເຫຍື້ອ)
            if (evidencePath) {
                await fileUploadService.deleteFile(evidencePath).catch(() => { });
            }
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}