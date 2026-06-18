"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loan_restructure_service_1 = __importDefault(require("../services/loan_restructure.service"));
const errors_1 = require("../utils/errors");
class LoanRestructureController {
    constructor() {
        /**
         * ดำเนินการปรับโครงสร้างหนี้ (Process Loan Restructuring)
         */
        this.restructureLoan = async (req, res, next) => {
            try {
                // 1. รับค่าจาก Params และ Body
                const applicationId = parseInt(req.params.application_id, 10);
                const { scheduleData } = req.body;
                // 2. ดึง User ID จาก Token ที่ Login อยู่
                const userId = req.userPayload?.userId;
                // 3. Validation พื้นฐาน (ก่อนส่งให้ Service)
                if (isNaN(applicationId)) {
                    throw new errors_1.BadRequestError('ຮູບແບບລະຫັດສິນເຊື່ອບໍ່ຖືກຕ້ອງ (Invalid Application ID)');
                }
                if (!userId) {
                    throw new errors_1.UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ (Unauthorized)');
                }
                if (!scheduleData || !Array.isArray(scheduleData) || scheduleData.length === 0) {
                    throw new errors_1.BadRequestError('ກະລຸນາສົ່ງຂໍ້ມູນຕາຕະລາງຜ່ອນໃໝ່ (Schedule data is required)');
                }
                // 4. เรียกใช้งาน Service ที่เราสร้างไว้
                const newSchedule = await loan_restructure_service_1.default.processRestructure(applicationId, scheduleData, userId);
                // 5. ส่ง Response กลับไปให้ Frontend
                return res.status(200).json({
                    success: true,
                    message: 'ສ້າງຕາຕະລາງປັບໂຄງສ້າງໜີ້ສຳເລັດແລ້ວ (Loan restructured successfully)',
                    data: newSchedule
                });
            }
            catch (error) {
                // ส่ง Error ไปให้ Global Error Handler จัดการ
                next(error);
            }
        };
    }
}
exports.default = new LoanRestructureController();
