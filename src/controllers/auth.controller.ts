import { Request, Response } from 'express';
import authService from '../services/auth.service';
import config from '../config/auth.config';
import jwt from 'jsonwebtoken';

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

      console.log('Generated Tokens:', tokens);

      // ส่ง Cookies (ปรับการคูณเวลาตามหน่วยวินาที)
      AuthController.setTokenCookies(res, tokens);
      const decodedToken = jwt.decode(tokens.access.token) as any;

      return res.status(200).json({
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          id: user.id,
          username: user.username,
           full_name: user.full_name, // 👈 เพิ่ม full_name
          role: user.role,
          staff_level: user.staff_level,
          is_active: user.is_active,
        },
        permissions: decodedToken.permissions || [],
        expiresAt: decodedToken?.exp
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- 2. Register (สำหรับ Admin เท่านั้น) ---
  public async register(req: Request, res: Response) {
  try {
    // ✅ 1. ตรวจสอบ authentication ก่อน
    if (!req.userPayload) {
      console.log('[CONTROLLER] No userPayload found - unauthenticated request');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'กรุณาเข้าสู่ระบบก่อนสร้างผู้ใช้' 
      });
    }

    const callerRole = req.userPayload.role;
    
    // ✅ 2. กำหนดสิทธิ์การสร้าง user ตาม role
    const allowedRolesForCaller: Record<RoleType, RoleType[]> = {
      admin: ['admin', 'staff', 'partner', 'customer'],
      staff: ['customer'],
      partner: [], // partner ไม่สามารถสร้าง user ได้
      customer: [] // customer ไม่สามารถสร้าง user ได้
    };

    const targetRole = req.body.role;

    // ✅ 3. ตรวจสอบว่า caller มีสิทธิ์สร้าง user ที่มี role นี้หรือไม่
    if (!allowedRolesForCaller[callerRole]) {
      console.log('[CONTROLLER] Invalid caller role:', callerRole);
      return res.status(403).json({ 
        error: 'Invalid role',
        message: 'บทบาทของคุณไม่ถูกต้อง' 
      });
    }

    if (!allowedRolesForCaller[callerRole].includes(targetRole)) {
      console.log('[CONTROLLER] Caller cannot create this role', {
        callerRole,
        targetRole
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `คุณไม่มีสิทธิ์สร้างผู้ใช้ประเภท ${targetRole}` 
      });
    }

    console.log('[CONTROLLER] Before calling service, targetRole:', targetRole);

    // ✅ 4. สร้าง user
    const newUser = await authService.registerUser(req.body);
    
    console.log('[CONTROLLER] Service returned successfully', {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    });

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

    console.log('[CONTROLLER] Sending 201 with data:', responseData);
    return res.status(201).json(responseData);

  } catch (error: any) {
    console.error('[CONTROLLER] Caught error in register:', {
      message: error.message,
      stack: error.stack?.slice(0, 300),
      name: error.name
    });

    // ✅ 5. Return ข้อความ error ที่ชัดเจน
    return res.status(400).json({ 
      error: error.name || 'Error',
      message: error.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' 
    });
  }
}
  public async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.userPayload!.userId;
      const user = await authService.getUserById(userId);

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
        permissions: req.userPayload!.permissions || [],
        expiresAt: req.userPayload!.exp
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
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

      AuthController.setTokenCookies(res, newTokens);

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
      const userId = req.userPayload?.userId; // ดึงมาจาก middleware verifyToken

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
  public static setTokenCookies(res: Response, tokens: any) {
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