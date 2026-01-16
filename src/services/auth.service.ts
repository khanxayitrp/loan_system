
import bcrypt from 'bcryptjs';
import { users, usersCreationAttributes } from '../models/users';
import tokenService from './token.service'; // เรียกใช้ TokenService ที่คุณทำไว้
import { Tokens } from '../interfaces/token.interface';
import { db } from '../models/init-models';


class AuthService {
  // 1. ลงทะเบียนผู้ใช้งาน (Sign Up)
  // public async signUp(userData: usersCreationAttributes): Promise<users> {
  //   const hashedPassword = await bcrypt.hash(userData.password, 10);
  //   const newUser = await users.create({
  //     ...userData,
  //     password: hashedPassword,
  //   });
  //   return newUser;
  // }

  /**
   * สำหรับลูกค้าสมัครสมาชิกเองผ่านหน้าเว็บ/แอป
   */
  public async signUp(userData: any) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // 1. ตรวจสอบว่า Username ซ้ำหรือไม่
      const existingUser = await db.users.findOne({ where: { username: userData.username } });
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // 2. Hash Password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // 3. สร้าง User ใหม่ (บังคับ role เป็น customer)
      const newUser = await db.users.create({
        username: userData.username,
        password: hashedPassword,
        full_name: userData.full_name,
        role: userData.role || 'customer',
        staff_level: userData.staff_level || 'none',
        is_active: 1
      }, { transaction });

      // 4. มอบสิทธิ์พื้นฐาน (Default Features)
      // เราจะดึง ID ของ feature ที่ต้องการจากชื่อ
      const defaultFeatures = ['view_profile', 'loan_request', 'view_own_loans'];
      
      const features = await db.features.findAll({
        where: { feature_name: defaultFeatures }
      });

      if (features.length > 0) {
        const permissionsData = features.map(f => ({
          user_id: newUser.id,
          feature_id: f.id,
          can_access: 1
        }));
        
        await db.user_permissions.bulkCreate(permissionsData, { transaction });
      }

      // บันทึกทุกอย่างลง Database
      await transaction.commit();

      // คืนค่า User (ไม่ส่ง password กลับไป)
      const { password, ...userWithoutPassword } = newUser.get({ plain: true });
      return userWithoutPassword;

    } catch (error) {
      // หากเกิด Error ให้ยกเลิกที่ทำมาทั้งหมด (Rollback)
      await transaction.rollback();
      throw error;
    }
  }

  // 2. เข้าสู่ระบบ (Sign In)
  public async signIn(username: string, pass: string): Promise<{ user: users; tokens: Tokens } | null> {
    // ค้นหา User และเช็คว่าเป็น Active หรือไม่
    const user = await db.users.findOne({
      where: { username, is_active: 1 },
      include: [{
        model: db.user_permissions,
        as: 'user_permissions', // ตรวจสอบ alias ใน init-models
        where: { can_access: 1 }, // ดึงเฉพาะตัวที่มีสิทธิ์
        required: false, // ถ้าไม่มีสิทธิ์เลยก็ยังให้ล็อกอินได้ (แต่ permissions จะว่าง)
        include: [{
          model: db.features,
          as: 'feature'
        }]
      }]
    });

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      return null;
    }
    // --- จุดสำคัญ: แปลงข้อมูล Permissions เป็น Array ของชื่อ Feature ---
    const userPermissions = (user as any).user_permissions || [];
    const permissions: string[] = userPermissions.map((p: any) => p.feature?.feature_name).filter(Boolean);

    // เรียกใช้ TokenService เพื่อสร้าง Token ชุดใหญ่ (Access + Refresh)
    // และบันทึกลงตาราง user_refresh_tokens โดยอัตโนมัติ
    const tokens = await tokenService.generateAuthTokens({
      user_id: user.id,
      role: user.role,
      staff_level: user.staff_level!,
      permissions: permissions // ส่ง [ 'loan_view', 'loan_approve', ... ]
      // หากใน Interface ของคุณมี staff_level อย่าลืมใส่ไปด้วยครับ
    });

    return { user, tokens };
  }

  // 3. ออกจากระบบ (Sign Out)
  public async signOut(refreshToken: string): Promise<void> {
    // สั่ง Revoke Token ในตาราง user_refresh_tokens
    await tokenService.revokeRefreshToken(refreshToken);
  }

  // 4. การต่ออายุ Token (Refresh)
  public async refreshTokens(token: string): Promise<Tokens | null> {
    // เช็คว่า Refresh Token ใน DB ยัง Valid และไม่โดน Revoke หรือไม่
    const isValid = await tokenService.isRefreshTokenValid(token);
    if (!isValid) return null;

    // Verify และถอดรหัส Token
    const payload = tokenService.verifyToken(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');

    // Revoke ตัวเก่าทิ้ง (Token Rotation เพื่อความปลอดภัย)
    await tokenService.revokeRefreshToken(token);

    // สร้างชุดใหม่ให้ User
    return await tokenService.generateAuthTokens({
      user_id: payload.userId,
      role: payload.role,
      staff_level: payload.staff_level,
      permissions: payload.permissions
    });
  }

/**
   * 5. ฟังก์ชันสำหรับ Admin เพื่อสร้าง User (Staff, Partner)
   * โดยจะรับข้อมูลครบชุด และตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่
   */
  public async registerUser(userData: usersCreationAttributes): Promise<users> {
    try {
      // 1. ตรวจสอบว่ามี Username นี้ในระบบหรือยัง
      const existingUser = await users.findOne({ 
        where: { username: userData.username } 
      });

      if (existingUser) {
        throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
      }

      // 2. Hash รหัสผ่านก่อนบันทึก
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // 3. สร้าง User ใหม่ในฐานข้อมูล
      const newUser = await users.create({
        ...userData,
        password: hashedPassword,
        is_active: 1, // เปิดใช้งานทันทีเมื่อ Admin สร้าง
        // staff_level: userData.staff_level || 'none', // กำหนดค่าเริ่มต้นถ้าไม่ได้ส่งมา
      });

      return newUser;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
/**
   * 6. ฟังก์ชันให้ User เปลี่ยนรหัสผ่านด้วยตัวเอง
   */
  public async changePassword(userId: number, oldPass: string, newPass: string): Promise<boolean> {
    try {
      // 1. ค้นหา User
      const user = await users.findByPk(userId);
      if (!user) throw new Error('ไม่พบผู้ใช้งาน');

      // 2. ตรวจสอบรหัสผ่านเดิมว่าถูกต้องไหม
      const isMatch = await bcrypt.compare(oldPass, user.password);
      if (!isMatch) {
        throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
      }

      // 3. Hash รหัสผ่านใหม่
      const hashedNewPassword = await bcrypt.hash(newPass, 10);

      // 4. อัปเดตลงฐานข้อมูล
      await user.update({ password: hashedNewPassword });

      // 5. (Option) เมื่อเปลี่ยนรหัสผ่านแล้ว ควรยกเลิก Refresh Token ทั้งหมดของ User คนนี้
      // เพื่อบังคับให้ทุก Device ที่ Login อยู่ต้องออกแล้วเข้าใหม่ด้วยรหัสผ่านใหม่
      await tokenService.revokeAllUserTokens(userId); 

      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export default new AuthService();