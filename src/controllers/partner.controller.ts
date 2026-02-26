import { Request, Response } from 'express'
import partnerRepo from '../repositories/partner.repo'
import { NotFoundError, ValidationError, handleErrorResponse } from '../utils/errors';
import { logger } from '../utils/logger'

class PartnerController {
    public async createShop(req: Request, res: Response) {
        try {
            if (!req.userPayload) {
                console.log('[CONTROLLER] No userPayload found - unauthenticated request');
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່'
                });
            }
            const userId = req.userPayload?.userId

            if (!userId) {
                return res.status(401).json({ message: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ' });
            }
            const data = req.body;
            const mapData = {
                user_id: userId,
                shop_id: data.shop_id,
                shop_name: data.shop_name,
                shop_owner: data.shop_owner,
                contact_number: data.contact_number || null,
                address: data.address,
                shop_logo_url: data.shop_logo_url || null,
                business_type: data.business_type
            }
            const shop = await partnerRepo.createPartner(mapData)
            res.status(201).json({
                message: 'Shop partnership created',
                shop
            });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    public async getShop(req: Request, res: Response) {
        try {

            if (!req.userPayload) {
                console.log('[CONTROLLER] No userPayload found - unauthenticated request');
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການຕໍ່'
                });
            }

            const userId = req.userPayload?.userId

            if (!userId) {
                return res.status(401).json({ message: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ' });
            }
            const partner = await partnerRepo.findPartnerByUserId(userId!)

            if (!partner) {
                return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ' });
            }
            return res.status(200).json({
                message: 'ພົບຂໍ້ມູນແລ້ວ',
                shop: {
                    id: partner.id,
                    user_id: partner.user_id,
                    shop_name: partner.shop_name,
                    shop_id: partner.shop_id,
                    shop_owner: partner?.shop_owner,
                    contact_number: partner.contact_number,
                    shop_logo_url: partner.shop_logo_url,
                    address: partner.address,
                    business_type: partner.business_type,
                    is_active: partner.is_active
                }
            });

        } catch (error: any) {
            logger.error('Error in getShop controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດພາຍໃນລະບົບ' });
        }
    }

    public async updateShop(req: Request, res: Response) {
        try {
            const partnerId = parseInt(req.params.id, 10);
            const updateData = req.body;
            const updatedPartner = await partnerRepo.updatePartner(partnerId, updateData);
            if (!updatedPartner) {
                return res.status(404).json({ message: 'ບໍ່ພົບຮ້ານຄ້າທີ່ຕ້ອງການອັບເດດ' });
            }
            return res.status(200).json({ message: 'ອັບເດດຂໍ້ມູນຮ້ານຄ້າສຳເລັດ', shop: updatedPartner });
        } catch (error: any) {
            logger.error('Error in updateShop controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດພາຍໃນລະບົບ' });
        }
    }
    public async getAllShop(req: Request, res: Response) {
        try {
            const allShop = await partnerRepo.findAllPartner();
            if (!allShop) {
                return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ' });
            }
            return res.status(200).json({ message: 'ພົບຂໍ້ມູນແລ້ວ', shop: allShop });
        } catch (error: any) {
            logger.error('Error in getAllShop controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດພາຍໃນລະບົບ' });
        }
    }

    public async changeStatusShop(req: Request, res: Response) {
        try {

            const partnerId = parseInt(req.params.id, 10)
            if (isNaN(partnerId) || partnerId <= 0) {
                throw new ValidationError('ID ຮ້ານຄ້າບໍ່ຖືກຕ້ອງ');
            }
            const { is_active } = req.body;
            if (is_active === undefined || is_active === null) {
                throw new ValidationError('ກະລຸນາລະບູສະຖານະ is_active');
            }
            const success = await partnerRepo.SwitchStatusPartner(partnerId, is_active);

            if (!success) {
                throw new NotFoundError(
                    is_active === 1 ? 'ບໍ່ພົບຮ້ານຄ້າທີ່ຕ້ອງການປິດໃຊ້ງານ' : 'ບໍ່ພົບຮ້ານຄ້າທີ່ຕ້ອງການເປີດໃຊ້ງານ');
                // return res.status(404).json({ message });
            }
            return res.status(200).json({ success: true, message: is_active === 1 ? 'ປິດໃຊ້ງານຮ້ານຄ້າສຳເລັດ' : 'ເປີດໃຊ້ງານຮ້ານຄ້າສຳເລັດ' });
        } catch (error: any) {
            logger.error('Error in changeStatusShop controller', { error: error.message });
            return res.status(500).json({ message: 'ເກີດຂໍ້ຜິດພາດພາຍໃນລະບົບ' });
        }
    }
}

export default new PartnerController()