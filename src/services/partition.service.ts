import cron from 'node-cron';
import { sequelize } from '../config/db.config'; // ปรับ path ให้ตรงกับโปรเจกต์ของคุณ
import { QueryTypes } from 'sequelize';
import { logger } from '../utils/logger';
import redisService from './redis.service'; // ปรับ path ให้ตรงกับโปรเจกต์ของคุณ

class PartitionService {
    
    // กำหนดรายชื่อตารางที่ต้องการจัดการ Partition แบบ Dynamic
    private readonly PARTITIONED_TABLES = ['notifications'];
    
    // ตั้งค่า Lock timeout สำหรับ Redis
    private readonly LOCK_TIMEOUT = 1800; // Lock ไว้ 30 นาที

    /**
     * รันตรวจสอบและสร้าง Partition ล่วงหน้า 3 เดือนสำหรับ 1 ตาราง
     * @param tableName ชื่อตารางที่ต้องการจัดการ
     */
    private async ensureFuturePartitions(tableName: string): Promise<void> {
        try {
            // 1. คำนวณหาเป้าหมาย: วันนี้ + 3 เดือน
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + 3);

            const targetYear = targetDate.getFullYear();
            const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
            
            // ชื่อ Partition เช่น p2026_09
            const partitionName = `p${targetYear}_${targetMonth}`;

            // 2. คำนวณจุดสิ้นสุดของเดือนนั้น (ขอบเขต VALUES LESS THAN)
            // ต้องเป็นวันที่ 1 ของเดือนถัดไป
            const nextMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
            const boundaryYear = nextMonthDate.getFullYear();
            const boundaryMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
            const boundaryDateString = `${boundaryYear}-${boundaryMonth}-01 00:00:00`;

            const dbName = sequelize.config.database; // ดึงชื่อ DB จาก Config

            // 3. ตรวจสอบว่า Partition นี้มีอยู่แล้วหรือไม่
            const checkQuery = `
                SELECT PARTITION_NAME 
                FROM information_schema.PARTITIONS 
                WHERE TABLE_SCHEMA = :dbName 
                AND TABLE_NAME = :tableName 
                AND PARTITION_NAME = :partitionName
            `;

            const existingPartitions: any[] = await sequelize.query(checkQuery, {
                replacements: { dbName, tableName, partitionName },
                type: QueryTypes.SELECT
            });

            // 4. ถ้ามีแล้ว ให้ข้ามการทำงาน
            if (existingPartitions.length > 0) {
                logger.info(`[PartitionService] Partition ${partitionName} already exists for table ${tableName}.`);
                return;
            }

            logger.info(`[PartitionService] Creating new partition ${partitionName} for table ${tableName}...`);

            // 5. ถ้ายังไม่มี ให้สร้างใหม่โดยการ REORGANIZE p_future
            const alterQuery = `
                ALTER TABLE ${tableName}
                REORGANIZE PARTITION p_future INTO (
                    PARTITION ${partitionName} VALUES LESS THAN ('${boundaryDateString}'),
                    PARTITION p_future VALUES LESS THAN (MAXVALUE)
                );
            `;

            await sequelize.query(alterQuery);
            
            logger.info(`[PartitionService] Successfully created partition ${partitionName} (Values less than ${boundaryDateString}).`);

        } catch (error) {
            logger.error(`[PartitionService] Error creating partition for table ${tableName}:`, error);
        }
    }

    /**
     * ฟังก์ชันหลักสำหรับดึงตารางทั้งหมดมาวนลูปทำ Partition พร้อมจัดการ Redis Lock
     */
    public async processPartitions() {
        const LOCK_KEY = 'lock:cron:daily_partitions';
        let hasLock = false;

        try {
            // 🔐 1. ยึด Lock ผ่าน Redis
            await redisService.connect();
            hasLock = await redisService.setLock(LOCK_KEY, 'processing', this.LOCK_TIMEOUT);
        } catch (error) {
            logger.warn(`[PartitionService] ⚠️ Redis unavailable, proceeding without lock:`, error);
            hasLock = true; // ยอมให้ทำงานต่อโดยไม่มีการล็อกถ้า Redis ล่ม
        }

        if (!hasLock) {
            logger.info(`[PartitionService] 🚫 Skip: Another server is already processing partitions.`);
            return;
        }

        logger.info(`[PartitionService] Start scanning for database partitions...`);

        // วนลูปสร้าง Partition ให้กับตารางทั้งหมดที่กำหนดไว้
        for (const table of this.PARTITIONED_TABLES) {
            await this.ensureFuturePartitions(table);
        }

        logger.info(`[PartitionService] Completed partition processing.`);
    }

    /**
     * เริ่มต้นการทำงานของ Cron Job
     */
    public startCronJob() {
        // รันทุกๆ ตี 02:00 ของทุกวัน
        cron.schedule('0 2 * * *', async () => {
            logger.info('⏰ Cron Job Triggered: Database Partition Check');
            await this.processPartitions();
        }, {
            timezone: "Asia/Vientiane"
        });
    }
}

export default new PartitionService();