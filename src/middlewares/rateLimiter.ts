import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisService from '../services/redis.service';


// 🟢 ส້າງ Store Function พร้อมรับค่า prefix เพื่อแยกหมวดหมู่
const getRedisStore = (prefixName: string) => {
    // ຖ້າ Redis ເຊື່ອມຕໍ່ແລ້ວ ໃຫ້ໃຊ້ Redis Store
    if (redisService.isClientConnected()) {
        return new RedisStore({
            sendCommand: (...args: string[]) => redisService.getClient().sendCommand(args),
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
export const globalLimiter = rateLimit({
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
export const heavyTaskLimiter = rateLimit({
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
export const authLimiter = rateLimit({
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