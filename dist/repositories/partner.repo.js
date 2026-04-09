"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const auditLogger_1 = require("../utils/auditLogger");
class PartnerRepository {
    // ==========================================
    // 🟢 HELPER FUNCTION: ສຳລັບບັນທຶກ Audit Log
    // ==========================================
    // private async logAudit(
    //     tableName: string,
    //     recordId: number,
    //     action: 'CREATE' | 'UPDATE' | 'DELETE',
    //     oldValues: any,
    //     newValues: any,
    //     performedBy: number,
    //     t?: Transaction // 🟢 ເຮັດໃຫ້ Transaction ເປັນ Optional ເພາະບາງຟັງຊັນບໍ່ໄດ້ໃຊ້ Transaction
    // ) {
    //     let changedColumns: any = undefined;
    //     if (action === 'UPDATE' && oldValues && newValues) {
    //         const changes: string[] = [];
    //         for (const key in newValues) {
    //             if (newValues[key] !== undefined && oldValues[key] != newValues[key]) {
    //                 changes.push(key);
    //             }
    //         }
    //         if (changes.length === 0) return;
    //         changedColumns = changes;
    //     }
    //     const logOptions = t ? { transaction: t } : {};
    //     await db.audit_logs.create({
    //         table_name: tableName,
    //         record_id: recordId,
    //         action: action,
    //         old_values: oldValues || undefined,
    //         new_values: newValues || undefined,
    //         changed_columns: changedColumns,
    //         performed_by: performedBy
    //     }, logOptions);
    // }
    async createPartner(data) {
        // 🟢 ເພີ່ມ Transaction ສຳລັບຄວາມປອດໄພ
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const cleanPartner = { ...data };
            if (!cleanPartner.user_id || cleanPartner.user_id === 0) {
                throw new Error('User ID is required');
            }
            if (!cleanPartner.shop_owner || cleanPartner.shop_owner.trim() === '') {
                throw new Error('Shop_Owner is required');
            }
            if (!cleanPartner.shop_name || cleanPartner.shop_name.trim() === '') {
                throw new Error('shop_name is required');
            }
            if (!cleanPartner.business_type || cleanPartner.business_type.trim() === '') {
                throw new Error('business_type is required');
            }
            const existPartner = await init_models_1.db.partners.findOne({
                where: { shop_name: cleanPartner.shop_name },
                transaction: t
            });
            if (existPartner) {
                logger_1.logger.error(`Shop name already exists: ${cleanPartner.shop_name}`);
                throw new Error('Shop name already exists');
            }
            const last_shop_id = await init_models_1.db.partners.findOne({
                order: [['shop_id', 'DESC']],
                attributes: ['shop_id'],
                transaction: t
            });
            let newShopNumber = 1;
            if (last_shop_id && last_shop_id.shop_id) {
                const shopIdParts = last_shop_id.shop_id.split('-');
                if (shopIdParts.length === 2) {
                    const lastNumber = parseInt(shopIdParts[1], 10);
                    if (!isNaN(lastNumber)) {
                        newShopNumber = lastNumber + 1;
                    }
                    else {
                        logger_1.logger.warn(`Invalid shop_id format detected: ${last_shop_id.shop_id}, starting from 1`);
                    }
                }
                else {
                    logger_1.logger.warn(`Unexpected shop_id format: ${last_shop_id.shop_id}, starting from 1`);
                }
            }
            const paddedNumber = newShopNumber.toString().padStart(6, '0');
            cleanPartner.shop_id = `Shop-${paddedNumber}`;
            const mapData = {
                user_id: cleanPartner.user_id,
                shop_id: cleanPartner.shop_id,
                shop_name: cleanPartner.shop_name,
                shop_owner: cleanPartner.shop_owner,
                contact_number: cleanPartner.contact_number || null,
                address: cleanPartner.address || null,
                shop_logo_url: cleanPartner.shop_logo_url || null,
                business_type: cleanPartner.business_type
            };
            const newPartner = await init_models_1.db.partners.create(mapData, { transaction: t });
            // 🟢 ບັນທຶກ Audit Log (CREATE)
            const performedBy = data.user_id || data.performed_by || 1;
            await (0, auditLogger_1.logAudit)('partners', newPartner.id, 'CREATE', null, newPartner.toJSON(), performedBy, t);
            await t.commit();
            logger_1.logger.info(`Partner created with ID: ${newPartner.id}`);
            return newPartner;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error creating partner: ${error.message}`);
            throw error;
        }
    }
    async findPartnerById(partnerId) {
        return await init_models_1.db.partners.findByPk(partnerId);
    }
    async findPartnerByUserId(userId) {
        return await init_models_1.db.partners.findOne({
            where: {
                user_id: userId,
                is_active: 1
            }
        });
    }
    async findAllPartner() {
        return await init_models_1.db.partners.findAll({
            where: {
                is_active: 1
            }
        });
    }
    async findPartnerByShopName(shopName) {
        return await init_models_1.db.partners.findOne({ where: { shop_name: shopName } });
    }
    // 🟢 ອັບເດດໃຫ້ຮັບ performedBy ມານຳ ເພື່ອບັນທຶກ Log (ປ່ຽນ data เป็น any เพื่อให้รับข้อมูลอิสระได้)
    async updatePartner(partnerId, data = {}) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const partner = await this.findPartnerById(partnerId);
            if (!partner) {
                logger_1.logger.error(`Partner with ID: ${partnerId} not found`);
                await t.rollback();
                return null;
            }
            const oldData = partner.toJSON();
            const updateData = {};
            if (data.shop_name !== undefined)
                updateData.shop_name = data.shop_name;
            if (data.shop_owner !== undefined)
                updateData.shop_owner = data.shop_owner;
            if (data.contact_number !== undefined)
                updateData.contact_number = data.contact_number;
            if (data.business_type !== undefined)
                updateData.business_type = data.business_type;
            if (data.address !== undefined)
                updateData.address = data.address;
            if (data.shop_logo_url !== undefined)
                updateData.shop_logo_url = data.shop_logo_url;
            const updatedPartner = await partner.update(updateData, { transaction: t });
            // 🟢 ບັນທຶກ Audit Log (UPDATE)
            const performedBy = data.performed_by || data.user_id || 1;
            await (0, auditLogger_1.logAudit)('partners', partnerId, 'UPDATE', oldData, updateData, performedBy, t);
            await t.commit();
            logger_1.logger.info(`Partner updated with ID: ${partnerId}`);
            return updatedPartner;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error updating partner: ${error.message}`);
            throw error;
        }
    }
    // 🟢 ອັບເດດໃຫ້ຮັບ performedBy ມານຳ ເພື່ອບັນທຶກ Log
    async SwitchStatusPartner(partnerId, is_active, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const Partner = await init_models_1.db.partners.findOne({
                where: { id: partnerId },
                transaction: t
            });
            if (!Partner) {
                logger_1.logger.error(`No Partner found for partner ID: ${partnerId} to Inactive`);
                await t.rollback();
                return false;
            }
            const oldData = Partner.toJSON();
            const updateData = { is_active: is_active };
            await Partner.update(updateData, { transaction: t });
            // 🟢 ບັນທຶກ Audit Log (UPDATE ປ່ຽນສະຖານະ)
            await (0, auditLogger_1.logAudit)('partners', partnerId, 'UPDATE', oldData, updateData, performedBy, t);
            await t.commit();
            logger_1.logger.info(`Partner switch Status with ID: ${partnerId}`);
            return true;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error SwitchStatusPartner: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new PartnerRepository();
