"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
const auth_config_1 = __importDefault(require("../config/auth.config"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthController {
    // --- 1. Login ---
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const result = await auth_service_1.default.signIn(username, password);
            if (!result) {
                return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
            }
            const { tokens, user } = result;
            console.log('Generated Tokens:', tokens);
            // ส่ง Cookies 
            AuthController.setTokenCookies(res, tokens);
            const decodedToken = jsonwebtoken_1.default.decode(tokens.access.token);
            return res.status(200).json({
                message: 'เข้าสู่ระบบสำเร็จ',
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
            return res.status(500).json({ message: error.message });
        }
    }
    // --- 2. Register (สำหรับ Admin เท่านั้น) ---
    async register(req, res) {
        try {
            if (!req.userPayload) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'กรุณาเข้าสู่ระบบก่อนสร้างผู้ใช้'
                });
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
                return res.status(403).json({
                    error: 'Invalid role',
                    message: 'บทบาทของคุณไม่ถูกต้อง'
                });
            }
            if (!allowedRolesForCaller[callerRole].includes(targetRole)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `คุณไม่มีสิทธิ์สร้างผู้ใช้ประเภท ${targetRole}`
                });
            }
            const newUser = await auth_service_1.default.registerUser(req.body);
            const responseData = {
                message: 'สร้างผู้ใช้งานสำเร็จ',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    role: newUser.role,
                    staff_level: newUser.staff_level,
                    full_name: newUser.full_name,
                    is_active: newUser.is_active
                }
            };
            return res.status(201).json(responseData);
        }
        catch (error) {
            return res.status(400).json({
                error: error.name || 'Error',
                message: error.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
            });
        }
    }
    async getCurrentUser(req, res) {
        try {
            const userId = req.userPayload.userId;
            const user = await auth_service_1.default.getUserById(userId);
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
                },
                permissions: req.userPayload.permissions || [],
                expiresAt: req.userPayload.exp
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // สำหรับลูกค้าสมัครเอง
    async signUp(req, res) {
        try {
            const { username, password, full_name } = req.body;
            const newUser = await auth_service_1.default.signUp({
                username,
                password,
                full_name,
                role: 'customer',
                staff_level: 'none'
            });
            return res.status(201).json(newUser);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // --- 3. Refresh ---
    async refresh(req, res) {
        try {
            const token = req.cookies.refreshToken;
            if (!token)
                return res.status(401).json({ message: 'ไม่พบ Refresh Token' });
            const newTokens = await auth_service_1.default.refreshTokens(token);
            if (!newTokens)
                return res.status(403).json({ message: 'Session หมดอายุ กรุณา Login ใหม่' });
            AuthController.setTokenCookies(res, newTokens);
            return res.status(200).json({ message: 'ต่ออายุสำเร็จ' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // --- 4. Logout ---
    async logout(req, res) {
        try {
            const token = req.cookies.refreshToken;
            if (token)
                await auth_service_1.default.signOut(token);
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(200).json({ message: 'ออกจากระบบสำเร็จ' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.userPayload?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
            }
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: 'กรุณาระบุรหัสผ่านเดิมและรหัสผ่านใหม่' });
            }
            await auth_service_1.default.changePassword(userId, oldPassword, newPassword);
            return res.status(200).json({ message: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว' });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
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
