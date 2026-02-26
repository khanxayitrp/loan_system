import { partners, partnersAttributes, partnersCreationAttributes } from '../models/partners';
import { db } from '../models/init-models';
import { logger } from '@/utils/logger';
import { Op, Sequelize, QueryTypes, where } from 'sequelize';

class PartnerRepository {
    async createPartner(data: partnersCreationAttributes): Promise<partners> {
        try {
            const cleanPartner = { ...data };

            if (!cleanPartner.user_id || cleanPartner.user_id === 0) {
                throw new Error('User ID is required');
            }

            if (!cleanPartner.shop_owner || cleanPartner.shop_owner.trim() === '') {
                throw new Error('Shop_Owner is required')
            }
            // if (!cleanPartner.shop_ || cleanPartner.product_id === 0) {
            //     throw new Error('Product ID is required');
            // }

            if (!cleanPartner.shop_name || cleanPartner.shop_name.trim() === '') {
                throw new Error('shop_name is required');
            }
            if (!cleanPartner.business_type || cleanPartner.business_type.trim() === '') {
                throw new Error('business_type is required');
            }

            const existPartner = await db.partners.findOne({ where: { shop_name: cleanPartner.shop_name } });
            if (existPartner) {
                logger.error(`Shop name already exists: ${cleanPartner.shop_name}`);
                throw new Error('Shop name already exists');
            }

            const last_shop_id = await db.partners.findOne({
                order: [['shop_id', 'DESC']],
                attributes: ['shop_id'],
            })

            let newShopNumber = 1;

            if (last_shop_id && last_shop_id.shop_id) {
                // แยกส่วนตัวเลขจาก shop_id เช่น "Shop-000001" → "000001"
                const shopIdParts = last_shop_id.shop_id.split('-');

                if (shopIdParts.length === 2) {
                    // ✅ ใช้ base 10 และแปลงเป็นเลขฐาน 10 อย่างถูกต้อง
                    const lastNumber = parseInt(shopIdParts[1], 10);
                    if (!isNaN(lastNumber)) {
                        newShopNumber = lastNumber + 1;
                    } else {
                        logger.warn(`Invalid shop_id format detected: ${last_shop_id.shop_id}, starting from 1`);
                    }
                } else {
                    logger.warn(`Unexpected shop_id format: ${last_shop_id.shop_id}, starting from 1`);
                }
            }
            // ✅ เติมศูนย์นำหน้าให้ครบ 6 หลัก
            const paddedNumber = newShopNumber.toString().padStart(6, '0');
            cleanPartner.shop_id = `Shop-${paddedNumber}`;

            const mapData: any = {
                user_id: cleanPartner.user_id,
                shop_id: cleanPartner.shop_id,
                shop_name: cleanPartner.shop_name,
                shop_owner: cleanPartner.shop_owner,
                contact_number: cleanPartner.contact_number || null,
                address: cleanPartner.address || null,
                shop_logo_url: cleanPartner.shop_logo_url || null,
                business_type: cleanPartner.business_type
            }
            const newPartner = await db.partners.create(mapData);
            logger.info(`Partner created with ID: ${newPartner.id}`);
            return newPartner;
        } catch (error) {
            logger.error(`Error creating partner: ${(error as Error).message}`);
            throw error;
        }
    }

    async findPartnerById(partnerId: number): Promise<partners | null> {
        return await db.partners.findByPk(partnerId);
    }

    async findPartnerByUserId(userId: number): Promise<partners | null> {
        return await db.partners.findOne({
            where: {
                user_id: userId,
                is_active: 1
            }
        })
    }

    async findAllPartner(): Promise<partners[] | null> {
        return await db.partners.findAll({
            where: {
                is_active: 1
            }
        })
    }
    async findPartnerByShopName(shopName: string): Promise<partners | null> {
        return await db.partners.findOne({ where: { shop_name: shopName } });
    }
    async updatePartner(partnerId: number, data: Partial<partnersAttributes>): Promise<partners | null> {
        try {
            const partner = await this.findPartnerById(partnerId);
            if (!partner) {
                logger.error(`Partner with ID: ${partnerId} not found`);
                return null;
            }

            // ✅ แก้ไข: ใช้ undefined แทน null และอัปเดตเฉพาะฟิลด์ที่ส่งมา
            const updateData: Partial<partnersAttributes> = {};

            // เพิ่มเฉพาะฟิลด์ที่มีค่า
            if (data.shop_name !== undefined) {
                updateData.shop_name = data.shop_name;
            }
            if (data.shop_owner !== undefined) {
                updateData.shop_owner = data.shop_owner;
            }
            if (data.contact_number !== undefined) {
                updateData.contact_number = data.contact_number;
            }
            if (data.business_type !== undefined) {
                updateData.business_type = data.business_type;
            }
            if (data.address !== undefined) {
                updateData.address = data.address;
            }
            if (data.shop_logo_url !== undefined) {
                updateData.shop_logo_url = data.shop_logo_url;
            }
            // if (data.province !== undefined) {
            //     updateData.province = data.province;
            // }
            // if (data.district !== undefined) {
            //     updateData.district = data.district;
            // }
            // if (data.village !== undefined) {
            //     updateData.village = data.village;
            // }
            // if (data.is_active !== undefined) {
            //     updateData.is_active = data.is_active;
            // }

            // ✅ ลบ where ออก - instance.update() รู้ id อยู่แล้ว
            const updatedPartner = await partner.update(updateData);
            logger.info(`Partner updated with ID: ${partnerId}`);
            return updatedPartner;
        } catch (error) {
            logger.error(`Error updating partner: ${(error as Error).message}`);
            throw error;
        }
    }
    async SwitchStatusPartner(partnerId: number, is_active: number): Promise<boolean> {
        try {
            const Partner = await db.partners.findOne({ where: { id: partnerId } })
            if (!Partner) {
                logger.error(`No Partner found for partner ID: ${partnerId} to Inactive`);
                return false;
            }
            const success = await Partner.update(
                { is_active: is_active },
                { where: { id: partnerId } });

            logger.info(`Partner switch Status with ID: ${partnerId}`);
            return true;
        } catch (error) {
            logger.error(`Error SwitchStatusPartner: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new PartnerRepository();