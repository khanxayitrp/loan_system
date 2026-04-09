"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
const auth_config_1 = __importDefault(require("../config/auth.config"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// 👉 1. Import Custom Errors เข้ามาใช้งาน
const errors_1 = require("../utils/errors");
class AuthController {
    // --- 1. Login ---
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const result = await auth_service_1.default.signIn(username, password);
            if (!result) {
                // 👉 เปลี่ยนเป็น throw Custom Error
                throw new errors_1.UnauthorizedError('ຊື່ຜູ້ໃຊ້ງານຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
            }
            const { tokens, user } = result;
            console.log('Generated Tokens:', tokens);
            // ส่ง Cookies 
            AuthController.setTokenCookies(res, tokens);
            const decodedToken = jsonwebtoken_1.default.decode(tokens.access.token);
            return res.status(200).json({
                success: true, // แนะนำให้เพิ่ม success: true ในเคสปกติ
                message: 'ເຂົ້າສູ່ລະບົບສຳເລັດ',
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role,
                    staff_level: user.staff_level,
                    is_active: user.is_active,
                },
                permissions: decodedToken.permissions || [],
                expiresAt: decodedToken?.exp
            });
        }
        catch (error) {
            next(error); // 👉 โยน Error ให้ Global Handler จัดการ
        }
    }
    // --- 2. Register (สำหรับ Admin เท่านั้น) ---
    async register(req, res, next) {
        try {
            if (!req.userPayload) {
                throw new errors_1.UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນສ້າງຜູ້ໃຊ້ງານ');
            }
            const callerRole = req.userPayload.role;
            const allowedRolesForCaller = {
                admin: ['admin', 'staff', 'partner', 'customer'],
                staff: ['customer'],
                partner: [],
                customer: []
            };
            const targetRole = req.body.role;
            if (!allowedRolesForCaller[callerRole]) {
                throw new errors_1.ForbiddenError('ສິດ ແລະ ບົດບາດຂອງທ່ານບໍ່ຖືກຕ້ອງ');
            }
            if (!allowedRolesForCaller[callerRole].includes(targetRole)) {
                throw new errors_1.ForbiddenError(`ທ່ານບໍ່ມີສິດສ້າງຜູ້ໃຊ້ງານປະເພດດັ່ງກ່າວ ${targetRole}`);
            }
            const newUser = await auth_service_1.default.registerUser(req.body);
            return res.status(201).json({
                success: true,
                message: 'ສໍາເລັດໃນການສ້າງຜູ້ໃຊ້ງານ',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    role: newUser.role,
                    staff_level: newUser.staff_level,
                    full_name: newUser.full_name,
                    is_active: newUser.is_active
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCurrentUser(req, res, next) {
        try {
            const userId = req.userPayload.userId;
            const user = await auth_service_1.default.getUserById(userId);
            if (!user) {
                throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
            }
            return res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role,
                    staff_level: user.staff_level,
                    is_active: user.is_active
                },
                permissions: req.userPayload.permissions || [],
                expiresAt: req.userPayload.exp
            });
        }
        catch (error) {
            next(error);
        }
    }
    // สำหรับลูกค้าสมัครเอง
    async signUp(req, res, next) {
        try {
            const { username, password, full_name } = req.body;
            const newUser = await auth_service_1.default.signUp({
                username,
                password,
                full_name,
                role: 'customer',
                staff_level: 'none'
            });
            return res.status(201).json({
                success: true,
                data: newUser
            });
        }
        catch (error) {
            next(error);
        }
    }
    // --- 3. Refresh ---
    async refresh(req, res, next) {
        try {
            const token = req.cookies.refreshToken;
            if (!token) {
                throw new errors_1.UnauthorizedError('ບໍ່ພົບ Refresh Token');
            }
            const newTokens = await auth_service_1.default.refreshTokens(token);
            if (!newTokens) {
                throw new errors_1.UnauthorizedError('Session ໝົດອາຍຸ ກະລຸນາ Login ໃຫມ່');
            }
            AuthController.setTokenCookies(res, newTokens);
            return res.status(200).json({ success: true, message: 'ຕໍ່ອາຍຸສຳເລັດ' });
        }
        catch (error) {
            next(error);
        }
    }
    // --- 4. Logout ---
    async logout(req, res, next) {
        try {
            const token = req.cookies.refreshToken;
            if (token)
                await auth_service_1.default.signOut(token);
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(200).json({ success: true, message: 'ອອກຈາກລະບົບສຳເລັດ' });
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.userPayload?.userId;
            if (!userId) {
                throw new errors_1.UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
            }
            if (!oldPassword || !newPassword) {
                throw new errors_1.BadRequestError('ກະລຸນາລະບຸລະຫັດຜ່ານເກົ່າ ແລະ ລະຫັດຜ່ານໃຫມ່');
            }
            await auth_service_1.default.changePassword(userId, oldPassword, newPassword);
            return res.status(200).json({ success: true, message: 'ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ' });
        }
        catch (error) {
            next(error);
        }
    }
    async fetchFirstLoginInfo(req, res, next) {
        try {
            const userId = req.userPayload?.userId;
            if (!userId) {
                throw new errors_1.UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
            }
            const loginCount = await auth_service_1.default.getFirstLoggedInUser(userId);
            return res.status(200).json({
                success: true,
                message: 'ຂໍ້ມູນການເຂົ້າສູ່ລະບົບຄັ້ງທຳອິດ',
                data: loginCount
            });
        }
        catch (error) {
            next(error);
        }
    }
    // 🟢 Helper ฟังก์ชันเพื่อเซ็ต Cookie อย่างปลอดภัย
    static setTokenCookies(res, tokens) {
        const isProd = process.env.NODE_ENV === 'production';
        // บังคับแปลงเป็นตัวเลขเพื่อป้องกันค่า NaN หากเผลอใส่เป็น String ใน config
        const accessMaxAge = parseInt(auth_config_1.default.jwtExpiration, 10) * 1000;
        const refreshMaxAge = parseInt(auth_config_1.default.jwtRefreshExpiration, 10) * 1000;
        res.cookie('accessToken', tokens.access.token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            maxAge: accessMaxAge,
        });
        res.cookie('refreshToken', tokens.refresh.token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            maxAge: refreshMaxAge,
        });
    }
}
exports.default = new AuthController();
