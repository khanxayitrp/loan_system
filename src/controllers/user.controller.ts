import { changeStatus } from './loan-application.controller';
import { Request, Response } from "express";
import userRepo from "../repositories/user.repo";
import { logger } from "../utils/logger";

class UserController {
    // --- 1. Get User Profile ---
    public async getProfile(req: Request, res: Response) {
        try {
            const userId = req.userPayload?.userId;
            
            if (!userId) {
                return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
            }
            const user = await userRepo.findUserById(userId);
            if (!user) {
                return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
            }
            return res.status(200).json({ 
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role,
                    staff_level: user.staff_level,
                    is_active: user.is_active
                }
            });
        } catch (error: any) {
            logger.error('Error in getProfile controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }   
    }

    // --- 2. Get All Users ---
    public async getAllUsers(req: Request, res: Response) {
        try {
            const users = await userRepo.findAllUsers();
            return res.status(200).json({ users });
        } catch (error: any) {
            logger.error('Error in getAllUsers controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    }

    // --- 3. Update User ---
    public async updateUser(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.id, 10);
            const updateData = req.body;
            const updatedUser = await userRepo.updateUser(userId, updateData);
            if (!updatedUser) {
                return res.status(404).json({ message: 'ไม่พบผู้ใช้งานที่ต้องการอัปเดต' });
            }
            return res.status(200).json({ message: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ', user: updatedUser });
        } catch (error: any) {
            logger.error('Error in updateUser controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    }

    public async changeStatus(req: Request, res: Response) {
        try {
            const userid = parseInt(req.params.id, 10);
            const status = req.body.is_active;
            
            const success = await userRepo.changeStatusUser(userid, status);
            if (!success) {
                return res.status(404).json({ message: 'ไม่พบผู้ใช้งานที่ต้องการปิดใช้งาน' });
            }
            return res.status(200).json({ message: 'ปิดใช้งานผู้ใช้งานสำเร็จ' });
        } catch (error) {
            
            logger.error('Error in deactivateUser controller', { error: (error as Error).message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    }
}

export default new UserController();