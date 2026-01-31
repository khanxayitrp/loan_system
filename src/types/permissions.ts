// src/types/permissions.ts

export const PERMISSIONS = {
  // กลุ่มจัดการผู้ใช้งาน
  USER: {
    VIEW: 'user_view',
    CREATE: 'user_create',
    MANAGE: 'user_manage',
    PERMISSION: 'permission_manage',
  },

  // กลุ่มงานสินเชื่อ (Loan Operations)
  LOAN: {
    VIEW_ALL: 'loan_view_all',
    VIEW_ASSIGNED: 'loan_view_assigned',
    CREATE: 'loan_create',
    EDIT: 'loan_edit',
    APPROVE: 'loan_approve',
    REJECT: 'loan_reject',
  },

  // กลุ่มจัดการเอกสาร (Document Management)
  DOCUMENT: {
    UPLOAD: 'doc_upload',
    VIEW: 'doc_view',
    DELETE: 'doc_delete',
  },

  // กลุ่มร้านค้าและคู่ค้า (Partner & Shop)
  PARTNER: {
    MANAGE: 'partner_manage',
    REPORT: 'shop_view_report',
  },

  // กลุ่มลูกค้า (Customer Features)
  CUSTOMER: {
    PROFILE: 'cust_profile_view',
    HISTORY: 'cust_loan_history',
    PAYMENT_UPLOAD: 'payment_proof_upload',
  },

  
// กลุ่มการชำระเงิน (Payment)
  PAYMENT: {
    VIEW: 'payment_view',
    CREATE: 'payment_create',
    VERIFY: 'payment_verify',
  } 
} as const;


/**
 * สกัด Type ออกมาจาก Object ด้านบน
 * ผลลัพธ์จะเป็น: 'user_view' | 'user_manage' | 'loan_approve' | ...
 */
export type PermissionType = 
  typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];