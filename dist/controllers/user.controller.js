"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repo_1 = __importDefault(require("../repositories/user.repo")); // 🟢 ກວດສອບ path ໃຫ້ກົງກັບໄຟລ໌ Repository ຂອງທ່ານ
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class UserController {
    // ==========================================
    // --- 1. Get User Profile ---
    // ==========================================
    async getProfile(req, res, next) {
        try {
            // ດຶງ userId ຈາກ Token ທີ່ຖືກແປງໂດຍ auth middleware
            const userId = req.userPayload?.userId;
            if (!userId) {
                throw new errors_1.UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ໃນລະບົບ (Unauthorized)');
            }
            // 🟢 ຖ້າບໍ່ພົບ User, Repo ຈະໂຍນ NotFoundError ອອກມາເອງ
            const user = await user_repo_1.default.findUserById(userId);
            return res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role,
                    staff_level: user.staff_level,
                    is_active: user.is_active
                }
            });
        }
        catch (error) {
            // 🟢 ໂຍນ Error ໃຫ້ Global Error Handler ຈັດການ (ບໍ່ຕ້ອງຂຽນ res.status(500) ເອງແລ້ວ)
            next(error);
        }
    }
    // ==========================================
    // --- 2. Get All Users ---
    // ==========================================
    async getAllUsers(req, res, next) {
        try {
            const users = await user_repo_1.default.findAllUsers();
            return res.status(200).json({ success: true, users });
        }
        catch (error) {
            next(error);
        }
    }
    // ==========================================
    // --- 3. Update User ---
    // ==========================================
    async updateUser(req, res, next) {
        try {
            const userId = parseInt(req.params.id, 10);
            const updateData = req.body;
            // 🟢 ດຶງ ID ພະນັກງານທີ່ກຳລັງກົດແກ້ໄຂ ເພື່ອສົ່ງໄປບັນທຶກ Audit Log
            const performedBy = req.userPayload?.userId || 1;
            logger_1.logger.info(`Received update data for user ID: ${userId}`, updateData);
            // 🟢 ບໍ່ຕ້ອງຂຽນ if (!updatedUser) ເພາະຖ້າບໍ່ມີ Repo ຈະຍົກ Error ອອກມາເອງ
            const updatedUser = await user_repo_1.default.updateUser(userId, updateData, performedBy);
            return res.status(200).json({
                success: true,
                message: 'ອັບເດດຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດແລ້ວ',
                user: updatedUser
            });
        }
        catch (error) {
            next(error);
        }
    }
    // ==========================================
    // --- 4. Change Status (Active/Inactive) ---
    // ==========================================
    async changeStatus(req, res, next) {
        try {
            const userid = parseInt(req.params.id, 10);
            const status = req.body.is_active; // ຄ່າທີ່ຈະຮັບມາຄວນເປັນ 1 ຫລື 0 (true/false)
            // 🟢 ດຶງ ID ພະນັກງານທີ່ກຳລັງກົດປ່ຽນສະຖານະ
            const performedBy = req.userPayload?.userId || 1;
            logger_1.logger.info(`Received change status request for user ID: ${userid}, new status: ${status}`);
            await user_repo_1.default.changeStatusUser(userid, status, performedBy);
            // ແຍກຂໍ້ຄວາມແຈ້ງເຕືອນຕາມສະຖານະ ເພື່ອໃຫ້ UX ດີຂຶ້ນ
            const actionText = (status === 1 || status === true) ? 'ເປີດການໃຊ້ງານ' : 'ປິດການໃຊ້ງານ';
            return res.status(200).json({
                success: true,
                message: `${actionText}ຜູ້ໃຊ້ສຳເລັດແລ້ວ`
            });
        }
        catch (error) {
            next(error);
        }
    }
    // ==========================================
    // --- 5. Delete User ---
    // ==========================================
    async deleteUser(req, res, next) {
        try {
            const userId = parseInt(req.params.id, 10);
            // 🟢 ดึง ID พนักงานที่กดปุ่มลบจาก Token
            const performedBy = req.userPayload?.userId || 1;
            logger_1.logger.info(`Received delete request for user ID: ${userId} by user ID: ${performedBy}`);
            await user_repo_1.default.deleteUser(userId, performedBy);
            return res.status(200).json({
                success: true,
                message: 'ລຶບຜູ້ໃຊ້ສຳເລັດແລ້ວ'
            });
        }
        catch (error) {
            // โยน Error ไปให้ Global Error Handler จัดการ 
            // (เช่น NotFoundError จะถูกแปลงเป็น 404, BadRequestError จะเป็น 400 อัตโนมัติ)
            next(error);
        }
    }
}
exports.default = new UserController();
