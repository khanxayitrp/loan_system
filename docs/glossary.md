# Financial Loan & Membership Origination Platform - Domain Glossary

| คำศัพท์ (Term) | ความหมายและบทบาทในระบบ (Domain Definition) | ตารางฐานข้อมูลที่เกี่ยวข้อง (DB Tables) |
| :--- | :--- | :--- |
| **Membership Origination** | กระบวนการรับสมัครสมาชิกใหม่เพื่อขออนุมัติวงเงินสินเชื่อของสถาบันการเงิน รองรับ 3 ช่องทางหลัก (Staff, Public Web, Super App) | `membership_applications`, `membership_application_versions` |
| **Version Snapshotting** | การบันทึกภาพถ่ายข้อมูลลูกค้า การทำงาน การเงิน และคำขอแบบ JSON ทุกครั้งที่มีการสร้างหรือแก้ไข เพื่อใช้เป็นหลักฐานและ Audit Trail ที่แก้ไขย้อนหลังไม่ได้ | `membership_application_versions` |
| **Customer CIB Profile** | ข้อมูลผลการตรวจสอบเครดิตบูโรของลูกค้า ณ ช่วงเวลาหนึ่ง (Point-in-time Snapshot) ทุกครั้งที่มีการตรวจ CIB จะสร้าง Profile ใหม่เสมอ **ห้ามแก้ไขทับ Profile เก่า** เพื่อรักษาประวัติการตรวจสอบย้อนหลังทางกฎหมายและการตรวจสอบบัญชี (Audit Trail) | `customer_cib_profiles` |
| **Customer CIB Debts** | รายละเอียดภาระหนี้รายบัญชี/สถาบันการเงินของลูกค้า ณ วันที่ตรวจ CIB Profile นั้น ทำหน้าที่เป็น Underlying Evidence ประกอบ CIB Profile (ความสัมพันธ์ 1:N) | `customer_cib_debts` |
| **Shared Credit Data Layer** | เลเยอร์ข้อมูลเครดิตกลางระดับลูกค้า (`customer_cib_profiles` + `customer_cib_debts`) ที่ใช้ร่วมกันได้ทุกโมดูล ทั้ง Membership Assessment, Credit Facility Review, และ Loan Underwriting แทนที่จะผูกติดกับ Loan Application เดี่ยวๆ | `customer_cib_profiles`, `customer_cib_debts` |
| **Legacy Loan CIB** | ตรวจสอบ CIB แบบเดิมที่ผูกติดกับใบคำขอกู้รายสัญญา (`loan_cib_checks`, `loan_cib_history_details`) ยังคงรักษาไว้เพื่อความเข้ากันได้ย้อนหลัง (Additive Safe Migration) | `loan_cib_checks`, `loan_cib_history_details` |
| **Membership Assessment** | การตรวจวิเคราะห์ความเสี่ยงลูกค้าโดยเจ้าหน้าที่สินเชื่อ (Staff) สรุปรายได้ ภาระหนี้ DSR/DTI อ้างอิง CIB Profile ล่าสุด และเสนอแนะระดับ Tier และวงเงินที่ควรให้ | `membership_assessments` |
| **Membership Tier** | ระดับชั้นของสมาชิก (เช่น Silver, Gold, Platinum) ที่กำหนดเงื่อนไข อัตราดอกเบี้ย วงเงินสูงสุด และรูปแบบวงเงิน (Revolving / Non-Revolving) | `membership_tiers` |
| **Membership Decision** | ผลการพิจารณาอนุมัติขั้นสุดท้ายโดยผู้จัดการ (Manager / Committee) ซึ่งกำหนดวงเงินอนุมัติจริง วันหมดอายุ และเงื่อนไขก่อนเปิดวงเงิน | `membership_decisions` |
| **Credit Account** | บัญชีวงเงินสินเชื่อของสมาชิกที่ได้รับอนุมัติ ประกอบด้วย วงเงินที่ได้รับอนุมัติ (Approved Limit), วงเงินคงเหลือที่ใช้ได้ (Available Limit), และสถานะวงเงิน | `credit_accounts` |
| **Credit Assessment** | การทบทวน/ปรับปรุงวงเงินเครดิตของสมาชิกเดิม (Initial Limit, Increase, Decrease, Periodic Review) โดยดึงประวัติ CIB ล่าสุดมาประกอบการพิจารณา | `credit_assessments` |
| **Credit Ledger** | บัญชีแยกประเภทการเคลื่อนไหวของวงเงินสินเชื่อ (Audit Ledger) บันทึกทุกรายการเพิ่ม/ลดวงเงิน การเบิกเงินกู้ (Drawdown) และการคืนวงเงินเมื่อชำระค่างวด | `credit_ledger` |
| **Loan Drawdown** | การนำวงเงินสมาชิกที่มีอยู่ไปเบิกเป็นสัญญาเงินกู้จริง (Loan Application & Contract) ผูกกับตารางชำระค่างวด | `loan_applications`, `loan_contract`, `repayment_schedules` |
| **Amortization Schedule** | ตารางแผนผ่อนชำระหนี้รายงวด คำนวณเงินต้น ดอกเบี้ย และยอดหนี้คงเหลือตามประเภทดอกเบี้ย (Flat Rate หรือ Effective Rate) | `repayment_schedules`, `repayments` |
| **Revolving Credit Limit** | วงเงินสินเชื่อหมุนเวียนสำหรับบัตรสมาชิก ที่เมื่อชำระคืนเงินต้นแล้ว วงเงินจะกลับมาพร้อมให้เบิกใช้ใหม่ได้ทันทีโดยไม่ต้องยื่นขออนุมัติใหม่ | `membership_cards`, `credit_accounts` |
| **Dual-Limit Sub-allocation** | การแยกสัดส่วนวงเงินรวม (Approved Limit) ออกเป็น 2 วงเงินย่อยที่บังคับใช้อย่างเคร่งครัด ได้แก่ **Purchase Limit** (ใช้ซื้อสินค้า/บริการกับ Partner ไม่ต่ำกว่า 70-80%) และ **Cash Limit** (ถอนเงินสดฉุกเฉิน ไม่เกิน 20-30%) | `membership_cards`, `card_limits` |
| **Credit Scoring Engine (1,000 Points)** | ระบบคำนวณคะแนนเครดิตรวม 0–1,000 คะแนน จาก 8 มิติ (Income 20%, DTI 20%, Repayment 20%, Account Conduct 10%, Employment 10%, Card Behavior 10%, KYC/AML 5%, Relationship 5%) เพื่อจัดกลุ่มความเสี่ยง (Risk Grades A1, A2, B1, B2, C, D) | `credit_score_evaluations`, `scoring_rules` |
| **Tier Cap & Risk-Based Limit** | การคำนวณวงเงินอนุมัติโดยใช้กฎ `MIN(Requested, Tier Cap, Income-based Limit, Risk-based Limit, Regulatory Cap)` โดย Risk-based Limit = Tier Cap × Risk Factor ตามคะแนนเครดิต | `membership_assessments`, `membership_decisions` |
| **Account Conduct & DPD Freeze Stages** | สถานะการควบคุมความเสี่ยงตามวันค้างชำระ (Days Past Due): DPD 1–7 วัน (Watch / Suspend Increase), DPD 8–30 วัน (Freeze Cash), DPD >30 วัน หรือ Fraud Alert (Freeze Card ทั้งใบ) | `membership_cards`, `card_risk_controls` |
| **Batch Re-score & Progressive Upgrade** | กระบวนการประเมินทบทวนความเสี่ยงและวงเงินตามรอบเวลา (Silver/Gold ทุก 3 เดือน, Platinum/Diamond/VIP ทุก 6 เดือน) อนุญาตให้ปรับเพิ่มวงเงินไม่เกิน Policy Step (15-25%) และเลื่อนได้ไม่เกินครั้งละ 1 Tier เมื่อผ่านเกณฑ์ On-time และ DPD เท่านั้น | `membership_tier_reviews`, `credit_assessments` |
| **Maker-Checker Manual Override** | กระบวนการขออนุมัติข้อยกเว้นพิเศษนอกเหนือกฎอัตโนมัติ (Rule Override) ที่ต้องมีผู้เสนอเรื่อง (Maker) และผู้อนุมัติตรวจสอบ (Checker/Senior Manager) เป็นคนละบุคคลกันเสมอ พร้อมบันทึก Reason Code และ Audit Trail | `rule_override_logs`, `audit_trails` |

