import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '../models/users';
import config from '../config/auth.config';
import { TokenPayload } from '../interfaces/token.interface';
import { isTokenBlacklisted } from '../services/tokenBlacklist.service';
import tokenService from '../services/token.service';

// Extend Express Request type to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: users;
      userPayload?: TokenPayload; // ข้อมูลจาก JWT
    }
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
  const refreshToken = req.cookies.refreshToken;
  // ถ้าอยู่ในโหมดพัฒนา และมีการส่ง Header พิเศษมา ให้ผ่านได้เลย
  // if (process.env.NODE_ENV === 'development' && req.headers['x-test-bypass'] === 'secret-key') {
  //   return next();
  // }
  

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // ตรวจสอบว่า Token ถูก Blacklist หรือไม่
  if (isTokenBlacklisted(token)) {
    res.status(401).json({ error: 'Token is blacklisted' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.secret!) as TokenPayload;

    const user = await users.findByPk(decoded.userId);

    if (!user || user.is_active === 0) {
      return res.status(401).json({ message: 'User is not active or does not exist' })
    }

    req.userPayload = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError && refreshToken) {
      try {
        const isValid = await tokenService.isRefreshTokenValid(refreshToken);
        if (isValid) {
          return res.status(401).json({ message: 'Refresh token expired. Please login again.' });
        }

        const decoded =tokenService.verifyToken(refreshToken, config.refresh!);

        const newTokens = await tokenService.generateAuthTokens({
          user_id: decoded.userId,
          role: decoded.role,
          staff_level: decoded.staff_level,
          permissions: decoded.permissions
        });
        
        // ส่ง Cookies ใหม่
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', newTokens.access.token, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
          maxAge: config.jwtExpiration! * 1000,
        });
        res.cookie('refreshToken', newTokens.refresh.token, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
          maxAge: config.jwtRefreshExpiration! * 60 * 1000,
        });

        await tokenService.revokeRefreshToken(refreshToken);

        req.userPayload = decoded;
        return next();  
      } catch (refreshError) {
        return res.status(401).json({ message: 'Session expired. Please login again.' });
      }

    }
    // Error อื่นๆ
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

type Role = 'admin' | 'staff' | 'partner' | 'customer';
type StaffLevel = 'requester' | 'approver' | 'none';


export const isAuthorized = (allowedRoles: Role[], allowedLevels: StaffLevel[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.userPayload;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const hasRole = allowedRoles.includes(user.role as Role);
    const hasLevel = allowedLevels.length === 0 || allowedLevels.includes(user.staff_level as StaffLevel);

    if (!hasRole || !hasLevel) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required permissions.' });
    }


    // if (!allowedRoles.includes(userRole)) {
    //   return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    // }

    next();
  };
};

/**
 * Middleware สำหรับเช็คสิทธิ์ราย Feature (Permission-based)
 * ใช้ข้อมูลจาก permissions: string[] ใน Token
 */
export const checkPermission = (requiredFeature: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.userPayload;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Admin ให้ผ่านฉลุยเสมอ
    if (user.role === 'admin') return next();

    // เช็คว่าใน array permissions มี feature ที่ต้องการไหม
    const hasPermission = user.permissions.includes(requiredFeature);

    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Forbidden: You do not have permission for ${requiredFeature}` 
      });
    }

    next();
  };
};
