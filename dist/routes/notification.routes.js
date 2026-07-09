"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// 🟢 Import ฟังก์ชันให้ตรงกับที่ส่งออกมาจาก Controller
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // สมมติว่ามี middleware คอยเช็คสิทธิ์ล็อกอิน JWT
const router = (0, express_1.Router)();
// 🔔 Route สำหรับดึงข้อมูลแจ้งเตือนทั้งหมด พร้อมยอด Unread
router.get('/my-notifications', auth_middleware_1.verifyToken, notification_controller_1.fetchMyNotifications);
// 🔔 Route สำหรับดึงข้อมูลแจ้งเตือนทั้งหมด พร้อมยอด Unread
router.get('/my-supperapp-notifications', auth_middleware_1.verifyCustomerToken, notification_controller_1.fetchMySupperAppNotifications);
// 🔔 Route สำหรับดึงเฉพาะยอด Unread Count (สำหรับไอคอนกระดิ่งสีแดง)
router.get('/unread-count', auth_middleware_1.verifyToken, notification_controller_1.fetchMyUnreadCount);
// 🔔 Route สำหรับดึงเฉพาะยอด Unread Count (สำหรับไอคอนกระดิ่งสีแดง)
router.get('/my-supperapp-unread-count', auth_middleware_1.verifyCustomerToken, notification_controller_1.fetchMyMySupperAppUnreadCount);
// 🔔 Route สำหรับอัปเดตสถานะเป็น "อ่านแล้ว" ของแจ้งเตือนชิ้นนั้นๆ
router.put('/:id/read', auth_middleware_1.verifyToken, notification_controller_1.markNotificationAsRead);
// 🔔 Route สำหรับอัปเดตสถานะเป็น "อ่านแล้ว" ของแจ้งเตือนชิ้นนั้นๆ
router.put('/my-supperapp/:id/read', auth_middleware_1.verifyCustomerToken, notification_controller_1.markMySupperAppNotificationAsRead);
exports.default = router;
