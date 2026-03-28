// src/utils/errors.ts

/**
 * Custom Error Classes สำหรับจัดการข้อผิดพลาดในระบบ
 * - ทำให้ error handling สะอาดและสม่ำเสมอ
 * - สามารถส่ง status code และ message ไปยัง frontend ได้ง่าย
 */

/**
 * [400] BadRequestError: คำขอไม่ถูกต้อง (เช่น ส่ง JSON มาผิด Syntax หรือไม่ส่ง body มา)
 */
export class BadRequestError extends Error {
  public statusCode: number;

  constructor(message: string = 'Bad Request: Invalid syntax or missing data') {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [401] UnauthorizedError: ใช้เมื่อ authentication ล้มเหลว (ไม่ได้ login, token ผิด, หมดอายุ ฯลฯ)
 */
export class UnauthorizedError extends Error {
  public statusCode: number;

  constructor(message: string = 'Unauthorized: Please login again') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [403] ForbiddenError: ใช้เมื่อผู้ใช้ไม่มีสิทธิ์ทำสิ่งนั้น (แม้จะ login แล้วก็ตาม)
 */
export class ForbiddenError extends Error {
  public statusCode: number;

  constructor(message: string = 'Forbidden: You do not have permission to perform this action') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [404] NotFoundError: ใช้เมื่อหา resource หรือ URL ไม่เจอ
 */
export class NotFoundError extends Error {
  public statusCode: number;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [409] ConflictError: ข้อมูลซ้ำ หรือ ลบไม่ได้เพราะมีตัวอื่นใช้งานอยู่ (Foreign Key Constraint)
 */
export class ConflictError extends Error {
  public statusCode: number;

  constructor(message: string = 'Conflict: Resource already exists or is in use') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [422] ValidationError: ข้อมูลไม่ครบ หรือ validation ไม่ผ่าน
 */
export class ValidationError extends Error {
  public statusCode: number;
  public details?: Record<string, string>;

  constructor(message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 422; // เปลี่ยนจาก 400 เป็น 422 ตามความต้องการ
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [429] TooManyRequestsError: คำขอที่ส่งหลายเกินไปในระยะสั้น (Rate Limiting)
 */
export class TooManyRequestsError extends Error {
  public statusCode: number;

  constructor(message: string = 'Too Many Requests: Please try again later') {
    super(message);
    this.name = 'TooManyRequestsError';
    this.statusCode = 429;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [500] InternalServerError: ใช้สำหรับ error ที่ไม่คาดคิด (fallback)
 */
export class InternalServerError extends Error {
  public statusCode: number;

  constructor(message: string = 'Internal Server Error') {
    super(message);
    this.name = 'InternalServerError';
    this.statusCode = 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * [503] ServiceUnavailableError: เซิร์ฟเวอร์ไม่พร้อมให้บริการ
 */
export class ServiceUnavailableError extends Error {
  public statusCode: number;

  constructor(message: string = 'Service Unavailable: Server is down for maintenance') {
    super(message);
    this.name = 'ServiceUnavailableError';
    this.statusCode = 503;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Helper function เพื่อแปลง error เป็น response ที่ frontend เข้าใจง่าย
 * นำฟังก์ชันนี้ไปใช้ใน Global Error Handler Middleware
 */
export function handleErrorResponse(error: unknown): { status: number; message: string; details?: any } {
  // เช็ค Error ที่มี details (ตอนนี้มีแค่ ValidationError)
  if (error instanceof ValidationError) {
    return {
      status: error.statusCode,
      message: error.message,
      details: error.details,
    };
  }

  // เช็ค Custom Errors ตัวอื่นๆ
  if (
    error instanceof BadRequestError ||
    error instanceof UnauthorizedError ||
    error instanceof ForbiddenError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError ||
    error instanceof TooManyRequestsError ||
    error instanceof InternalServerError ||
    error instanceof ServiceUnavailableError
  ) {
    return {
      status: (error as any).statusCode,
      message: error.message,
    };
  }

  // Default สำหรับ error ที่ไม่รู้จัก (Unknown Errors)
  console.error('Unhandled error:', error);
  return {
    status: 500,
    message: 'An unexpected error occurred',
  };
}

export default {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  handleErrorResponse,
};