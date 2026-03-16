"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_models_1 = require("../models/init-models");
const logger_1 = require("../utils/logger");
const customer_locations_1 = require("../models/customer_locations");
// 🟢 1. Import Helper ของเราเข้ามา
const auditLogger_1 = require("../utils/auditLogger");
class CustomerLocationService {
    /**
     * ✅ 1. บันทึกที่อยู่ใหม่ (พร้อม Transaction)
     * 🟢 รับ performedBy (user_id) เพิ่มเติมเพื่อเก็บ Log
     */
    async createLocation(data, // 🟢 ปรับเป็น any ชั่วคราวเพื่อให้รับ performed_by มาด้วยได้
    performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            // ✅ ตรวจสอบว่าต้องมี customer_id
            if (!data.customer_id) {
                throw new Error('customer_id เป็นข้อมูลบังคับ');
            }
            // 🟢 ดึง User ID ที่ทำการสร้าง (อาจส่งมาใน data หรือ Parameter)
            const userId = data.user_id || data.performed_by || performedBy;
            // ✅ ถ้าเป็นที่อยู่หลัก (is_primary = 1) ให้ reset ที่อยู่หลักเดิมก่อน
            if (data.is_primary === 1) {
                await this.resetPrimaryStatus(data.customer_id, userId, t);
            }
            const newLocation = await customer_locations_1.customer_locations.create(data, { transaction: t });
            // 🟢 บันทึก Audit Log (CREATE)
            await (0, auditLogger_1.logAudit)('customer_locations', newLocation.id, 'CREATE', null, newLocation.toJSON(), userId, t);
            await t.commit();
            return newLocation;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error creating location: ${error.message}`);
            throw error;
        }
    }
    /**
     * ✅ 2. อัปเดตที่อยู่ (พร้อม Transaction)
     * 🟢 รับ performedBy เพิ่มเติม
     */
    async updateLocation(id, data, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            // 🟢 ดึงข้อมูลเดิมก่อนอัปเดตเพื่อทำ Audit Log
            const currentLocation = await customer_locations_1.customer_locations.findByPk(id, { transaction: t });
            if (!currentLocation) {
                await t.rollback();
                throw new Error(`Location with ID: ${id} not found`);
            }
            const oldData = currentLocation.toJSON();
            const userId = data.user_id || data.performed_by || performedBy;
            // ✅ ถ้ามีการตั้งค่า is_primary = 1
            if (data.is_primary === 1) {
                const customerId = data.customer_id || currentLocation.customer_id;
                if (customerId) {
                    await this.resetPrimaryStatus(customerId, userId, t);
                }
            }
            // 🟢 อัปเดตข้อมูล (แก้ไขการดึงผลลัพธ์ให้ถูกต้องตามหลัก Instance Update)
            const updatedLocation = await currentLocation.update(data, { transaction: t });
            // 🟢 บันทึก Audit Log (UPDATE)
            await (0, auditLogger_1.logAudit)('customer_locations', id, 'UPDATE', oldData, data, userId, t);
            await t.commit();
            return updatedLocation;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error updating location: ${error.message}`);
            throw error;
        }
    }
    /**
     * ✅ 3. ฟังก์ชันภายใน: Reset ค่า Primary
     * 🟢 เพิ่มการบันทึก Audit Log สำหรับการ Reset
     */
    async resetPrimaryStatus(customerId, performedBy, t) {
        // หา Location ที่กำลังเป็น Primary อยู่
        const primaryLocation = await customer_locations_1.customer_locations.findOne({
            where: { customer_id: customerId, is_primary: 1 },
            transaction: t
        });
        // ถ้ามี ให้เปลี่ยนสถานะและบันทึก Log
        if (primaryLocation) {
            const oldData = primaryLocation.toJSON();
            await primaryLocation.update({ is_primary: 0 }, { transaction: t });
            // 🟢 บันทึก Audit Log (UPDATE การถอด Primary)
            await (0, auditLogger_1.logAudit)('customer_locations', primaryLocation.id, 'UPDATE', oldData, { is_primary: 0 }, performedBy, t);
        }
    }
    /**
     * ✅ 4. ดึงรายการ Location ของลูกค้า
     */
    async getLocationsByCustomerId(customerId) {
        return await customer_locations_1.customer_locations.findAll({
            where: { customer_id: customerId },
            order: [['is_primary', 'DESC'], ['id', 'ASC']]
        });
    }
    /**
     * ✅ 5. ลบ Location
     * 🟢 รับ performedBy และใช้ Transaction เพิ่มเติม
     */
    async deleteLocation(id, performedBy = 1) {
        const t = await init_models_1.db.sequelize.transaction();
        try {
            const location = await customer_locations_1.customer_locations.findByPk(id, { transaction: t });
            if (!location) {
                await t.rollback();
                return false;
            }
            const oldData = location.toJSON();
            await location.destroy({ transaction: t });
            // 🟢 บันทึก Audit Log (DELETE)
            await (0, auditLogger_1.logAudit)('customer_locations', id, 'DELETE', oldData, null, performedBy, t);
            await t.commit();
            return true;
        }
        catch (error) {
            await t.rollback();
            logger_1.logger.error(`Error deleting location: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new CustomerLocationService();
