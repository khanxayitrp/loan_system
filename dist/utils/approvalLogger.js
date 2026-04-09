"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logApprovalAction = void 0;
const init_models_1 = require("../models/init-models"); // Update path to match your project structure
/**
 * ຟັງຊັນສຳລັບບັນທຶກປະຫວັດການເຄື່ອນໄຫວຂອງສິນເຊື່ອ (Loan Approval Logs)
 */
const logApprovalAction = async (applicationId, action, statusFrom, statusTo, remarks, userId, t // Optional Transaction parameter
) => {
    try {
        await init_models_1.db.loan_approval_logs.create({
            application_id: applicationId,
            action: action, // Cast to any for Sequelize compatibility
            status_from: statusFrom ?? undefined,
            status_to: statusTo ?? undefined,
            remarks: remarks ?? undefined,
            performed_by: userId
        }, { transaction: t });
    }
    catch (error) {
        console.error('❌ Error logging approval action:', error);
        throw error; // Throw error to controller for handling
    }
};
exports.logApprovalAction = logApprovalAction;
