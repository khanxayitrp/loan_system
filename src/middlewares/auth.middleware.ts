import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '../models/users';
import config from '../config/auth.config';
import { TokenPayload } from '../interfaces/token.interface';
import { isTokenBlacklisted } from '../services/tokenBlacklist.service';
import { db } from '../models/init-models';

declare global {
  namespace Express {
    interface Request {
      user?: users;
      userPayload?: TokenPayload; 
      customerPayload?: TokenPayload; // 🟢 เพิ่ม Payload สำหรับลูกค้า
    }
  }
}

// ============================================================================
// 🟢 1. ฟังก์ชันกลางสำหรับตรวจสอบ Token (Core Verification Logic)
// ============================================================================
const processTokenVerification = async (
  token: string, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // 1. ตรวจสอบว่า Token ถูก Blacklist หรือไม่
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ message: 'Token is blacklisted' });
  }

  try {
    const decoded = jwt.verify(token, config.secret!) as TokenPayload;
    const user = await users.findByPk(decoded.userId);

    // 2. ตรวจสอบ User
    if (!user || user.is_active === 0) {
      return res.status(401).json({ message: 'User is not active or does not exist' });
    }

    // ✅ Token ปกติและสมบูรณ์ แนบข้อมูลแล้วไปต่อ
    req.userPayload = decoded;
    return next();

  } catch (error) {
    // ❌ ถอด Logic Auto-Refresh ออกทั้งหมด
    // ส่ง Code: 'TOKEN_EXPIRED' กลับไปให้ Axios Interceptor ที่ฝั่ง Client จัดการต่อ
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// ============================================================================
// 🔴 2. Strict Auth (บังคับต้องมี Token และต้องถูกต้องเท่านั้น)
// ============================================================================
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  await processTokenVerification(token, req, res, next);
};

type Role = 'admin' | 'staff' | 'partner' | 'customer';
type StaffLevel = 'sale' | 'credit_officer' | 'credit_manager' | 'deputy_director' | 'director' | 'approver' | 'none';

export const isAuthorized = (allowedRoles: Role[], allowedLevels: StaffLevel[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.userPayload;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const hasRole = allowedRoles.includes(user.role as Role);
    const hasLevel = allowedLevels.length === 0 || allowedLevels.includes((user.staff_level || 'none') as StaffLevel);

    if (!hasRole || !hasLevel) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required permissions.' });
    }

    next();
  };
};

export const checkPermission = (requiredFeature: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.userPayload;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (user.role === 'admin') return next();

    const hasPermission = user.permissions && user.permissions.includes(requiredFeature);

    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Forbidden: You do not have permission for ${requiredFeature}` 
      });
    }

    next();
  };
};

export const optionalVerifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next();
  }

  await processTokenVerification(token, req, res, next);
};

// ============================================================================
// 🟢 3. สำหรับลูกค้าระบบหน้าบ้าน (Customer Portal)
// ============================================================================
export const verifyCustomerToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.customerToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No customer token provided.' });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ message: 'Token is blacklisted' });
  }

  try {
    const decoded = jwt.verify(token, config.secret!) as TokenPayload;
    
    // ตรวจสอบว่าเป็น Token ของลูกค้าจริงๆ ไม่ใช่พนักงานเอา Token มาใช้มั่วซั่ว
    if (decoded.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden: Invalid token role.' });
    }

    // ดึงข้อมูลลูกค้าจากตาราง customers (สมมติชื่อโมเดลคือ Customer)
    const customer = await db.customers.findByPk(decoded.userId);

    if (!customer) {
      return res.status(401).json({ message: 'Customer does not exist' });
    }

    // แนบข้อมูลลูกค้าลงใน Request
    req.customerPayload = decoded;
    return next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Customer token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid customer token.' });
  }
};