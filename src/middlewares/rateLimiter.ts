import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 ນາທີ
  max: 100, // ຈຳກັດ 100 requests ຕໍ່ IP ພາຍໃນ 15 ນາທີ
  message: {
    message: "ມີການຮ້ອງຂໍຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ຫຼັງຈາກ 15 ນາທີ"
  },
  standardHeaders: true,
  legacyHeaders: false,
});