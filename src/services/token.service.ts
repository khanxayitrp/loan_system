import { features } from './../models/features';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/auth.config';
import { TokenPayload, Tokens } from '../interfaces/token.interface';
import { sequelize } from '../config/db.config';
import { initModels } from '../models/init-models';

const { user_refresh_tokens: refresh_token } = initModels(sequelize);

class TokenService {
  public generateToken(userId: number, role: string, staffLevel: string, permissions: string[], secret: string, expiresIn: number): string {
    const payload = { userId, role, staff_level: staffLevel, permissions }; // เก็บเป็น array ของสิทธิ์
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, secret, options);
  }

  public async generateAuthTokens(user: { user_id: number; role: string, staff_level: string, permissions: string[] }): Promise<Tokens> {
    const accessTokenExpires = new Date(
      Date.now() + config.jwtExpiration! * 60 * 1000
    );
    const refreshTokenExpires = new Date(
      Date.now() + config.jwtRefreshExpiration! * 60 * 1000
    );

    const accessToken = this.generateToken(
      user.user_id,
      user.role,
      user.staff_level,
      user.permissions,
      config.secret!,
      config.jwtExpiration! * 60
    );

    const refreshToken = this.generateToken(  
      user.user_id,
      user.role,
      user.staff_level,
      user.permissions,  
      config.refresh!,
      config.jwtRefreshExpiration! * 60
    );

    await refresh_token.create({
      user_id: user.user_id,
      token: refreshToken,
      expires_at: refreshTokenExpires,
      revoked: 0
    });

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires
      }
    };
  }

  public verifyToken(token: string, secret: string): TokenPayload {
    return jwt.verify(token, secret) as TokenPayload;
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    await refresh_token.update(
      { revoked: 1 },
      { where: { token } }
    );
  }
  // ใน TokenService.ts
public async revokeAllUserTokens(userId: number): Promise<void> {
  await refresh_token.update(
    { revoked: 1 },
    { where: { user_id: userId, revoked: 0 } }
  );
}

  public async isRefreshTokenValid(token: string): Promise<boolean> {
    const refreshToken = await refresh_token.findOne({
      where: { token, revoked: 0 }
    });

    return !!refreshToken && new Date(refreshToken.expires_at) > new Date();
  }
}

export default new TokenService();