"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipientType = exports.NotificationEventType = void 0;
var NotificationEventType;
(function (NotificationEventType) {
    //-- 💳 หมวดการชำระเงิน และค่างวด
    NotificationEventType["PAYMENT_DUE"] = "payment_due";
    NotificationEventType["PAYMENT_SUCCESS"] = "payment_success";
    NotificationEventType["PAYMENT_COMPLETED"] = "payment_completed";
    NotificationEventType["OVERDUE"] = "overdue";
    //-- 📋 หมวดคำขอสินเชื่อ และสัญญา
    NotificationEventType["APPLICATION_PENDING"] = "application_pending";
    NotificationEventType["APPLICATION_APPROVED"] = "application_approved";
    NotificationEventType["APPLICATION_REJECTED"] = "application_rejected";
    NotificationEventType["APPLICATION_REQUIRES_DOCUMENTS"] = "application_requires_documents";
    NotificationEventType["CONTRACT_CREATED"] = "contract_created";
    NotificationEventType["CONTRACT_SIGNED"] = "contract_signed";
    //-- 🔄 หมวดการปรับโครงสร้างหนี้ (Restructured ในอนาคต)
    NotificationEventType["LOAN_RESTRUCTURED"] = "loan_restructured";
    //-- 📢 หมวดการตลาด และระบบ (Marketing & Broadcast)
    NotificationEventType["MARKETING_BROADCAST"] = "marketing_broadcast";
    NotificationEventType["SYSTEM_MAINTENANCE"] = "system_maintenance";
})(NotificationEventType || (exports.NotificationEventType = NotificationEventType = {}));
var RecipientType;
(function (RecipientType) {
    RecipientType["CUSTOMER"] = "CUSTOMER";
    RecipientType["STAFF"] = "STAFF";
})(RecipientType || (exports.RecipientType = RecipientType = {}));
