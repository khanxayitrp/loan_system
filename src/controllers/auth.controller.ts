import { Request, Response } from 'express';
import authService from '../services/auth.service';
import config from '../config/auth.config';

export type RoleType = 'admin' | 'staff' | 'partner' | 'customer';
class AuthController {

  // --- 1. Login ---
  public async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await authService.signIn(username, password);

      if (!result) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }

      const { tokens, user } = result;

      // ส่ง Cookies (ปรับการคูณเวลาตามหน่วยวินาที)
      this.setTokenCookies(res, tokens);

      return res.status(200).json({
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          staff_level: user.staff_level
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- 2. Register (สำหรับ Admin เท่านั้น) ---
  public async register(req: Request, res: Response) {
    try {

      const allowedRolesForCaller: Record<RoleType, RoleType[]> = {
        admin: ['admin', 'staff', 'partner', 'customer'],
        staff: ['customer'],
        partner: [], // หรือ ['customer'] ถ้า partner สร้างลูกค้าได้
        customer: [], // 👈 เพิ่มบรรทัดนี้
      };

      const callerRole = req.userPayload!.role; // สมมติว่าเก็บ role ใน token หรือ session
      const targetRole = req.body.role;

      if (!allowedRolesForCaller[callerRole]?.includes(targetRole)) {
        return res.status(403).json({ error: 'You cannot create a user with this role' });
      }
      // เรียกใช้ registerUser จาก AuthService
      const newUser = await authService.registerUser(req.body);

      return res.status(201).json({
        message: 'สร้างผู้ใช้งานสำเร็จ',
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          staff_level: newUser.staff_level
        }
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // สำหรับลูกค้าสมัครเอง
  public async signUp(req: Request, res: Response) {
    try {
      const { username, password, full_name } = req.body;

      // บังคับให้ Role เป็น customer เสมอ เพื่อความปลอดภัย
      const newUser = await authService.signUp({
        username,
        password,
        full_name,
        role: 'customer',
        staff_level: 'none'
      });

      return res.status(201).json(newUser);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // --- 3. Refresh ---
  public async refresh(req: Request, res: Response) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ message: 'ไม่พบ Refresh Token' });

      const newTokens = await authService.refreshTokens(token);
      if (!newTokens) return res.status(403).json({ message: 'Session หมดอายุ กรุณา Login ใหม่' });

      this.setTokenCookies(res, newTokens);

      return res.status(200).json({ message: 'ต่ออายุสำเร็จ' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- 4. Logout ---
  public async logout(req: Request, res: Response) {
    try {
      const token = req.cookies.refreshToken;
      if (token) await authService.signOut(token);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(200).json({ message: 'ออกจากระบบสำเร็จ' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
  // src/controllers/auth.controller.ts

  public async changePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?.id; // ดึงมาจาก middleware verifyToken

      if (!userId) {
        return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'กรุณาระบุรหัสผ่านเดิมและรหัสผ่านใหม่' });
      }

      await authService.changePassword(userId, oldPassword, newPassword);

      return res.status(200).json({ message: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว' });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // Helper ฟังก์ชันเพื่อลดการเขียนโค้ดซ้ำ (Don't Repeat Yourself)
  private setTokenCookies(res: Response, tokens: any) {
    const isProd = process.env.NODE_ENV === 'production';

    // Access Token Cookie
    res.cookie('accessToken', tokens.access.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      // ถ้า config.jwtExpiration เป็นวินาที ให้คูณแค่ 1000
      maxAge: config.jwtExpiration! * 1000,
    });

    // Refresh Token Cookie
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      // ถ้า config.jwtRefreshExpiration เป็นวินาที ให้คูณแค่ 1000
      maxAge: config.jwtRefreshExpiration! * 1000,
    });
  }
}

export default new AuthController();