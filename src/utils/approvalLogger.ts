// src/utils/approvalLogger.ts
import { Transaction } from 'sequelize';
import { db } from '../models/init-models'; // Update path to match your project structure

// Define Action Type to match Database ENUM and prevent typos
export type ApprovalActionType = 
    | 'submitted'
    | 'verified_basic'
    | 'verified_call'
    | 'verified_cib'
    | 'verified_field'
    | 'assessed_income'
    | 'verified_delivery_receipt'
    | 'approved'
    | 'rejected'
    | 'returned_for_edit'
    | 'cancelled'
    | 'printed_approval_summary'; // New status type

/**
 * ຟັງຊັນສຳລັບບັນທຶກປະຫວັດການເຄື່ອນໄຫວຂອງສິນເຊື່ອ (Loan Approval Logs)
 */
export const logApprovalAction = async (
    applicationId: number,
    action: ApprovalActionType,
    statusFrom: string | null | undefined,
    statusTo: string | null | undefined,
    remarks: string | null | undefined,
    userId: number,
    t?: Transaction // Optional Transaction parameter
): Promise<void> => {
    try {
        await db.loan_approval_logs.create({
            application_id: applicationId,
            action: action as any, // Cast to any for Sequelize compatibility
            status_from: statusFrom ?? undefined,
            status_to: statusTo ?? undefined,
            remarks: remarks ?? undefined,
            performed_by: userId
        }, { transaction: t });
    } catch (error) {
        console.error('❌ Error logging approval action:', error);
        throw error; // Throw error to controller for handling
    }
};