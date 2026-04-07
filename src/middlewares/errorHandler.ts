// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { handleErrorResponse } from '../utils/errors';

/**
 * Global Error Handler Middleware
 * คอยดักจับ Error ทั้งหมดที่เกิดขึ้นในระบบ และส่ง Response กลับไปในรูปแบบ (Format) เดียวกันเสมอ
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. นำ Error ที่จับได้ ไปผ่านฟังก์ชัน handleErrorResponse เพื่อแยกแยะ Status Code และข้อความ
  const { status, message, details } = handleErrorResponse(err);

  // 2. ปริ้นท์ Log ไว้ดูหลังบ้าน (เฉพาะกรณีที่เป็น 500 Server Error)
  if (status === 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // 3. ส่ง JSON กลับไปให้ Frontend
  res.status(status).json({
    success: false,       // บอก Frontend ชัดเจนว่า Request นี้ "ไม่สำเร็จ"
    status_code: status,  // ส่งตัวเลขกลับไปด้วยเผื่อ Frontend เอาไปเช็คต่อ
    message: message,    // ข้อความที่อธิบายว่าเกิดอะไรขึ้น (เช่น Validation Failed, Not Found, etc.)
    error: {
      message: message,
      ...(details && { details }), // ถ้ามี details (เช่น validation แจ้งเตือนรายช่อง) ก็ให้แนบไปด้วย
    },
  });
};