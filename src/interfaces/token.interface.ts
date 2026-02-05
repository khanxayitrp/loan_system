export interface TokenPayload {
  userId: number;
  role: 'admin' | 'staff' | 'partner' | 'customer';
  staff_level: 'requester' | 'approver' | 'none';
  permissions: string[];
  iat?: number; // 👈 issued at (เวลาที่สร้าง token) - optional
  exp?: number; // 👈 expires at (เวลาที่หมดอายุ) - optional
}

export interface Tokens {
  access: {
    token: string;
    expires: Date;
  };
  refresh: {
    token: string;
    expires: Date;
  };
}

// export interface access_token {
//     user: number;
//     accessToken: string;
// }

// export interface refresh_token {
//     user: number;
//     refreshToken: string;
// }