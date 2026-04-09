"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loan_contract_service_1 = __importDefault(require("../services/loan_contract.service"));
const redis_service_1 = __importDefault(require("../services/redis.service")); // 🟢 1. Import Redis
class LoanContractController {
    // =======================================================
    // 🔴 สร้างสัญญาเช่าซื้อ (Create)
    // =======================================================
    async createLoanContract(req, res) {
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
            const loan_applicationsData = {
                ...data,
                loan_id,
                performed_by: Number(userId)
            };
            console.log('loan_applicationsData all ', loan_applicationsData);
            // 1. บันทึกข้อมูลลงฐานข้อมูล
            const result = await loan_contract_service_1.default.createLoanContract(loan_applicationsData);
            // =========================================================
            // 🟢 2. THE ULTIMATE CACHE INVALIDATION (ล้างแคชทิ้ง!)
            // =========================================================
            // ล้างแคชรายละเอียดสัญญาของ ID นี้ (เผื่อเคยมีใครกดดูร่างสัญญาก่อนหน้านี้)
            await redis_service_1.default.del(`cache:loan_contract:${loan_id}`);
            // ล้างแคชรายการสัญญาทั้งหมด (เผื่อต้องโชว์ใน Dashboard)
            await redis_service_1.default.delByPattern('cache:loan_contracts:list:*');
            // 🔥 สำคัญ: ล้างแคช PDF ทั้งหมดที่เกี่ยวกับสัญญานี้ เพื่อให้ได้ PDF เวอร์ชั่นที่มีข้อมูลใหม่ 🔥
            await redis_service_1.default.del(`cache:pdf:loan-form:${loan_id}`);
            await redis_service_1.default.del(`cache:pdf:contract:${loan_id}`);
            await redis_service_1.default.del(`cache:pdf:schedule:${loan_id}`);
            // (ถ้าคุณมี ID ซ้อนทับกันระหว่าง contractId และ loanId ในอนาคต ให้ลบเผื่อให้ครบนะครับ)
            res.status(201).json({
                success: true,
                message: 'ສ້າງ Loan Contract ສຳເລັດແລ້ວ',
                data: result
            });
        }
        catch (error) {
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
    async getLoanContract(req, res) {
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
            const cachedContract = await redis_service_1.default.get(cacheKey);
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
            const result = await loan_contract_service_1.default.getLoanContract(loan_id);
            // =========================================================
            // 🟢 3. บันทึกข้อมูลที่ได้ลงใน Redis (ตั้งอายุไว้ 15 นาที หรือ 900 วินาที)
            // =========================================================
            if (result) {
                // เก็บเฉพาะข้อมูลที่มีอยู่จริง เพื่อลดขยะใน Redis
                await redis_service_1.default.set(cacheKey, JSON.stringify(result), 900);
            }
            res.status(200).json({
                success: true,
                message: 'ດຶງ Loan Contract ສຳເລັດແລ້ວ',
                data: result
            });
        }
        catch (error) {
            console.error('Error fetching loan contract:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
    // =======================================================
    // 🟢 ดึงข้อมูลสัญญาเช่าซื้อจากฝั่งลูกค้า (Read)
    // =======================================================
    async getLoanContractFromCustomer(req, res) {
        try {
            const loan_id = parseInt(req.params.application_id, 10);
            const custID = req.customerPayload?.userId;
            if (!custID) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: Customer ID not found in token'
                });
            }
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
            const cachedContract = await redis_service_1.default.get(cacheKey);
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
            const result = await loan_contract_service_1.default.getLoanContract(loan_id);
            // =========================================================
            // 🟢 3. บันทึกข้อมูลที่ได้ลงใน Redis (ตั้งอายุไว้ 15 นาที หรือ 900 วินาที)
            // =========================================================
            if (result) {
                // เก็บเฉพาะข้อมูลที่มีอยู่จริง เพื่อลดขยะใน Redis
                await redis_service_1.default.set(cacheKey, JSON.stringify(result), 900);
            }
            res.status(200).json({
                success: true,
                message: 'ດຶງ Loan Contract ສຳເລັດແລ້ວ',
                data: result
            });
        }
        catch (error) {
            console.error('Error fetching loan contract:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
}
exports.default = new LoanContractController();
