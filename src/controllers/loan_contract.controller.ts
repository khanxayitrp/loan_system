import { loan_applications } from './../models/loan_applications';
import { Request, Response } from "express";
import loan_contractService from "../services/loan_contract.service";
import redisService from "../services/redis.service"; // 🟢 1. Import Redis
import { logger } from "../utils/logger"; // (อ้างอิงจากที่คุณมีในไฟล์อื่น ๆ)

class LoanContractController {
    
    // =======================================================
    // 🔴 สร้างสัญญาเช่าซื้อ (Create)
    // =======================================================
    public async createLoanContract(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);
            const userId = req.userPayload?.userId;

            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ' 
                });
            }

            const data = req.body;
            if (!data) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'data is required' 
                });
            }

            const loan_applicationsData: any = {
                ...data,
                loan_id,
                performed_by: Number(userId)
            };

            console.log('loan_applicationsData all ', loan_applicationsData);
            
            // 1. บันทึกข้อมูลลงฐานข้อมูล
            const result = await loan_contractService.createLoanContract(loan_applicationsData);

            // =========================================================
            // 🟢 2. THE ULTIMATE CACHE INVALIDATION (ล้างแคชทิ้ง!)
            // =========================================================
            
            // ล้างแคชรายละเอียดสัญญาของ ID นี้ (เผื่อเคยมีใครกดดูร่างสัญญาก่อนหน้านี้)
            await redisService.del(`cache:loan_contract:${loan_id}`);

            // ล้างแคชรายการสัญญาทั้งหมด (เผื่อต้องโชว์ใน Dashboard)
            await redisService.delByPattern('cache:loan_contracts:list:*');

            // 🔥 สำคัญ: ล้างแคช PDF ทั้งหมดที่เกี่ยวกับสัญญานี้ เพื่อให้ได้ PDF เวอร์ชั่นที่มีข้อมูลใหม่ 🔥
            await redisService.del(`cache:pdf:loan-form:${loan_id}`);
            await redisService.del(`cache:pdf:contract:${loan_id}`);
            await redisService.del(`cache:pdf:schedule:${loan_id}`);
            // (ถ้าคุณมี ID ซ้อนทับกันระหว่าง contractId และ loanId ในอนาคต ให้ลบเผื่อให้ครบนะครับ)

            res.status(201).json({ 
                success: true, 
                message: 'ສ້າງ Loan Contract ສຳເລັດແລ້ວ',
                data: result 
            });
        } catch (error: any) {
            console.error('Error creating loan contract:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Internal Server Error' 
            });
        }
    }

    // =======================================================
    // 🟢 ดึงข้อมูลสัญญาเช่าซื้อ (Read)
    // =======================================================
    public async getLoanContract(req: Request, res: Response) {
        try {
            const loan_id = parseInt(req.params.loanId, 10);

            if (!loan_id || isNaN(loan_id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'loan_id ບໍ່ຖືກຕ້ອງ' 
                });
            }

            // =========================================================
            // 🟢 1. ตรวจสอบข้อมูลใน Redis Cache ก่อน (ความเร็วแสง)
            // =========================================================
            const cacheKey = `cache:loan_contract:${loan_id}`;
            const cachedContract = await redisService.get(cacheKey);

            if (cachedContract) {
                console.log(`[Cache Hit] Fetching Loan Contract ${loan_id} from Redis.`);
                return res.status(200).json({ 
                    success: true, 
                    message: 'ດຶງ Loan Contract ສຳເລັດແລ້ວ (From Cache)',
                    data: JSON.parse(cachedContract) 
                });
            }

            // =========================================================
            // 🔴 2. ถ้าไม่พบในแคช ไปดึงจากฐานข้อมูล
            // =========================================================
            console.log(`[Cache Miss] Fetching Loan Contract ${loan_id} from MySQL.`);
            const result = await loan_contractService.getLoanContract(loan_id);

            // =========================================================
            // 🟢 3. บันทึกข้อมูลที่ได้ลงใน Redis (ตั้งอายุไว้ 15 นาที หรือ 900 วินาที)
            // =========================================================
            if (result) {
                // เก็บเฉพาะข้อมูลที่มีอยู่จริง เพื่อลดขยะใน Redis
                await redisService.set(cacheKey, JSON.stringify(result), 900); 
            }

            res.status(200).json({ 
                success: true, 
                message: 'ດຶງ Loan Contract ສຳເລັດແລ້ວ',
                data: result 
            });
        } catch (error: any) {
            console.error('Error fetching loan contract:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Internal Server Error' 
            });
        }
    }
}

export default new LoanContractController();