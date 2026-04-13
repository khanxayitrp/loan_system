import { Request, Response, NextFunction } from "express";
import userRepo from "../repositories/user.repo"; // 🟢 ກວດສອບ path ໃຫ້ກົງກັບໄຟລ໌ Repository ຂອງທ່ານ
import { logger } from "../utils/logger";
import { UnauthorizedError } from "../utils/errors";

class UserController {
    // ==========================================
    // --- 1. Get User Profile ---
    // ==========================================
    public async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            // ດຶງ userId ຈາກ Token ທີ່ຖືກແປງໂດຍ auth middleware
            const userId = (req as any).userPayload?.userId;
            
            if (!userId) {
                throw new UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ໃນລະບົບ (Unauthorized)');
            }

            // 🟢 ຖ້າບໍ່ພົບ User, Repo ຈະໂຍນ NotFoundError ອອກມາເອງ
            const user = await userRepo.findUserById(userId);
            
            return res.status(200).json({ 
                success: true,
                user: {
                    id: user!.id,
                    username: user!.username,
                    full_name: user!.full_name,
                    role: user!.role,
                    staff_level: user!.staff_level,
                    is_active: user!.is_active
                }
            });
        } catch (error) {
            // 🟢 ໂຍນ Error ໃຫ້ Global Error Handler ຈັດການ (ບໍ່ຕ້ອງຂຽນ res.status(500) ເອງແລ້ວ)
            next(error); 
        }   
    }

    // ==========================================
    // --- 2. Get All Users ---
    // ==========================================
    public async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await userRepo.findAllUsers();
            return res.status(200).json({ success: true, users });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // --- 3. Update User ---
    // ==========================================
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = parseInt(req.params.id, 10);
            const updateData = req.body;

            // 🟢 ດຶງ ID ພະນັກງານທີ່ກຳລັງກົດແກ້ໄຂ ເພື່ອສົ່ງໄປບັນທຶກ Audit Log
            const performedBy = (req as any).userPayload?.userId || 1; 

            logger.info(`Received update data for user ID: ${userId}`, updateData);
            
            // 🟢 ບໍ່ຕ້ອງຂຽນ if (!updatedUser) ເພາະຖ້າບໍ່ມີ Repo ຈະຍົກ Error ອອກມາເອງ
            const updatedUser = await userRepo.updateUser(userId, updateData, performedBy);
            
            return res.status(200).json({ 
                success: true, 
                message: 'ອັບເດດຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດແລ້ວ', 
                user: updatedUser 
            });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // --- 4. Change Status (Active/Inactive) ---
    // ==========================================
    public async changeStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const userid = parseInt(req.params.id, 10);
            const status = req.body.is_active; // ຄ່າທີ່ຈະຮັບມາຄວນເປັນ 1 ຫລື 0 (true/false)
            
            // 🟢 ດຶງ ID ພະນັກງານທີ່ກຳລັງກົດປ່ຽນສະຖານະ
            const performedBy = (req as any).userPayload?.userId || 1;

            logger.info(`Received change status request for user ID: ${userid}, new status: ${status}`);
            
            await userRepo.changeStatusUser(userid, status, performedBy);
            
            // ແຍກຂໍ້ຄວາມແຈ້ງເຕືອນຕາມສະຖານະ ເພື່ອໃຫ້ UX ດີຂຶ້ນ
            const actionText = (status === 1 || status === true) ? 'ເປີດການໃຊ້ງານ' : 'ປິດການໃຊ້ງານ';

            return res.status(200).json({ 
                success: true, 
                message: `${actionText}ຜູ້ໃຊ້ສຳເລັດແລ້ວ` 
            });
        } catch (error) {
            next(error);
        }
    }
    // ==========================================
    // --- 5. Delete User ---
    // ==========================================
    public async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = parseInt(req.params.id, 10);
            
            // 🟢 ดึง ID พนักงานที่กดปุ่มลบจาก Token
            const performedBy = (req as any).userPayload?.userId || 1;

            logger.info(`Received delete request for user ID: ${userId} by user ID: ${performedBy}`);
            
            await userRepo.deleteUser(userId, performedBy);
            
            return res.status(200).json({ 
                success: true, 
                message: 'ລຶບຜູ້ໃຊ້ສຳເລັດແລ້ວ' 
            });
        } catch (error) {
            // โยน Error ไปให้ Global Error Handler จัดการ 
            // (เช่น NotFoundError จะถูกแปลงเป็น 404, BadRequestError จะเป็น 400 อัตโนมัติ)
            next(error);
        }
    }
}

export default new UserController();