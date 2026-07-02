"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const multer_1 = __importDefault(require("multer")); // 🟢 1. Import multer เข้ามาด้วย
/**
 * Global Error Handler Middleware
 * คอยดักจับ Error ทั้งหมดที่เกิดขึ้นในระบบ และส่ง Response กลับไปในรูปแบบ (Format) เดียวกันเสมอ
 */
const errorHandler = (err, req, res, next) => {
    // =========================================================
    // 🟢 2. ดักจับ Error จาก Multer โดยเฉพาะ
    // =========================================================
    if (err instanceof multer_1.default.MulterError) {
        let message = 'ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດໄຟລ໌'; // ข้อความ Default
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'ຂະໜາດໄຟລ໌ໃຫຍ່ເກີນໄປ (File too large)';
        }
        else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'ອັບໂຫຼດໄຟລ໌ເກີນຈຳນວນທີ່ກຳນົດ (Too many files)';
        }
        return res.status(400).json({
            success: false,
            status_code: 400,
            message: message,
            error: { message }
        });
    }
    // 🟢 3. ดักจับ Error จาก fileFilter ของคุณที่โยนมาว่า "Invalid file type..."
    if (err instanceof Error && err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            status_code: 400,
            message: 'ປະເພດໄຟລ໌ບໍ່ຖືກຕ້ອງ (Invalid file type)',
            error: { message: err.message }
        });
    }
    // =========================================================
    // 1. นำ Error ที่จับได้ ไปผ่านฟังก์ชัน handleErrorResponse เพื่อแยกแยะ Status Code และข้อความ
    const { status, message, details } = (0, errors_1.handleErrorResponse)(err);
    // 2. ปริ้นท์ Log ไว้ดูหลังบ้าน (เฉพาะกรณีที่เป็น 500 Server Error)
    if (status === 500) {
        console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
    }
    // 3. ส่ง JSON กลับไปให้ Frontend
    res.status(status).json({
        success: false, // บอก Frontend ชัดเจนว่า Request นี้ "ไม่สำเร็จ"
        status_code: status, // ส่งตัวเลขกลับไปด้วยเผื่อ Frontend เอาไปเช็คต่อ
        message: message, // ข้อความที่อธิบายว่าเกิดอะไรขึ้น (เช่น Validation Failed, Not Found, etc.)
        error: {
            message: message,
            ...(details && { details }), // ถ้ามี details (เช่น validation แจ้งเตือนรายช่อง) ก็ให้แนบไปด้วย
        },
    });
};
exports.errorHandler = errorHandler;
