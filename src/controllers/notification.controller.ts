import { Request, Response, NextFunction } from 'express';
import NotificationService from '../services/notification.service';
import { RecipientType } from '../types/notification';

export const fetchMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ดึงจาก Token (ป้องกันคนอื่นมาดูข้อมูลเรา)
        const userId = req.userPayload?.userId; 
        const userType = req.userPayload?.role === 'customer' ? RecipientType.CUSTOMER : RecipientType.STAFF;
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await NotificationService.getNotifications(userType, Number(userId), page, limit);

        return res.status(200).json({
            success: true,
            message: 'Notifications fetched successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notificationId = parseInt(req.params.id);
        const userId = req.userPayload?.userId;
        const userType = req.userPayload?.role === 'customer' ? RecipientType.CUSTOMER : RecipientType.STAFF;

        const result = await NotificationService.markAsRead(notificationId, userType, Number(userId));

        return res.status(200).json({
            success: true,
            message: result ? 'Marked as read' : 'Notification not found or already read'
        });
    } catch (error) {
        next(error);
    }
};

export const fetchMyUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userPayload?.userId;
        const userType = req.userPayload?.role === 'customer' ? RecipientType.CUSTOMER : RecipientType.STAFF;

        const unreadCount = await NotificationService.getUnreadCount(userType, Number(userId));

        return res.status(200).json({
            success: true,
            data: { unread_count: unreadCount }
        });
    } catch (error) {
        next(error);
    }
};