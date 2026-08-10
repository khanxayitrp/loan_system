import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { db } from '../models/init-models';
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

            // 🌟 ແກ້ໄຂ: ກຳນົດ Type ໃຫ້ເປັນ any
            const loanData: any = loan.toJSON();

            // ດຽວນີ້ຈະບໍ່ເກີດ Error ແລ້ວ ທັງການຮຽກໃຊ້ .product ແລະ ການສ້າງ .partner_name
            loanData.partner_name = loanData.product?.partner?.shop_name || 'N/A';

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