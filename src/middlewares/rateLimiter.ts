import rateLimit from 'express-rate-limit';

// =================================================================
// 🟢 1. Global Limiter: ສຳລັບ API ທົ່ວໄປ (ດຶງຂໍ້ມູນ, ບັນທຶກຂໍ້ມູນທົ່ວໄປ)
// =================================================================
export const globalLimiter = rateLimit({
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
    windowMs: 5 * 60 * 1000, // 5 ນາທີ
    max: 10, // ອະນຸຍາດແຄ່ 10 Request ຕໍ່ 1 IP (ປ້ອງກັນ Server ຄ້າງ)
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
    windowMs: 15 * 60 * 1000, // 15 ນາທີ
    max: 15, // ໃສ່ລະຫັດຜິດ ຫຼື ລ໋ອກອິນລົວໆ ໄດ້ສູງສຸດ 15 ຄັ້ງ
    message: {
        success: false,
        message: "ພະຍາຍາມເຂົ້າສູ່ລະບົບຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ໃນອີກ 15 ນາທີ"
    },
    standardHeaders: true,
    legacyHeaders: false,
});