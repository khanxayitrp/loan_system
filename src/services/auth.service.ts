import bcrypt from 'bcryptjs';
import { users, usersCreationAttributes } from '../models/users';
import { user_permissions } from '../models/user_permissions';
import { features } from '../models/features';
import tokenService from './token.service'; // เรียกใช้ TokenService ที่คุณทำไว้
import { Tokens } from '../interfaces/token.interface';
import { db } from '../models/init-models';
import { Transaction } from 'sequelize';

// 🟢 1. Import Helper ของเราเข้ามา
import { logAudit } from '../utils/auditLogger';
import { BadRequestError, NotFoundError, ConflictError, UnauthorizedError } from '../utils/errors';

class AuthService {

  // 🟢 เพิ่มการรับ Transaction, staffLevel และ performedBy เข้ามา
  private async createDefaultPermissions(userId: number, role: string, staffLevel: string | undefined, performedBy: number, t?: Transaction): Promise<void> {
    try {
      let permissionCodes: string[] = [];

      // 🟢 แยกแยะสิทธิ์ตาม Role และ Staff Level
      if (role === 'admin') {
        permissionCodes = [
          'user_view', 'user_create', 'user_manage', 'permission_manage',
          'loan_view_all', 'loan_view_assigned', 'loan_create', 'loan_edit', 'loan_approve', 'loan_reject',
          'doc_view', 'doc_upload', 'doc_delete',
          'payment_view', 'payment_create', 'payment_verify',
          'user_changepass'
        ];
      } else if (role === 'partner') {
        permissionCodes = ['partner_manage', 'shop_view_report', 'user_changepass'];
      } else if (role === 'customer') {
        permissionCodes = ['cust_profile_view', 'loan_request', 'view_own_loans', 'payment_proof_upload', 'user_changepass'];
      } else if (role === 'staff') {
        const level = staffLevel || '';
        
        if (['sales', 'credit_officer'].includes(level)) {
          // 🟢 กลุ่มเจ้าหน้าที่ทั่วไป: ทำรายการสินเชื่อ, อัปโหลดเอกสาร, และบันทึกชำระเงิน
          permissionCodes = [
            'loan_view_all', 'loan_view_assigned', 'loan_create', 'loan_edit', 
            'doc_upload', 'doc_view', 
            'payment_view', 'payment_create', 
            'user_changepass'
          ];
        } else if (['credit_manager', 'deputy_director', 'director'].includes(level)) {
          // 🟢 กลุ่มผู้บริหาร/หัวหน้า: ดูทั้งหมด, อนุมัติ/ปฏิเสธ, และยืนยันการชำระเงิน
          permissionCodes = [
            'loan_view_all', 'loan_view_assigned', 'loan_create', 'loan_edit', 'loan_approve', 'loan_reject',
            'doc_view', 'doc_upload', 'doc_delete',
            'payment_view', 'payment_create', 'payment_verify',
            'user_changepass'
          ];
        } else {
          // Fallback สำหรับ Staff ที่ไม่ได้ระบุ Level
          permissionCodes = ['loan_view_assigned', 'user_changepass'];
        }
      }

      if (permissionCodes.length === 0) {
        console.log(`[Auth SERVICE] No default permissions for role: ${role}, level: ${staffLevel}`);
        return;
      }

      const featuresList = await db.features.findAll({
        where: { feature_name: permissionCodes },
        transaction: t
      });

      if (featuresList.length === 0) {
        console.log('[AUTH SERVICE] No features found for permission codes:', permissionCodes);
        return;
      }

      // สร้าง user_permissions records
      const userPermissions = featuresList.map(feature => ({
        user_id: userId,
        feature_id: feature.id,
        can_access: 1
      }));

      await db.user_permissions.bulkCreate(userPermissions, { transaction: t });

      // 🟢 บันทึก Audit Log (CREATE Permissions)
      const featureIds = userPermissions.map(p => p.feature_id);
      await logAudit('user_permissions', userId, 'CREATE', null, { features: featureIds }, performedBy, t);

      console.log(`[AUTH SERVICE] Created ${userPermissions.length} default permissions for user ${userId} (Role: ${role}, Level: ${staffLevel || 'N/A'})`);
    } catch (error) {
      console.error('[AUTH SERVICE] Error creating default permissions:', error);
      throw error;
    }
  }

  /**
   * สำหรับลูกค้าสมัครสมาชิกเองผ่านหน้าเว็บ/แอป
   */
  public async signUp(userData: any) {
    const transaction = await db.sequelize.transaction();

    try {
      // 1. ตรวจสอบว่า Username ซ้ำหรือไม่
      const existingUser = await db.users.findOne({ where: { username: userData.username }, transaction });
      if (existingUser) {
        throw new ConflictError('ຊື່ຜູ້ໃຊ້ງານນີ້ຖືກໃຊ້ແລ້ວ');
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

      // 🟢 บันทึก Audit Log (ลบ Password ออกก่อนเก็บ)
      const logData = newUser.toJSON();
      delete (logData as any).password;
      // ให้ performedBy เป็น ID ของตัวเอง (เพราะสมัครเอง)
      await logAudit('users', newUser.id, 'CREATE', null, logData, newUser.id, transaction);

      // 4. มอบสิทธิ์พื้นฐาน (Default Features สำหรับ Customer)
      // อัปเดตให้ตรงกับฐานข้อมูล Features ที่มี
      const defaultFeatures = ['cust_profile_view', 'loan_request', 'view_own_loans', 'payment_proof_upload'];
      const features = await db.features.findAll({
        where: { feature_name: defaultFeatures },
        transaction
      });

      if (features.length > 0) {
        const permissionsData = features.map(f => ({
          user_id: newUser.id,
          feature_id: f.id,
          can_access: 1
        }));

        await db.user_permissions.bulkCreate(permissionsData, { transaction });

        // 🟢 บันทึก Audit Log สำหรับสิทธิ์
        const featureIds = permissionsData.map(p => p.feature_id);
        await logAudit('user_permissions', newUser.id, 'CREATE', null, { features: featureIds }, newUser.id, transaction);
      }

      // บันทึกทุกอย่างลง Database
      await transaction.commit();

      // คืนค่า User (ไม่ส่ง password กลับไป)
      const { password, ...userWithoutPassword } = newUser.get({ plain: true });
      return userWithoutPassword;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 2. เข้าสู่ระบบ (Sign In) - ไม่มีการเปลี่ยนแปลงข้อมูล จึงไม่ต้องเก็บ Audit Log
  public async signIn(username: string, pass: string): Promise<{ user: users; tokens: Tokens } | null> {
    const user = await db.users.findOne({
      where: { username, is_active: 1 },
      include: [{
        model: db.user_permissions,
        as: 'user_permissions',
        where: { can_access: 1 },
        required: false,
        include: [{
          model: db.features,
          as: 'feature'
        }]
      }]
    });

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      return null;
    }

    const userPermissions = (user as any).user_permissions || [];
    const permissions: string[] = userPermissions.map((p: any) => p.feature?.feature_name).filter(Boolean);

    const tokens = await tokenService.generateAuthTokens({
      user_id: user.id,
      role: user.role,
      staff_level: user.staff_level!,
      permissions: permissions
    });

    return { user, tokens };
  }

  public async getUserById(userId: number): Promise<users | null> {
    return await users.findByPk(userId);
  }

  // 3. ออกจากระบบ (Sign Out)
  public async signOut(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }

  // 4. การต่ออายุ Token (Refresh)
  public async refreshTokens(token: string): Promise<Tokens | null> {
    const isValid = await tokenService.isRefreshTokenValid(token);
    if (!isValid) return null;

    const payload = tokenService.verifyToken(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    await tokenService.revokeRefreshToken(token);

    return await tokenService.generateAuthTokens({
      user_id: payload.userId,
      role: payload.role,
      staff_level: payload.staff_level ?? '',
      permissions: payload.permissions ?? []
    });
  }

  /**
   * 5. ฟังก์ชันสำหรับ Admin เพื่อสร้าง User (Staff, Partner)
   * 🟢 เพิ่มการรับ performedBy และจัดการด้วย Transaction
   */
  public async registerUser(userData: usersCreationAttributes, performedBy: number = 1): Promise<users> {
    const transaction = await db.sequelize.transaction();
    try {
      const existingUser = await db.users.findOne({
        where: { username: userData.username },
        transaction
      });

      if (existingUser) {
        throw new ConflictError('ຊື່ຜູ້ໃຊ້ງານນີ້ຖືກໃຊ້ແລ້ວ');
      }
      console.log('Creating user with data:', userData);

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = await db.users.create({
        ...userData,
        password: hashedPassword,
        is_active: Number(userData.is_active) === 0 ? 0 : 1 // กำหนดค่า is_active ตาม input หรือ default เป็น 1
      }, { transaction });

      // 🟢 บันทึก Audit Log (ลบ Password ออกก่อนเก็บ)
      const logData = newUser.toJSON();
      delete (logData as any).password;
      await logAudit('users', newUser.id, 'CREATE', null, logData, performedBy, transaction);

      // ✅ 4. สร้าง default permissions พร้อมส่ง Transaction และคนทำรายการเข้าไปด้วย (เพิ่ม userData.staff_level ลงไป)
      await this.createDefaultPermissions(newUser.id, userData.role, userData.staff_level, performedBy, transaction);

      await transaction.commit();
      return newUser;
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 6. ฟังก์ชันให้ User เปลี่ยนรหัสผ่านด้วยตัวเอง
   * 🟢 เพิ่ม Transaction และ Audit Log แบบปิดบังรหัสผ่าน
   */
  public async changePassword(userId: number, oldPass: string, newPass: string): Promise<boolean> {
    const transaction = await db.sequelize.transaction();
    try {
      const user = await db.users.findByPk(userId, { transaction });
      if (!user) throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');

      const isMatch = await bcrypt.compare(oldPass, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('ລະຫັດຜ່ານເກົ່າບໍ່ຖືກຕ້ອງ');
      }

      const hashedNewPassword = await bcrypt.hash(newPass, 10);

      await user.update({ password: hashedNewPassword }, { transaction });

      // 🟢 บันทึก Audit Log ว่ามีการเปลี่ยนรหัสผ่าน (สร้าง Object หลอกขึ้นมาแทนที่จะเก็บค่า Hash จริงๆ)
      await logAudit(
        'users',
        userId,
        'UPDATE',
        { password_changed: false },
        { password_changed: true },
        userId, // ตัวเองเป็นคนเปลี่ยน
        transaction
      );

      // ยกเลิก Token เก่าทั้งหมดเพื่อให้ล็อกอินใหม่
      await tokenService.revokeAllUserTokens(userId);

      await transaction.commit();
      return true;
    } catch (error: any) {
      await transaction.rollback();
      throw error; // ส่ง error ตรงๆ เพื่อให้ controller จัดการและส่ง response ที่เหมาะสม
    }
  }

  public async getFirstLoggedInUser(userId: number) {
    return await db.user_refresh_tokens.count({
      where: { user_id: userId }
    });
  }
}

export default new AuthService();