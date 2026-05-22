import cron from 'node-cron';
import { PartitionService } from '../services/partition.service';
import { logger } from '../utils/logger';

// ทำงานทุกวัน เวลา 02:00 น.
export const startPartitionCron = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.info('⏰ [Cron] Running daily database partition check...');
    
    // ใส่ชื่อตารางที่คุณทำ Partition ไว้ (เช่น notifications)
    const tables = ['notifications']; 

    for (const table of tables) {
      await PartitionService.ensureFuturePartitions(table);
    }
    
    logger.info('⏰ [Cron] Daily database partition check completed.');
  }, {
    timezone: "Asia/Vientiane" // หรือ timezone ที่คุณใช้ (อิงตาม +07:00)
  });
};