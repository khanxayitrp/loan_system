"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepaymentSchedule = exports.getEarlyPayoffSummary = exports.processPayment = void 0;
const repayment_service_1 = __importDefault(require("../services/repayment.service"));
const repayment_repo_1 = __importDefault(require("../repositories/repayment.repo")); // ໃຫ້ແນ່ໃຈວ່າ import ຖືກໄຟລ໌
const errors_1 = require("../utils/errors");
const processPayment = async (req, res, next) => {
    try {
        const payload = req.body;
        // ດຶງ ID ພະນັກງານທີ່ກຳລັງກົດຮັບເງິນ
        const receivedBy = req.userPayload?.userId || 1;
        // ສົ່ງໃຫ້ Service ຈັດການ
        const result = await repayment_service_1.default.processPayment(payload, receivedBy);
        return res.status(200).json({
            success: true,
            message: 'ບັນທຶກການຊຳລະເງິນສຳເລັດແລ້ວ',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.processPayment = processPayment;
// ສ້າງຟັງຊັນໃໝ່ແຍກອອກມາເລີຍ
const getEarlyPayoffSummary = async (req, res, next) => {
    try {
        const application_id = parseInt(req.params.application_id);
        if (isNaN(application_id))
            throw new errors_1.BadRequestError('Invalid application_id format');
        // 🔴 ສຳຄັນ: ການປິດບັນຊີກ່ອນກຳນົດ "ບໍ່ຄວນດຶງຈາກ Cache" ເພາະຕ້ອງຄຳນວນໃໝ່ແບບ Real-time ມື້ຕໍ່ມື້!
        // ເອີ້ນໃຊ້ Repository/Service ເພື່ອຄຳນວນຍອດປິດບັນຊີ
        const payoffSummary = await repayment_repo_1.default.calculateEarlyPayoff(application_id);
        if (!payoffSummary)
            throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນການຜ່ອນຊຳລະ ຫຼື ບັນຊີນີ້ປິດໄປແລ້ວ');
        return res.status(200).json({
            success: true,
            message: 'ຄຳນວນຍອດປິດບັນຊີສຳເລັດ',
            data: payoffSummary
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEarlyPayoffSummary = getEarlyPayoffSummary;
const getRepaymentSchedule = async (req, res, next) => {
    try {
        const application_id = parseInt(req.params.application_id);
        if (isNaN(application_id))
            throw new errors_1.BadRequestError('Invalid application_id format');
        const schedule = await repayment_repo_1.default.findRepaymentById(application_id);
        if (!schedule)
            throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນຕາຕະລາງຜ່ອນຊຳລະ');
        return res.status(200).json({
            success: true,
            message: 'ດຶງຂໍ້ມູນຕາຕະລາງຜ່ອນຊຳລະສຳເລັັດ',
            data: schedule
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRepaymentSchedule = getRepaymentSchedule;
