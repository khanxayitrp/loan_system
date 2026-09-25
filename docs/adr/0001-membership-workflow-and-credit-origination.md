# ADR 0001: 2-Tier Membership Origination Approval Workflow & Dual-Mode Credit Account

## Status
Accepted (2026-09-24)

## Context
ระบบเดิมของ `loan_system` ถูกออกแบบให้ผูกกับการซื้อขายสินค้าแบบ E-Commerce (BNPL / Single Item Loan) แต่ในสถาปัตยกรรมเวอร์ชัน 2.0 (ตาม `system_development_document.txt`) ระบบได้ Pivot มาเน้น **Membership & Credit Origination System** เพื่อให้ลูกค้าสมัครขอเป็นสมาชิกและได้รับการอนุมัติวงเงินสินเชื่อก่อน (Credit Facility / Credit Limit) แล้วจึงนำวงเงินไปเบิกถอนทำสัญญาเงินกู้

ในปัจจุบัน ตารางฐานข้อมูลสำหรับ Membership และ Credit Account ถูกสร้างไว้แล้ว แต่กระบวนการตัดสินใจ (Decision Engine) และ Workflow การอนุมัติยังไม่มี API และ Service รองรับ ทำให้ใบสมัครค้างอยู่ที่สถานะ `SUBMITTED`

## Decisions

### 1. โครงสร้างการอนุมัติ 2 ระดับ (2-Tier Approval Hierarchy)
กระบวนการพิจารณาใบสมัครสมาชิกจะแบ่งออกเป็น 2 ขั้นตอนหลัก:
1. **Level 1 - Assessment by Loan Staff / Credit Analyst (`SUBMITTED` -> `ASSESSING` -> `PENDING_MANAGER_REVIEW`)**:
   - พนักงานรับเรื่องและเปลี่ยนสถานะเป็น `ASSESSING`
   - ตรวจสอบเอกสาร ข้อมูลอาชีพ ที่อยู่ และ CIB Report (รองรับ AI CIB PDF Scan)
   - บันทึกการประเมินลงในตาราง `membership_assessments` (คำนวณ DSR, DTI, Credit Score)
   - แนะนำระดับ Tier (`membership_tiers`) และวงเงินที่เสนอแนะ (`recommended_credit_limit`)
   - ส่งต่อให้ผู้จัดการด้วยสถานะ `PENDING_MANAGER_REVIEW` (หรือสั่ง `RETURNED` หากเอกสารไม่ครบ)
2. **Level 2 - Final Decision by Manager (`PENDING_MANAGER_REVIEW` -> `APPROVED` / `REJECTED` / `RETURNED`)**:
   - ผู้จัดการตรวจผลการประเมินและข้อเสนอแนะ
   - บันทึกคำตัดสินลงตาราง `membership_decisions`
   - ระบุวงเงินที่อนุมัติจริง (`approved_credit_limit`), เงื่อนไข (Conditions), และวันหมดอายุของวงเงิน
   - บันทึกประวัติการเปลี่ยนสถานะใน `membership_workflow_logs`

### 2. การสร้างบัญชีวงเงิน (Credit Account Creation) เมื่ออนุมัติ
เมื่อใบสมัครได้รับการ `APPROVED` จากผู้จัดการ:
- ระบบจะสร้างหรือเปิดใช้งานระเบียนใน `credit_accounts` อัตโนมัติ โดยผูกกับ `customer_id`
- ตั้งค่า `approved_credit_limit`, `available_credit_limit`, และ `account_status = 'ACTIVE'`
- บันทึกประวัติการเปิดวงเงินครั้งแรกลงใน `credit_ledger` (Transaction Type: `CREDIT_INIT`)
- รองรับลักษณะวงเงินแบบ **Dual-Mode** ตาม Tier / การตั้งค่า:
  - **Revolving Credit**: เมื่อกู้เงินจะลดวงเงินคงเหลือ (`available_credit_limit`) และเมื่อชำระคืนเงินต้นจะคืนวงเงินกลับมา
  - **Non-Revolving Credit**: วงเงินใช้ได้ครั้งเดียวตามจำนวนที่อนุมัติ

### 3. Immediate Action Plan
1. พัฒนา `membership-assessment.service.ts` และ Controller สำหรับ Staff Review & CIB Summary
2. พัฒนา `membership-decision.service.ts` สำหรับ Manager Review, Approval, Rejection, Return
3. เพิ่ม Logic เปิด `credit_accounts` + บันทึก `credit_ledger` ใน Transaction เดียวกันเมื่อ Approve
4. พัฒนา API สำหรับ Audit Trail `membership_workflow_logs`

## Consequences
- **Positive:** แยกบทบาทชัดเจนตามหลักการควบคุมภายในทางการเงิน (Maker-Checker segregation of duties) ป้องกันการทุจริต
- **Positive:** ข้อมูลประวัติการพิจารณาทุกขั้นตอนถูกเก็บถาวรใน `membership_assessments`, `membership_decisions`, และ `membership_workflow_logs` ตรวจสอบย้อนหลังได้ 100%
- **Maintenance:** ต้องพัฒนา Role-Based Access Control (RBAC) ให้รัดกุมระหว่างสิทธิ์ Staff (Maker) และ Manager (Checker)
