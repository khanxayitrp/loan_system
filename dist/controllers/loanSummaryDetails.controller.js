"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoanInstallments = exports.getLoanSummaryForCustomer = void 0;
const loanSummaryDetails_service_1 = require("../services/loanSummaryDetails.service");
const getLoanSummaryForCustomer = async (req, res, next) => {
    try {
        const customerId = parseInt(req.params.customerId, 10);
        if (isNaN(customerId)) {
            return res.status(400).json({ success: false, message: 'Invalid customer ID' });
        }
        // เรียกใช้ Service
        const data = await (0, loanSummaryDetails_service_1.getCustomerLoanSummary)(customerId);
        return res.status(200).json({
            success: true,
            message: 'ດຶງຂໍ້ມູນລາຍການຜ່ອນຊຳລະສຳເລັດ',
            data: data
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLoanSummaryForCustomer = getLoanSummaryForCustomer;
const getLoanInstallments = async (req, res, next) => {
    try {
        const loanId = parseInt(req.params.loanId, 10);
        if (isNaN(loanId)) {
            return res.status(400).json({ success: false, message: 'Invalid loan ID' });
        }
        const data = await (0, loanSummaryDetails_service_1.getLoanInstallmentDetails)(loanId);
        return res.status(200).json({
            success: true,
            message: 'ດຶງຂໍ້ມູນລາຍລະອຽດການຜ່ອນຊຳລະສຳເລັດ',
            data: data
        });
    }
    catch (error) {
        if (error.message.includes('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};
exports.getLoanInstallments = getLoanInstallments;
