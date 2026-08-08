import { Request, Response } from 'express';
import { db } from '../models/init-models'; // เพิ่มบรรทัดนี้
import { DashboardService } from '../services/Dashboard.service'; // ตรวจสอบชื่อไฟล์ให้ตรงกับความเป็นจริง
import redisClient from '../services/redis.service';
import { logger } from '../utils/logger';

const dashboardService = new DashboardService();

export class DashboardController {

    async getSummary(req: Request, res: Response) {
        try {
            const cacheKey = 'dashboard:summary:admin';

            // 1. ตรวจสอบ Redis Cache ว่าเชื่อมต่ออยู่หรือไม่
            // 🌟 แก้ไข: ใช้ isClientConnected() แทน .status === 'ready'
            if (redisClient.isClientConnected()) {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json({
                        success: true,
                        source: 'cache',
                        data: JSON.parse(cachedData)
                    });
                }
            }

            // 2. ถ้าไม่มี Cache หรือ Redis ไม่เชื่อมต่อ ให้เรียก Service ไปดึงจาก Database
            const summaryData = await dashboardService.getAdminSummary();

            // 3. บันทึกลง Redis Cache ตั้ง TTL ไว้ 5 นาที (300 วินาที)
            // 🌟 แก้ไข: ใช้ isClientConnected() แทน isReady
            if (redisClient.isClientConnected()) {
                // 🌟 แก้ไข: ใช้ method .set() ของคุณที่รับพารามิเตอร์ 3 ตัว (key, value, ttl) แทน .setEx()
                await redisClient.set(cacheKey, JSON.stringify(summaryData), 300);
            }

            return res.status(200).json({
                success: true,
                source: 'database',
                data: summaryData
            });

        } catch (error: any) {
            logger.error(`[DashboardController] Get Summary Error: ${error.message}`);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    // API สำหรับ Force Refresh (เผื่อ User กดปุ่ม Refresh บนหน้าเว็บ)
    async clearCache(req: Request, res: Response) {
        try {
            // 🌟 แก้ไข: ใช้ isClientConnected() แทน isReady
            if (redisClient.isClientConnected()) {
                await redisClient.del('dashboard:summary:admin');
            }
            return res.status(200).json({ success: true, message: 'Dashboard cache cleared' });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    // เพิ่ม Method นี้ต่อจาก getSummary (ของ Admin)
    async getPartnerSummary(req: Request, res: Response) {
        try {
            // 1. ดึงข้อมูล User จาก Token
            const userId = req.userPayload?.userId;
            if (!userId) return res.status(401).json({ message: 'Unauthorized' });

            // 2. Ownership Check: ค้นหา partner_id ของ User คนนี้ (สำคัญมาก)
            // สมมติว่า model ของคุณชื่อ db.partners
            const partner = await db.partners.findOne({ where: { user_id: userId } });

            if (!partner) {
                return res.status(403).json({ success: false, message: 'Partner account not found' });
            }

            const partnerId = partner.id;
            const cacheKey = `dashboard:summary:partner:${partnerId}`;

            // 3. ตรวจสอบ Redis Cache
            if (redisClient.isClientConnected()) {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json({
                        success: true,
                        source: 'cache',
                        data: JSON.parse(cachedData)
                    });
                }
            }

            // 4. ดึงข้อมูลจาก Database
            const summaryData = await dashboardService.getPartnerSummary(partnerId);

            // 5. บันทึกลง Cache (5 นาที)
            if (redisClient.isClientConnected()) {
                await redisClient.set(cacheKey, JSON.stringify(summaryData), 300);
            }

            return res.status(200).json({
                success: true,
                source: 'database',
                data: summaryData
            });

        } catch (error: any) {
            logger.error(`[DashboardController] Get Partner Summary Error: ${error.message}`);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}