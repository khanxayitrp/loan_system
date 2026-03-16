"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repo_1 = __importDefault(require("../repositories/user.repo"));
const logger_1 = require("../utils/logger");
class UserController {
    // --- 1. Get User Profile ---
    async getProfile(req, res) {
        try {
            const userId = req.userPayload?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
            }
            const user = await user_repo_1.default.findUserById(userId);
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
        }
        catch (error) {
            logger_1.logger.error('Error in getProfile controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    }
    // --- 2. Get All Users ---
    async getAllUsers(req, res) {
        try {
            const users = await user_repo_1.default.findAllUsers();
            return res.status(200).json({ users });
        }
        catch (error) {
            logger_1.logger.error('Error in getAllUsers controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    }
    // --- 3. Update User ---
    async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const updateData = req.body;
            const updatedUser = await user_repo_1.default.updateUser(userId, updateData);
            if (!updatedUser) {
                return res.status(404).json({ message: 'ไม่พบผู้ใช้งานที่ต้องการอัปเดต' });
            }
            return res.status(200).json({ message: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ', user: updatedUser });
        }
        catch (error) {
            logger_1.logger.error('Error in updateUser controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    }
    async changeStatus(req, res) {
        try {
            const userid = parseInt(req.params.id, 10);
            const status = req.body.is_active;
            const success = await user_repo_1.default.changeStatusUser(userid, status);
            if (!success) {
                return res.status(404).json({ message: 'ไม่พบผู้ใช้งานที่ต้องการปิดใช้งาน' });
            }
            return res.status(200).json({ message: 'ปิดใช้งานผู้ใช้งานสำเร็จ' });
        }
        catch (error) {
            logger_1.logger.error('Error in deactivateUser controller', { error: error.message });
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    }
}
exports.default = new UserController();
