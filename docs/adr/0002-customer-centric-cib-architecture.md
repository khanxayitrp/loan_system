# ADR 0002: Customer-Centric CIB Profile and Debt Snapshot Architecture

## Status
Accepted (2026-09-24)

## Context
ในระบบเดิม ข้อมูลเครดิตบูโร (CIB) ถูกเก็บผูกติดอยู่กับแต่ละสัญญาเงินกู้ (`loan_applications`) ผ่านตาราง `loan_cib_checks` และ `loan_cib_history_details` ซึ่งทำให้เกิดปัญหาโครงสร้างดังนี้:
1. ไม่สามารถนำผลการตรวจ CIB กลับมาใช้ซ้ำ (Reuse) ในกระบวนการอื่นได้ เช่น การสมัครสมาชิก (Membership Origination), การทบทวนวงเงินประจำปี (Periodic Credit Review), หรือการขยายวงเงิน (Credit Limit Increase)
2. เมื่อลูกค้ากู้สัญญาใหม่ ต้องตรวจ CIB ซ้ำซ้อนแม้รายงานเดิมจะยังไม่หมดอายุ (`valid_until`)
3. ในโมเดลสถาปัตยกรรมเวอร์ชัน 2.0 สถาบันการเงินต้องการให้ CIB เป็น **Customer-level Shared Credit Data Layer**

## Decision

### 1. การเปลี่ยนผ่านสู่ Customer-Centric CIB Layer
ระบบกำหนดให้ CIB เป็นข้อมูลระดับลูกค้า (Customer Domain) โดยแยกเป็น 2 ตารางหลัก:
- **`customer_cib_profiles`**: Point-in-time Snapshot ของการตรวจสอบ CIB ของลูกค้าในแต่ละครั้ง (เก็บ Summary Status, วันที่ตรวจ, วันหมดอายุ, URL รายงาน)
- **`customer_cib_debts`**: Underlying Evidence แสดงรายละเอียดภาระหนี้รายสถาบันการเงิน ณ วันที่ตรวจ CIB นั้น (ความสัมพันธ์ 1:N กับ `customer_cib_profiles`)

```text
                         CUSTOMER
                            │
                            │ 1:N
                            ▼
                  customer_cib_profiles (Snapshot: Do NOT Overwrite)
                            │
                            │ 1:N
                            ▼
                   customer_cib_debts (Evidence per Profile)
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       Membership        Credit          Loan
       Assessment        Review       Underwriting
```

### 2. กฎความถูกต้องของข้อมูล (Data Integrity Rules)
1. **Point-in-time Snapshot (No Overwrite):** ทุกครั้งที่มีการตรวจสอบ CIB ใหม่ ระบบจะต้องสร้างระเบียน `customer_cib_profiles` แถวใหม่เสมอ **ห้าม Update ทับผลการตรวจครั้งก่อน** เพื่อรักษาประวัติการอนุมัติและ Audit Trail ย้อนหลัง
2. **Profile = Summary, Debts = Evidence:** ค่า `cib_status` (เช่น `no_delay`, `delay_30_days`, `delay_60_days`, `delay_90_days`, `blacklist`) ใน `customer_cib_profiles` เป็นเพียงค่าสรุป (Summary) โดยมีรายละเอียดใน `customer_cib_debts` เป็นหลักฐานอ้างอิง
3. **Reference Linking:**
   - `membership_assessments.cib_profile_id` ชี้ไปยัง `customer_cib_profiles.id`
   - `credit_assessments.cib_profile_id` ชี้ไปยัง `customer_cib_profiles.id`
   - ในกระบวนการ Loan Underwriting หากมี CIB Profile ที่ยังไม่หมดอายุ (`valid_until >= NOW()`) สามารถดึงมาใช้ประเมินได้ทันที

### 3. Additive Safe Migration Strategy
- **รักษาตารางเก่าไว้:** ตาราง `loan_cib_checks` และ `loan_cib_history_details` จะไม่ถูก Drop ในทันที เพื่อป้องกันผลกระทบต่อ Production ระบบเงินกู้เดิมที่กำลังทำงานอยู่
- **Dual-Reference Transition:** ค่อยๆ ปรับ Service ให้บันทึกลง `customer_cib_profiles` + `customer_cib_debts` ควบคู่กับการรองรับข้อมูลเดิม

## Consequences
- **Positive:** รองรับการประเมินเครดิตได้รอบด้าน ทั้ง Membership, Credit Account, และ Loan
- **Positive:** Auditor หรือผู้ตรวจสอบสามารถย้อนดูได้ 100% ว่า ณ วันที่อนุมัติวงเงินใดๆ ระบบเห็นภาระหนี้ CIB อะไรบ้าง
- **Future Enhancement:** ในเวอร์ชันถัดไป เตรียมเพิ่มฟิลด์ Banking-Grade เช่น `response_hash`, `report_reference_no`, `monthly_installment`, `overdue_amount`, `days_past_due`
