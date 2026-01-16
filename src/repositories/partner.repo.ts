import {partners, partnersAttributes, partnersCreationAttributes} from '../models/partners';
import {db} from '../models/init-models';
import {logger} from '@/utils/logger';
import {Op, Sequelize, QueryTypes, where} from 'sequelize';

class PartnerRepository {
    async createPartner(data: partnersCreationAttributes): Promise<partners> {
        try {
            const cleanPartner = {...data};

            const existPartner = await db.partners.findOne({where: {shop_name: cleanPartner.shop_name}});
            if (existPartner) {
                logger.error(`Shop name already exists: ${cleanPartner.shop_name}`);
                throw new Error('Shop name already exists');
            }
            const mapData: any = {
                shop_name: cleanPartner.shop_name,
                contact_number: cleanPartner.contact_number,
                address: cleanPartner.address,
                shop_logo_url: cleanPartner.shop_logo_url || null,
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
    async findPartnerByShopName(shopName: string): Promise<partners | null> {
        return await db.partners.findOne({where: {shop_name: shopName}});
    }
    async updatePartner(partnerId: number, data: Partial<partnersAttributes>): Promise<partners | null> {
        try {
            const partner = await this.findPartnerById(partnerId);
            if (!partner) {
                logger.error(`Partner with ID: ${partnerId} not found`);
                return null;
            }
            const updatedPartner = await partner.update(data, {
                where: {id: partnerId},
                returning: true
            });
            logger.info(`Partner updated with ID: ${partnerId}`);
            return updatedPartner;
        } catch (error) {
            logger.error(`Error updating partner: ${(error as Error).message}`);
            throw error;
        }
    }
    async deletePartner(partnerId: number): Promise<boolean> {
        try {
            const deletedCount = await db.partners.destroy({where: {id: partnerId}});
            if (deletedCount === 0) {
                logger.error(`Partner with ID: ${partnerId} not found for deletion`);
                return false;
            }   
            logger.info(`Partner deleted with ID: ${partnerId}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting partner: ${(error as Error).message}`);
            throw error;
        }
    }
}

export default new PartnerRepository();