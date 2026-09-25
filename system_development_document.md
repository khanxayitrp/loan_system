# เอกสารสรุประบบและแนวทางการพัฒนาระบบ (System Development Document)

**ชื่อโครงการ:** Financial Loan & Membership Origination Platform (loan_system)  
**ประเภทระบบ:** Enterprise Financial SaaS / Loan Management / Membership Origination System  
**เวอร์ชันเอกสาร:** 2.0 (อัปเดตตามโครงสร้างปัจจุบัน: ระงับระบบ E-Commerce และขยายระบบสมัครสมาชิกขอวงเงิน)  

---

## 1. ภาพรวมระบบ (System Overview)

ระบบนี้เป็นแพลตฟอร์มการบริหารจัดการสินเชื่อ (Loan Management System) และระบบสมัครสมาชิกองค์กรเพื่ออนุมัติวงเงินสินเชื่อ (Membership & Credit Origination System) ระดับองค์กร มุ่งเน้นการลงทะเบียนสมัครสมาชิก, การประเมินความเสี่ยงและเครดิต, การอนุมัติวงเงิน, การทำสัญญาเงินกู้, การชำระคืนเงินกู้, การออกเอกสารสัญญา PDF และการเชื่อมต่อกับระบบภายนอก เช่น Lao Telecom (SOAP/OTP) และบริการ Redis Caching

> **หมายเหตุสถานะฟีเจอร์:** ระบบ E-Commerce (ตะกร้าสินค้า, การสั่งซื้อสินค้าออนไลน์) ถูกระงับการใช้งานแล้ว (Paused/Deprecated) โดยระบบปรับจุดประสงค์หลักมาเน้นการสมัครสมาชิกขอวงเงินสินเชื่อ (Membership Origination) และการอนุมัติสินเชื่อเต็มรูปแบบ

---

## 2. สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Architecture & Tech Stack)

### 2.1 Backend Technology Stack
* **Language & Runtime:** Node.js, TypeScript (ES2022+)
* **Framework:** Express.js (REST API Structure)
* **ORM & Database:** Sequelize ORM (TypeScript models), MySQL / MariaDB (Primary Database)
* **Cache & Memory Management:** Redis (Caching Query Results, Rate Limiting, Session/OTP)
* **Real-time Communication:** Socket.io
* **Background Jobs & Tasks:** `node-cron` (Daily Debt Tracking, Payment Reminders, Database Partitioning)
* **API Documentation:** Swagger UI / OpenAPI 3.0 (`swagger-jsdoc`, Path: `/api-docs`)

### 2.2 Security & System Operations
* **Security:** Helmet, CORS, Express Rate Limit, Cookie Parser
* **Authentication:** JWT Access Token & Refresh Token Rotation, Password Hashing (`bcryptjs`)
* **File Upload & Document Rendering:** Multer, AWS S3 SDK (`@aws-sdk/client-s3`), Puppeteer, Handlebars, Sharp
* **External Integrations:** Lao Telecom SOAP Client (`soap`), Custom Java Encryption Utilities (`encrypt.jar` / `decrypt.jar`), Google Generative AI (`@google/generative-ai`)

---

## 3. โครงสร้างโฟลเดอร์ของโปรเจกต์ (Project Directory Structure)

```text
/
├── config/             # การตั้งค่าระบบ (Database, Auth, SMS/Lao Telecom)
├── controllers/        # ตัวจัดการ API Requests & Responses
├── interfaces/         # TypeScript Interfaces และ Type Definitions
├── middlewares/        # Middlewares (Auth, Rate Limiting, Error Handling, Upload)
├── models/             # Sequelize Data Models และ init-models
├── repositories/       # Data Access Layer (Membership, Loan, Customer, User)
├── routes/             # API Route Definitions
├── services/           # Business Logic (Membership Origination, Loan, Redis, PDF, OTP, Cron)
├── templates/          # HTML Handlebars Templates สำหรับสร้างเอกสาร PDF
├── types/              # Type Definitions สอดคล้องกับ Domain
├── utils/              # Logger, Cryptography, Errors, Helpers
├── app.ts              # Express App Configuration & Route Mounting
├── server.ts           # HTTP Server Entry Point & Cron Job Initialization
├── test-otp.ts         # Script ทดสอบระบบ OTP
└── test-soap.ts        # Script ทดสอบ SOAP Connection
```

---

## 4. โมดูลหลักของระบบ (Core System Modules)

### 4.1 ระบบยืนยันตัวตนและการจัดการสิทธิ์ (Authentication & Authorization)
* **User & Auth Management (`auth.routes.ts`, `user.routes.ts`):** ระบบ Login, Logout, Refresh Token Rotation และ Token Blacklist
* **Role-Based Access Control (`permission.routes.ts`):** กำหนดสิทธิ์ผู้ใช้งานตามฟีเจอร์ (Feature Permissions) และบทบาทผู้ใช้งาน (RBAC)

### 4.2 ระบบสมัครสมาชิกและระบบตัดสินใจเครดิต [ฟังก์ชันหลัก] (Membership Origination & Decision Engine)
* **Multi-Channel Application Intake (`membership-origination.routes.ts`):**
  * `STAFF`: พนักงานลงทะเบียนคำขอแทนลูกค้าผ่านระบบ Back-Office
  * `PUBLIC_WEB`: ลูกค้าลงทะเบียนเองผ่านเว็บพอร์ทัล ยืนยันตัวตนด้วย OTP
  * `SUPER_APP`: ลูกค้าลงทะเบียนผ่านแอปพลิเคชันมือถือ โดยใช้ JWT Token
* **Application Processing & Duplicate Check:**
  * ตรวจสอบคำขอซ้ำในสถานะที่ยังดำเนินการอยู่ (`DRAFT`, `SUBMITTED`, `ASSESSING`, `PENDING_MANAGER_REVIEW`, `VERIFIED`)
  * สร้างรหัสคำขออัตโนมัติ (Format: `MAyyMMddXXXX`)
* **Version Snapshotting (`membership_application_versions`):**
  * บันทึก Snapshot ของข้อมูลลูกค้า, การทำงาน, สถานะการเงิน และวงเงินที่ขอ ในรูปแบบ JSON ทุกครั้งที่มีการสร้างหรือแก้ไขคำขอ
* **Credit Scoring Engine (1,000 Points Model):**
  * คำนวณคะแนนเครดิตจาก 8 องค์ประกอบ (Income 20%, DTI 20%, Repayment History 20%, Account Conduct 10%, Employment Stability 10%, Card Behavior 10%, KYC/AML 5%, Relationship 5%)
  * จัดกลุ่ม Risk Grades: A1 (875–1,000), A2 (800–874), B1 (725–799), B2 (650–724), C (550–649), D (<550 - Decline)
* **Approved Limit Calculator (Conservative MIN Rule):**
  * `Approved Limit = MIN(Requested Limit, Tier Cap, Income-based Limit, Risk-based Limit, Regulatory Cap)`
  * `Income-based Limit = Available Monthly Capacity × (1 - (1 + Monthly Rate)^(-Tenor)) / Monthly Rate` (Default: Tenor 24 เดือน, Monthly Rate 1.89%)
* **Tier Gating & DTI Auto-Downgrade:**
  * สมาชิกใหม่เริ่มต้นที่ **Silver Tier** เสมอ (Probationary Tier)
  * หากคะแนนถึงเกณฑ์ Tier สูงแต่ DTI เกินเพดาน ระบบจะทำการ **Auto-Downgrade** ไปยัง Tier สูงสุดที่ผ่านเงื่อนไข DTI นั้นโดยอัตโนมัติ

### 4.3 ระบบจัดการข้อมูลลูกค้าและประวัติเครดิต (Customer & CIB Profile)
* **Customer Master Data (`customer.routes.ts`):** ข้อมูลส่วนตัว, ที่อยู่ (`customerLocation.routes.ts`), ข้อมูลที่ทำงานและอาชีพ (`customer_work_info`)
* **Shared CIB Credit Profile Layer (`customer_cib_profiles`, `customer_cib_debts`):**
  * **Point-in-time Snapshot:** ข้อมูล CIB เป็นประวัติระดับลูกค้า (Customer Domain) ไม่ผูกติดกับสัญญาเงินกู้รายสัญญา ตรวจสอบ CIB แต่ละครั้งจะสร้าง Profile ใหม่เสมอ **ห้าม Update ทับผลการตรวจเดิม**
  * **1:N Underlying Debt Evidence (`customer_cib_debts`):** รายการภาระหนี้รายสถาบันการเงิน ณ วันที่ตรวจ เพื่อนำไปคำนวณ DSR, DTI และความเสี่ยง
  * **Shared Usage:** Profile เดียวกันสามารถนำไปใช้ได้ทั้ง Membership Assessment, Credit Limit Review, และ Loan Underwriting ตราบใดที่ยังไม่หมดอายุ (`valid_until`)
  * **AI PDF Extraction:** บูรณาการ Gemini AI (`cibParser.ts`) สกัดข้อมูลจาก PDF ของธนาคารแห่ง สปป. ลาว เพื่อแปลงเป็นรายการหนี้อัตโนมัติ

### 4.4 ระบบบัตรสมาชิก วงเงินคู่ขนาน และการควบคุมความเสี่ยง (Membership Card & Card Controls)
* **Single Ledger, Dual Caps:**
  * 1 บัญชีควบคุม 2 เพดานวงเงินย่อย: ยอดหนี้รวม `<= Approved Limit` และยอดหนี้เงินสด `<= Cash Limit`
  * **Cash Limit**: 20% สำหรับสมาชิกใหม่ และสูงสุด 25%–30% ตาม Tier สำหรับถอนเงินสดฉุกเฉิน
  * **Purchase Limit**: สัดส่วน 70%–80% สำหรับซื้อสินค้า/บริการกับพันธมิตรใน Ecosystem
* **DPD Risk Enforcement State Machine:**
  * **DPD 1–7 วัน**: สถานะ `Watch` ระงับสิทธิ์การปรับเพิ่มวงเงิน
  * **DPD 8–30 วัน**: สถานะ `Freeze Cash` ระงับการถอนเงินสดโดยเด็ดขาด อนุญาตเฉพาะ Purchase ตามนโยบาย
  * **DPD > 30 วัน หรือ Fraud Alert**: สถานะ `Freeze Card` ระงับการใช้งานบัตรทุกช่องทาง และส่งฝ่ายติดตามหนี้ (Collections)
  * **Auto-Unfreeze:** เมื่อลูกหนี้ชำระยอดค้างชำระครบถ้วน (DPD กลับมาเป็น 0) ระบบจะปลดการระงับบัตรและเงินสดอัตโนมัติทันที
* **Periodic Monitoring & Batch Re-score:**
  * ประเมินคะแนนซ้ำตามรอบเวลา (Silver/Gold ทุก 3 เดือน, Platinum/Diamond/VIP ทุก 6 เดือน)
  * **Zero-touch Auto-Upgrade:** ปรับเพิ่มวงเงิน (ไม่เกิน Policy Step 15%–25%) และเลื่อนระดับได้ไม่เกินครั้งละ 1 Tier สำหรับบัญชีที่ผ่านเกณฑ์ Clean 100%
* **Maker-Checker Manual Override:**
  * การอนุมัติข้อยกเว้นพิเศษ (Rule Override R018) ต้องผ่านการอนุมัติ 2 ระดับโดย Maker และ Checker ต้องเป็นคนละบุคคล พร้อมเก็บ Reason Code และ Audit Trail

### 4.5 ระบบจัดการสินเชื่อและอนุมัติสัญญา (Loan Management & Contract)
* **Loan Application (`loan-application.routes.ts`):** ยื่นคำขอสินเชื่อต่อยอดจากวงเงินสมาชิก
* **Verification Workflow (`loan_basic_verifications`, `loan_call_verifications`, `loan_field_visits`):**
  * Basic Verification: ตรวจสอบเอกสาร
  * Call Verification: บันทึกข้อมูลการโทรสอบถาม
  * Field Visit: บันทึกข้อมูลการลงพื้นที่ตรวจสอบ
* **Approval & Contract (`loan_approval_logs`, `loan_contract.routes.ts`):** ประวัติการพิจารณาอนุมัติ และการสร้างสัญญาเงินกู้
* **Restructuring (`loan-restructure.routes.ts`):** การปรับโครงสร้างหนี้และการขอเปลี่ยนแปลงเงื่อนไข

### 4.6 ระบบการชำระคืนและการเงิน (Repayments & Financial Operations)
* **Repayment Schedule (`repayment.routes.ts`, `repayment_schedules`):** คำนวณตารางผ่อนชำระ (Amortization Builder)
* **Repayment Operations (`repayments`, `payment_transactions`):** บันทึกการรับชำระเงิน, ออกหลักฐานการชำระ, และอัปเดตยอดคงเหลือ
* **Repayment Waterfall:** การชำระเงินคืนจะนำไปตัดหนี้ดอกเบี้ยสูง (Cash Balance) ก่อนตัดหนี้ซื้อสินค้า (Purchase Balance)


### 4.7 ระบบ OTP และการเชื่อมต่อ Lao Telecom (OTP & Telecommunication)
* **Lao Telecom SOAP Integration (`laotelecom.service.ts`):** ส่ง SMS OTP ผ่าน SOAP Webservice ของ Lao Telecom
* **Encryption Utilities (`ltc-encrypt.ts`, `encrypt.jar`):** เข้ารหัสข้อมูลลับก่อนส่งผ่าน SOAP Webservice
* **OTP Service (`otp.service.ts`, `otp.routes.ts`):** บริการส่ง OTP, ยืนยัน OTP, Resend และจัดการสถานะบน Redis

### 4.8 ระบบออกเอกสารสัญญา PDF (PDF Generation)
* **PDF Service (`pdf.service.ts`, `pdf.routes.ts`):** แปลง Handlebars HTML Templates เป็น PDF ด้วย Puppeteer Rendering Engine
* **เอกสารที่รองรับ:** สัญญาเงินกู้, หนังสือมอบอำนาจ, สัญญาค้ำประกัน, ใบอนุมัติวงเงินสมาชิก

### 4.9 ระบบงานเบื้องหลังอัตโนมัติ (Background Cron Jobs)
* **Daily Tracking Service (`DailyTrackingService.ts`):** คำนวณยอดค้างชำระ, ดอกเบี้ย และสถานะหนี้รายวัน
* **Reminder Cron Service (`ReminderCronService.ts`):** ส่งแจ้งเตือนชำระเงินล่วงหน้า
* **Partition Service (`partition.service.ts`):** จัดการ Partition ของตารางฐานข้อมูลอัตโนมัติ

### 4.10 [PAUSED/LEGACY] ระบบ E-Commerce และพันธมิตรร้านค้า
> **สถานะ: หยุดการใช้งานชั่วคราว (Paused)**  
> โค้ดของโมดูล E-Commerce (`product.routes.ts`, `partner.routes.ts`, `orders`, `carts`) ยังคงถูกเก็บไว้เป็น Legacy Reference แต่ไม่ได้เป็น Business Logic หลักในการดำเนินงานปัจจุบัน

---

## 5. ตารางฐานข้อมูลหลัก (Core Database Tables Summary)

1. **`users` / `user_permissions` / `features`:** จัดเก็บข้อมูลผู้ใช้งานระบบและสิทธิ์การเข้าถึง
2. **`customers` / `customer_locations` / `customer_work_info`:** ข้อมูลลูกค้าและสถานที่ทำงาน
3. **`membership_applications` / `membership_application_versions`:** ข้อมูลคำขอสมัครสมาชิกและ Version Snapshots
4. **`membership_tiers` / `membership_assessments` / `membership_decisions`:** การประเมินระดับสมาชิกและผลอนุมัติวงเงิน
5. **`credit_score_evaluations` / `scoring_rules` / `rule_override_logs`:** บันทึกคะแนนเครดิต 1,000 คะแนน, กฎประเมิน, และประวัติ Maker-Checker Override
6. **`credit_accounts` / `membership_cards` / `card_limits` / `credit_ledger`:** บัญชีวงเงินสินเชื่อ, บัตรสมาชิก, เพดานวงเงินคู่ขนาน (Cash & Purchase), และบัญชีแยกประเภท
7. **`customer_cib_profiles` / `customer_cib_debts`:** ประวัติและภาระหนี้ CIB แบบ Point-in-time Snapshot
8. **`loan_applications` / `loan_contract` / `loan_approval_logs`:** คำขอกู้ สัญญา และประวัติอนุมัติ
9. **`repayment_schedules` / `repayments` / `payment_transactions`:** ตารางผ่อนชำระและการชำระเงิน
10. **`audit_logs` / `notifications`:** บันทึกการทำงานของระบบและการแจ้งเตือน
11. **`partners` / `products` / `orders` / `carts`:** *(Legacy/Paused)* ข้อมูลร้านค้าและสินค้า

---

## 6. เส้นทาง API หลัก (Main API Endpoints)

* **`/api/auth`**: การยืนยันตัวตน (`/login`, `/refresh`, `/logout`)
* **`/api/users` / `/api/permissions`**: จัดการผู้ใช้งานและสิทธิ์
* **`/api/membership`**: ระบบสมัครสมาชิกขอวงเงิน (`/staff-apply`, `/public-apply`, `/applications`, `/assess`, `/decide`)
* **`/api/membership-cards`**: ระบบบัตรสมาชิก (`/issue`, `/limits`, `/freeze`, `/unfreeze`, `/review`)
* **`/api/credit-scoring`**: ระบบประเมินคะแนน 1,000 คะแนนและจำลองวงเงิน (`/evaluate`, `/simulate-limit`)
* **`/api/membership-purposes`**: รายการวัตถุประสงค์การขอวงเงิน
* **`/api/customer` / `/api/customer-locations` / `/api/customer-cib`**: ข้อมูลลูกค้า ที่อยู่ และ CIB Profile Snapshot

* **`/api/loan-application`**: คำขอสินเชื่อและการประเมิน
* **`/api/loan-contract` / `/api/loan-restructure`**: สร้างสัญญาเงินกู้และการปรับโครงสร้างหนี้
* **`/api/repayments`**: คำนวณตารางชำระและรับชำระเงิน
* **`/api/otp`**: ส่งและตรวจสอบรหัส OTP SMS
* **`/api/pdf`**: สร้างเอกสารสัญญา PDF
* **`/api/dashboard` / `/api/reports` / `/api/admin`**: แดชบอร์ด รายงาน และระบบผู้ดูแล

---

## 7. ข้อกำหนดความปลอดภัยและการพัฒนา (Security & Engineering Guidelines)

1. **Data Security & Privacy:** เข้ารหัสข้อมูลสำคัญ (PII), ห้ามบันทึก OTP หรือข้อมูลส่วนตัวลงใน Logs
2. **Database Transactions:** งานด้านการเงิน/คำขอสิทธิ์ ต้องใช้ `sequelize.transaction()` เพื่อรักษาความสมบูรณ์ของข้อมูล
3. **API Design Standard:** รูปแบบ JSON ตอบกลับมาตรฐาน
   ```json
   {
     "success": true,
     "message": "OK",
     "data": {}
   }
   ```
4. **Backward Compatibility:** รักษาความคงที่ของ Response Fields เพื่อป้องกันแอปพลิเคชันขัดข้อง
5. **Caching & Invalidation Strategy:** ใช้ Redis Cache สำหรับข้อมูลที่มีการดึงบ่อย และล้าง Cache ด้วย `redisService.delByPattern` เมื่อมี Mutation

---

## 8. การติดตั้งและการใช้งาน (Installation & Commands)

```bash
# ติดตั้ง dependencies
npm install

# รันระบบในโหมดพัฒนา (Development)
npm run dev

# คอมไพล์โปรเจกต์ TypeScript เป็น JavaScript
npm run build

# เริ่มทำงานระบบโหมด Production
npm run start

# ทดสอบระบบ SOAP & OTP Integration
npm run test:soap:all
npm run test:otp:all
```
