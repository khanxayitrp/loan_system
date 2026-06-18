"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_restructure_controller_1 = __importDefault(require("../controllers/loan-restructure.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware"); // สมมติ Middleware ของคุณ
const router = (0, express_1.Router)();
// สร้าง Route สำหรับปรับโครงสร้างหนี้ (ต้อง Login และมีสิทธิ์ระดับหัวหน้าขึ้นไป)
router.post('/:application_id/restructure', auth_middleware_1.verifyToken, (0, auth_middleware_1.isAuthorized)(['staff'], ['credit_manager', 'deputy_director', 'director']), loan_restructure_controller_1.default.restructureLoan);
exports.default = router;
