export enum NotificationEventType {
  //-- 💳 หมวดการชำระเงิน และค่างวด
  PAYMENT_DUE = 'payment_due',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_COMPLETED = 'payment_completed',
  OVERDUE = 'overdue',
  
  //-- 📋 หมวดคำขอสินเชื่อ และสัญญา
  APPLICATION_PENDING = 'application_pending',
  APPLICATION_APPROVED = 'application_approved',
  APPLICATION_REJECTED = 'application_rejected',
  APPLICATION_REQUIRES_DOCUMENTS = 'application_requires_documents',
  CONTRACT_CREATED = 'contract_created',
  CONTRACT_SIGNED = 'contract_signed',

  //-- 🔄 หมวดการปรับโครงสร้างหนี้ (Restructured ในอนาคต)
  LOAN_RESTRUCTURED = 'loan_restructured',

  //-- 📢 หมวดการตลาด และระบบ (Marketing & Broadcast)
  MARKETING_BROADCAST = 'marketing_broadcast',
  SYSTEM_MAINTENANCE = 'system_maintenance'
}

export enum RecipientType {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF'
}

export interface CreateNotificationInput {
  recipient_type: RecipientType;
  recipient_id: number;
  event_type: NotificationEventType;
  title: string;
  body: string;
  reference_type?: string | null;
  reference_id?: number | null;
  data?: Record<string, any> | null;  //-- สำหรับ JSON เก็บข้อมูลแนบยืดหยุ่น
}