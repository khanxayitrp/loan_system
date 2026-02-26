import { Transaction } from "sequelize";
import { db } from "../models/init-models";
import { logger } from "../utils/logger";
import { 
    customer_locations, 
    customer_locationsAttributes, 
    customer_locationsCreationAttributes 
} from "../models/customer_locations";

class CustomerLocationService {
    /**
     * ✅ 1. บันทึกที่อยู่ใหม่ (พร้อม Transaction)
     * ⚠️ รับค่าจาก Controller ที่ validate แล้ว
     */
    public async createLocation(
        data: customer_locationsCreationAttributes
    ): Promise<customer_locations> {
        const t = await db.sequelize.transaction();
        
        try {
            // ✅ ตรวจสอบว่าต้องมี customer_id
            if (!data.customer_id) {
                throw new Error('customer_id เป็นข้อมูลบังคับ');
            }

            // ✅ ถ้าเป็นที่อยู่หลัก (is_primary = 1) ให้ reset ที่อยู่หลักเดิมก่อน
            if (data.is_primary === 1) {
                await this.resetPrimaryStatus(data.customer_id, t);
            }

            const newLocation = await customer_locations.create(data, { transaction: t });
            await t.commit();
            
            return newLocation;
        } catch (error) {
            await t.rollback();
            logger.error(`Error creating location: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * ✅ 2. อัปเดตที่อยู่ (พร้อม Transaction)
     * ⚠️ รับค่าจาก Controller ที่ validate แล้ว
     */
    public async updateLocation(
        id: number, 
        data: Partial<customer_locationsAttributes>
    ): Promise<[number, customer_locations[]]> {
        const t = await db.sequelize.transaction();
        
        try {
            // ✅ ถ้ามีการตั้งค่า is_primary = 1
            if (data.is_primary === 1) {
                let customerId = data.customer_id;
                
                // ✅ ถ้าไม่มี customer_id ใน data ให้ดึงจาก database
                if (!customerId) {
                    const currentLocation = await customer_locations.findByPk(id, { 
                        transaction: t 
                    });
                    customerId = currentLocation?.customer_id;
                }

                if (customerId) {
                    await this.resetPrimaryStatus(customerId, t);
                }
            }

            const result = await customer_locations.update(data, { 
                where: { id }, 
                transaction: t 
            });

            await t.commit();
            return result as any;
        } catch (error) {
            await t.rollback();
            logger.error(`Error updating location: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * ✅ 3. ฟังก์ชันภายใน: Reset ค่า Primary
     */
    private async resetPrimaryStatus(
        customerId: number, 
        t: Transaction
    ): Promise<void> {
        await customer_locations.update(
            { is_primary: 0 },
            { 
                where: { 
                    customer_id: customerId, 
                    is_primary: 1 
                }, 
                transaction: t 
            }
        );
    }

    /**
     * ✅ 4. ดึงรายการ Location ของลูกค้า
     */
    public async getLocationsByCustomerId(
        customerId: number
    ): Promise<customer_locations[]> {
        return await customer_locations.findAll({
            where: { customer_id: customerId },
            order: [['is_primary', 'DESC'], ['id', 'ASC']]
        });
    }

    /**
     * ✅ 5. ลบ Location
     */
    public async deleteLocation(id: number): Promise<number> {
        return await customer_locations.destroy({ 
            where: { id } 
        });
    }
}

export default new CustomerLocationService();