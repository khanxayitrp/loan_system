"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMyUnreadCount = exports.markNotificationAsRead = exports.fetchMyNotifications = void 0;
const notification_service_1 = __importDefault(require("../services/notification.service"));
const notification_1 = require("../types/notification");
const fetchMyNotifications = async (req, res, next) => {
    try {
        // ดึงจาก Token (ป้องกันคนอื่นมาดูข้อมูลเรา)
        const userId = req.userPayload?.userId;
        const userType = req.userPayload?.role === 'customer' ? notification_1.RecipientType.CUSTOMER : notification_1.RecipientType.STAFF;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await notification_service_1.default.getNotifications(userType, Number(userId), page, limit);
        return res.status(200).json({
            success: true,
            message: 'Notifications fetched successfully',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.fetchMyNotifications = fetchMyNotifications;
const markNotificationAsRead = async (req, res, next) => {
    try {
        const notificationId = parseInt(req.params.id);
        const userId = req.userPayload?.userId;
        const userType = req.userPayload?.role === 'customer' ? notification_1.RecipientType.CUSTOMER : notification_1.RecipientType.STAFF;
        const result = await notification_service_1.default.markAsRead(notificationId, userType, Number(userId));
        return res.status(200).json({
            success: true,
            message: result ? 'Marked as read' : 'Notification not found or already read'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const fetchMyUnreadCount = async (req, res, next) => {
    try {
        const userId = req.userPayload?.userId;
        const userType = req.userPayload?.role === 'customer' ? notification_1.RecipientType.CUSTOMER : notification_1.RecipientType.STAFF;
        const unreadCount = await notification_service_1.default.getUnreadCount(userType, Number(userId));
        return res.status(200).json({
            success: true,
            data: { unread_count: unreadCount }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.fetchMyUnreadCount = fetchMyUnreadCount;
