# ADR 0003: INSEE Membership Card Decision Engine & Risk Control Architecture

## Status
Accepted (2026-09-25)

## Context
จากการวิเคราะห์แบบจำลองธุรกิจและตรรกะระบบ `INSEE Membership Card — System Logic & Business Model Summary` (อ้างอิงจาก `INSEEMembershipCardLogicBusinessModel.xlsx` ทั้ง 8 แผ่นงาน) และผ่านกระบวนการ Grilling & Alignment กับทีมผู้พัฒนาและผู้ดูแลความเสี่ยง ระบบสินเชื่อเดิมถูกยกระดับสู่ **Revolving Credit Membership Card Platform** เต็มรูปแบบ เพื่อรองรับวงเงินหมุนเวียน 2 สัดส่วน (Purchase & Cash Withdrawal), ระบบประเมินความเสี่ยงด้วยโมเดล 1,000 คะแนน, การตั้งวงเงินแบบ Conservative MIN Rule, และกลไกควบคุมความเสี่ยงอัตโนมัติตาม DPD

## Decisions

### 1. โครงสร้างวงเงินหมุนเวียนคู่ขนาน (Single Ledger, Dual Caps)
- ระบบใช้โครงสร้าง **Single Ledger, Dual Caps**: บัญชีวงเงิน 1 บัญชีควบคุม 2 เพดานวงเงินย่อย
  - `total_balance <= approved_limit`
  - `cash_balance <= cash_limit`
- **สัดส่วนวงเงิน (Dual-Limit Allocation)**:
  - **Cash Limit**: สำหรับถอนเงินสดฉุกเฉิน จำกัดที่ 20% สำหรับสมาชิกใหม่ และสูงสุด 25% (Gold) ถึง 30% (Tier สูงและประวัติดี)
  - **Purchase Limit**: สำหรับซื้อสินค้า/บริการกับ Partner ในสัดส่วน 70%–80%
- **Repayment Waterfall**: เมื่อสมาชิกชำระคืนเงิน ยอดชำระจะตัดลดหนี้ที่คิดอัตราดอกเบี้ยสูงกว่าก่อน (Cash Balance แล้วจึงตัด Purchase Balance)

### 2. กฎการกำหนด Tier สำหรับสมาชิกใหม่ (Onboarding Tier Assignment)
- **เกณฑ์สมาชิกใหม่**: ผู้สมัครใหม่ที่มีอายุสมาชิก = 0 เดือน (`membership_age = 0`) จะได้รับการกำหนดเป็น **Silver Tier เสมอ** เพื่อควบคุมความเสี่ยงในระยะเริ่มต้น (Probationary Tier)
- คะแนนเครดิตที่สูงของผู้สมัครใหม่จะนำไปใช้ในการพิจารณาอนุมัติวงเงินเบื้องต้น (Initial Approved Limit สูงสุดไม่เกิน Silver Cap: 20,000,000 LAK) และจะสามารถเลื่อนขั้นเป็น Gold, Platinum, Diamond หรือ VIP ได้ตามรอบ Batch Re-score เมื่อสะสมอายุสมาชิกและประวัติการชำระเงินครบตามเกณฑ์

### 3. Credit Scoring Engine (1,000 Points Model)
คำนวณคะแนนรวมจาก 8 องค์ประกอบ (น้ำหนักรวม 100% = 1,000 คะแนน):
1. **Income & Stability** (20% - สูงสุด 200 คะแนน)
2. **DTI / Debt Burden** (20% - สูงสุด 200 คะแนน):
   - DTI <= 30%: 200 คะแนน
   - DTI 31–35%: 170 คะแนน
   - DTI 36–40%: 140 คะแนน
   - DTI 41–45%: 100 คะแนน
   - DTI > 45%: 0–70 คะแนน
3. **Repayment History** (20% - สูงสุด 200 คะแนน)
4. **Account Conduct** (10% - สูงสุด 100 คะแนน)
5. **Employment / Business Stability** (10% - สูงสุด 100 คะแนน)
6. **Membership Behavior** (10% - สูงสุด 100 คะแนน)
7. **KYC / Fraud / AML Status** (5% - สูงสุด 50 คะแนน)
8. **Relationship / Verified Assets** (5% - สูงสุด 50 คะแนน)

**ลำดับขั้นความเสี่ยง (Risk Grades)**:
- 875–1,000: Grade A1 (Black/VIP, PD Proxy 1%)
- 800–874: Grade A2 (Diamond, PD Proxy 2%)
- 725–799: Grade B1 (Platinum, PD Proxy 3.5%)
- 650–724: Grade B2 (Gold, PD Proxy 5.5%)
- 550–649: Grade C (Silver, PD Proxy 9%)
- <550: Grade D (Decline / Committee Exception)

### 4. กฎการแก้ไขข้อขัดแย้ง DTI (DTI Conflict Resolution & Auto-Downgrade)
- หากผู้สมัครมีคะแนนเครดิตสูง แต่มีค่า DTI เกินเกณฑ์เพดานของ Tier นั้น (เช่น DTI 42% เกินเกณฑ์ Platinum 38% แต่ยังอยู่ในเกณฑ์ Silver 45%):
  - ระบบจะทำ **Auto-Downgrade** ลดระดับลงมายัง Tier สูงสุดที่ผ่านเกณฑ์ DTI นั้นทันทีโดยอัตโนมัติ (เช่น ปรับลงเป็น Silver) แทนการ Reject คำขอ

### 5. Limit Calculator Logic & System Parameters
- คำนวณวงเงินอนุมัติด้วยหลักการความเสี่ยงต่ำสุด:
  `Approved Limit = MIN(Requested Limit, Tier Cap, Income-based Limit, Risk-based Limit, Regulatory Cap)`
- ตัวแปรทางการเงินจะถูกจัดเก็บในตาราง System Configuration ใน Database (ไม่ Hard-code):
  - `Default Tenor`: 24 เดือน
  - `Default Proposed Monthly Rate`: 1.89% ต่อเดือน (Effective Annual Yield ประมาณ 22.68%)
- สูตรคำนวณ Income-based Limit:
  - `Max Debt Service = Monthly Net Income × Internal Max DTI`
  - `Available Monthly Capacity = MAX(0, Max Debt Service - Existing Monthly Debt)`
  - `Income-based Limit = Available Monthly Capacity × (1 - (1 + Monthly Rate)^(-Tenor)) / Monthly Rate`

### 6. Risk Control & DPD Enforcement State Machine
- ควบคุมสถานะบัตรตามวันค้างชำระ (Days Past Due):
  - **DPD 1–7 วัน**: สถานะ `Watch` ระงับการปรับเพิ่มวงเงิน
  - **DPD 8–30 วัน**: สถานะ `Freeze Cash` ระงับการถอนเงินสดโดยเด็ดขาด อนุญาตเฉพาะ Purchase ตาม Policy
  - **DPD > 30 วัน หรือ Fraud/AML Alert**: สถานะ `Freeze Card` ระงับการใช้งานบัตรทุกช่องทาง และส่งเข้าสู่ฝ่ายติดตามหนี้ (Collections)
- **Un-freeze Logic**: เมื่อลูกหนี้ชำระเงินจน DPD กลับมาเป็น 0 วัน ระบบจะ **Auto-Unfreeze** ปลดระงับบัตรและเงินสดโดยอัตโนมัติทันที แต่จะคงการระงับสิทธิ์ขอเพิ่มวงเงิน (Suspend Limit Increase) ไว้จนกว่าจะผ่านรอบ Batch Re-score ถัดไป

### 7. รอบการประเมินซ้ำและการปรับเพิ่มวงเงินอัตโนมัติ (Batch Re-score & Auto-Upgrade)
- รอบการประเมินซ้ำ (Review Cycle):
  - Silver & Gold: ทุก 3 เดือน
  - Platinum, Diamond, Black/VIP: ทุก 6 เดือน
- **Zero-touch Auto-Upgrade**: สำหรับบัญชีที่ผ่านเกณฑ์แบบ Clean 100% (On-time payment, DPD = 0, Utilization อยู่ใน Sweet Spot, และผ่านการ Refresh Affordability) ระบบสามารถปรับเพิ่มวงเงิน (ไม่เกิน Policy Step 15%–25%) และเลื่อนขั้นได้ไม่เกินครั้งละ 1 Tier โดยอัตโนมัติ
- ข้อยกเว้น: การปรับขึ้นสู่ Black/VIP หรือกรณีที่มี Alert ต้องผ่านการพิจารณาของ Credit Committee หรือ Senior Approval เสมอ

### 8. Maker-Checker Manual Override
- ข้อยกเว้นการอนุมัติ (Rule Override ตาม R018) บังคับกระบวนการ 2-Level Approval (Maker-Checker): ผู้สร้างคำขอ Override และผู้อนุมัติจะต้องเป็นคนละบุคคลเสมอ พร้อมเก็บบันทึก Reason Code และ Audit Trail

## Consequences
- สถาปัตยกรรมมีความยืดหยุ่นสูง พร้อมรองรับการเติบโตของพอร์ตสินเชื่อบัตรหมุนเวียน (Revolving Portfolio)
- ตรรกะการประเมินและการควบคุมความเสี่ยงถูกจัดระเบียบอย่างชัดเจน เป็นไปตามมาตรฐานการกำกับดูแลความเสี่ยงสถาบันการเงิน
- สามารถสร้างระบบทดสอบแบบ End-to-End บน Seam หลักที่สอดคล้องกับ Requirement ได้อย่างแม่นยำ
