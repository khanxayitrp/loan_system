import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import config from '../config/auth.config';
import jwt from 'jsonwebtoken';

// 👉 1. Import Custom Errors เข้ามาใช้งาน
import { 
  BadRequestError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError 
} from '../utils/errors';

export type RoleType = 'admin' | 'staff' | 'partner' | 'customer';

class AuthController {

  // --- 1. Login ---
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.signIn(username, password);

      if (!result) {
        // 👉 เปลี่ยนเป็น throw Custom Error
        throw new UnauthorizedError('ຊື່ຜູ້ໃຊ້ງານຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      }

      const { tokens, user } = result;
      console.log('Generated Tokens:', tokens);

      // ส่ง Cookies 
      AuthController.setTokenCookies(res, tokens);
      const decodedToken = jwt.decode(tokens.access.token) as any;

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
    } catch (error) {
      next(error); // 👉 โยน Error ให้ Global Handler จัดการ
    }
  }

  // --- 2. Register (สำหรับ Admin เท่านั้น) ---
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userPayload) {
        throw new UnauthorizedError('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນສ້າງຜູ້ໃຊ້ງານ');
      }

      const callerRole = req.userPayload.role as RoleType;
      
      const allowedRolesForCaller: Record<RoleType, RoleType[]> = {
        admin: ['admin', 'staff', 'partner', 'customer'],
        staff: ['customer'],
        partner: [], 
        customer: [] 
      };

      const targetRole = req.body.role as RoleType;

      if (!allowedRolesForCaller[callerRole]) {
        throw new ForbiddenError('ສິດ ແລະ ບົດບາດຂອງທ່ານບໍ່ຖືກຕ້ອງ');
      }

      if (!allowedRolesForCaller[callerRole].includes(targetRole)) {
        throw new ForbiddenError(`ທ່ານບໍ່ມີສິດສ້າງຜູ້ໃຊ້ງານປະເພດດັ່ງກ່າວ ${targetRole}`);
      }

      const newUser = await authService.registerUser(req.body);
      
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
    } catch (error) {
      next(error);
    }
  }

  public async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userPayload!.userId;
      const user = await authService.getUserById(userId);

      if (!user) {
        throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
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
        permissions: req.userPayload!.permissions || [],
        expiresAt: req.userPayload!.exp
      });
    } catch (error) {
      next(error);
    }
  }

  // สำหรับลูกค้าสมัครเอง
  public async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password, full_name } = req.body;
      const newUser = await authService.signUp({
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
    } catch (error) {
      next(error);
    }
  }

  // --- 3. Refresh ---
  public async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        throw new UnauthorizedError('ບໍ່ພົບ Refresh Token');
      }

      const newTokens = await authService.refreshTokens(token);
      if (!newTokens) {
        throw new UnauthorizedError('Session ໝົດອາຍຸ ກະລຸນາ Login ໃຫມ່');
      }

      AuthController.setTokenCookies(res, newTokens);

      return res.status(200).json({ success: true, message: 'ຕໍ່ອາຍຸສຳເລັດ' });
    } catch (error) {
      next(error);
    }
  }

  // --- 4. Logout ---
  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (token) await authService.signOut(token);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(200).json({ success: true, message: 'ອອກຈາກລະບົບສຳເລັດ' });
    } catch (error) {
      next(error);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.userPayload?.userId; 

      if (!userId) {
        throw new UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
      }

      if (!oldPassword || !newPassword) {
        throw new BadRequestError('ກະລຸນາລະບຸລະຫັດຜ່ານເກົ່າ ແລະ ລະຫັດຜ່ານໃຫມ່');
      }

      await authService.changePassword(userId, oldPassword, newPassword);

      return res.status(200).json({ success: true, message: 'ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ' });
    } catch (error) {
      next(error);
    }
  }

  public async fetchFirstLoginInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userPayload?.userId;

      if (!userId) {
        throw new UnauthorizedError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
      }

      const loginCount = await authService.getFirstLoggedInUser(userId);

      return res.status(200).json({ 
        success: true,
        message: 'ຂໍ້ມູນການເຂົ້າສູ່ລະບົບຄັ້ງທຳອິດ',
        data: loginCount
      });
    } catch (error) {
      next(error);
    }
  }

  // 🟢 Helper ฟังก์ชันเพื่อเซ็ต Cookie อย่างปลอดภัย
  public static setTokenCookies(res: Response, tokens: any) {
    const isProd = process.env.NODE_ENV === 'production';

    // บังคับแปลงเป็นตัวเลขเพื่อป้องกันค่า NaN หากเผลอใส่เป็น String ใน config
    const accessMaxAge = parseInt(config.jwtExpiration as any, 10) * 1000;
    const refreshMaxAge = parseInt(config.jwtRefreshExpiration as any, 10) * 1000;

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

export default new AuthController();