"use strict";
// src/utils/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.UnauthorizedError = exports.NotFoundError = exports.ForbiddenError = exports.ValidationError = void 0;
exports.handleErrorResponse = handleErrorResponse;
/**
 * Custom Error Classes สำหรับจัดการข้อผิดพลาดในระบบ
 * - ทำให้ error handling สะอาดและสม่ำเสมอ
 * - สามารถส่ง status code และ message ไปยัง frontend ได้ง่าย
 */
/**
 * ValidationError: ใช้เมื่อข้อมูลที่ส่งมาไม่ผ่านการตรวจสอบ (validation failed)
 * เช่น ข้อมูลขาด, รูปแบบผิด, ซ้ำ, OTP ไม่ถูกต้อง เป็นต้น
 */
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
        // เพื่อให้ stack trace ถูกต้องใน TypeScript
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ValidationError = ValidationError;
/**
 * ForbiddenError: ใช้เมื่อผู้ใช้ไม่มีสิทธิ์ทำสิ่งนั้น (แม้จะ login แล้วก็ตาม)
 * เช่น ไม่มี permission, พยายามแก้ไขข้อมูลของคนอื่น
 */
class ForbiddenError extends Error {
    constructor(message = 'Forbidden: You do not have permission to perform this action') {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * NotFoundError: ใช้เมื่อหา resource ไม่เจอ
 */
class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * UnauthorizedError: ใช้เมื่อ authentication ล้มเหลว (token ผิด, หมดอายุ ฯลฯ)
 */
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized: Please login again') {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * InternalServerError: ใช้สำหรับ error ที่ไม่คาดคิด (fallback)
 */
class InternalServerError extends Error {
    constructor(message = 'Internal Server Error') {
        super(message);
        this.name = 'InternalServerError';
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Helper function เพื่อแปลง error เป็น response ที่ frontend เข้าใจง่าย
 * ใช้ใน middleware error handler หรือใน controller
 */
function handleErrorResponse(error) {
    if (error instanceof ValidationError) {
        return {
            status: error.statusCode,
            message: error.message,
            details: error.details,
        };
    }
    if (error instanceof ForbiddenError ||
        error instanceof NotFoundError ||
        error instanceof UnauthorizedError ||
        error instanceof InternalServerError) {
        return {
            status: error.statusCode,
            message: error.message,
        };
    }
    // Default สำหรับ error ที่ไม่รู้จัก
    console.error('Unhandled error:', error);
    return {
        status: 500,
        message: 'An unexpected error occurred',
    };
}
exports.default = {
    ValidationError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    InternalServerError,
    handleErrorResponse,
};
