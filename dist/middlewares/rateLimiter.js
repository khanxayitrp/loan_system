"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.heavyTaskLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const redis_service_1 = __importDefault(require("../services/redis.service"));
// 🟢 ส້າງ Store Function พร้อมรับค่า prefix เพื่อแยกหมวดหมู่
const getRedisStore = (prefixName) => {
    // ຖ້າ Redis ເຊື່ອມຕໍ່ແລ້ວ ໃຫ້ໃຊ້ Redis Store
    if (redis_service_1.default.isClientConnected()) {
        return new rate_limit_redis_1.default({
            sendCommand: (...args) => redis_service_1.default.getClient().sendCommand(args),
            prefix: prefixName, // 👈 สำคัญมาก! ช่วยแยกไม่ให้โควตาตีกันใน Redis
        });
    }
    // ຖ້າ Redis ຕາຍ ມັນຈະກັບໄປໃຊ້ Memory Store ຂອງແຕ່ລະເຄື່ອງອັດຕະໂນມັດ (Fallback)
    console.warn(`[RateLimit] Redis is not connected. Using Memory Store for ${prefixName}`);
    return undefined;
};
// =================================================================
// 🟢 1. Global Limiter: ສຳລັບ API ທົ່ວໄປ (ດຶງຂໍ້ມູນ, ບັນທຶກຂໍ້ມູນທົ່ວໄປ)
// =================================================================
exports.globalLimiter = (0, express_rate_limit_1.default)({
    store: getRedisStore('rate-limit:global:'), // 👈 ใส่ Prefix สำหรับ Global
    windowMs: 15 * 60 * 1000, // 15 ນາທີ
    max: 150, // ອະນຸຍາດ 150 Request ຕໍ່ 1 IP
    message: {
        success: false,
        message: "ມີການຮ້ອງຂໍຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ຫຼັງຈາກ 15 ນາທີ"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// =================================================================
// 🔴 2. Heavy Task Limiter: ສຳລັບ API ທີ່ກິນ CPU ໜັກ (ເຊັ່ນ ສ້າງ PDF)
// =================================================================
exports.heavyTaskLimiter = (0, express_rate_limit_1.default)({
    store: getRedisStore('rate-limit:heavy:'), // 👈 ใส่ Prefix สำหรับ Heavy Task
    windowMs: 5 * 60 * 1000, // 5 ນາທີ
    max: 25, // ອະນຸຍາດແຄ່ 25 Request ຕໍ່ 1 IP (ປ້ອງກັນ Server ຄ້າງ)
    message: {
        success: false,
        message: "ສ້າງເອກະສານຫຼາຍເກີນໄປ ເພື່ອປ້ອງກັນເຊີບເວີເຮັດວຽກໜັກ, ກະລຸນາລອງໃໝ່ໃນອີກ 5 ນາທີ"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// =================================================================
// 🟠 3. Auth Strict Limiter: ສຳລັບ API Login / Refresh
// =================================================================
exports.authLimiter = (0, express_rate_limit_1.default)({
    store: getRedisStore('rate-limit:auth:'), // 👈 ใส่ Prefix สำหรับ Auth
    windowMs: 15 * 60 * 1000, // 15 ນາທີ
    max: 15, // ໃສ່ລະຫັດຜິດ ຫຼື ລ໋ອກອິນລົວໆ ໄດ້ສູງສຸດ 15 ຄັ້ງ
    message: {
        success: false,
        message: "ພະຍາຍາມເຂົ້າສູ່ລະບົບຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ໃນອີກ 15 ນາທີ"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
