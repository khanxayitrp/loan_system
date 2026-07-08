import { Router } from 'express';
// 🟢 Import ฟังก์ชันให้ตรงกับที่ส่งออกมาจาก Controller
import { 
    fetchMyNotifications, 
    fetchMySupperAppNotifications,
    fetchMyUnreadCount, 
    fetchMyMySupperAppUnreadCount,
    markNotificationAsRead,
    markMySupperAppNotificationAsRead 
} from '../controllers/notification.controller';
import { verifyToken, verifyCustomerToken } from '../middlewares/auth.middleware'; // สมมติว่ามี middleware คอยเช็คสิทธิ์ล็อกอิน JWT


const router = Router();

// 🔔 Route สำหรับดึงข้อมูลแจ้งเตือนทั้งหมด พร้อมยอด Unread
router.get('/my-notifications', verifyToken, fetchMyNotifications);

// 🔔 Route สำหรับดึงข้อมูลแจ้งเตือนทั้งหมด พร้อมยอด Unread
router.get('/my-supperapp-notifications', verifyCustomerToken, fetchMySupperAppNotifications);

// 🔔 Route สำหรับดึงเฉพาะยอด Unread Count (สำหรับไอคอนกระดิ่งสีแดง)
router.get('/unread-count', verifyToken, fetchMyUnreadCount);

// 🔔 Route สำหรับดึงเฉพาะยอด Unread Count (สำหรับไอคอนกระดิ่งสีแดง)
router.get('/my-supperapp-unread-count', verifyCustomerToken, fetchMyMySupperAppUnreadCount);

// 🔔 Route สำหรับอัปเดตสถานะเป็น "อ่านแล้ว" ของแจ้งเตือนชิ้นนั้นๆ
router.put('/:id/read', verifyToken, markNotificationAsRead);

// 🔔 Route สำหรับอัปเดตสถานะเป็น "อ่านแล้ว" ของแจ้งเตือนชิ้นนั้นๆ
router.put('/my-supperapp/:id/read', verifyCustomerToken, markMySupperAppNotificationAsRead);

export default router;