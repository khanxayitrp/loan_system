import { Router } from 'express';
// 🟢 Import ฟังก์ชันให้ตรงกับที่ส่งออกมาจาก Controller
import { 
    fetchMyNotifications, 
    fetchMyUnreadCount, 
    markNotificationAsRead 
} from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware'; // สมมติว่ามี middleware คอยเช็คสิทธิ์ล็อกอิน JWT

const router = Router();

// 🔔 Route สำหรับดึงข้อมูลแจ้งเตือนทั้งหมด พร้อมยอด Unread
router.get('/my-notifications', verifyToken, fetchMyNotifications);

// 🔔 Route สำหรับดึงเฉพาะยอด Unread Count (สำหรับไอคอนกระดิ่งสีแดง)
router.get('/unread-count', verifyToken, fetchMyUnreadCount);

// 🔔 Route สำหรับอัปเดตสถานะเป็น "อ่านแล้ว" ของแจ้งเตือนชิ้นนั้นๆ
router.put('/:id/read', verifyToken, markNotificationAsRead);

export default router;