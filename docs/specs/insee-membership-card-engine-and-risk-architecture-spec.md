# Technical Specification: INSEE Membership Card Decision Engine & Risk Control Architecture

**Status:** Ready for Implementation  
**Triage Label:** `ready-for-agent`  
**Referenced Standards & ADRs:**
- Domain Glossary (`docs/glossary.md`)
- ADR 0001: 2-Tier Membership Origination Approval Workflow & Dual-Mode Credit Account (`docs/adr/0001-membership-workflow-and-credit-origination.md`)
- ADR 0002: Customer-Centric CIB Profile and Debt Snapshot Architecture (`docs/adr/0002-customer-centric-cib-architecture.md`)
- ADR 0003: INSEE Membership Card Decision Engine & Risk Control Architecture (`docs/adr/0003-insee-membership-card-engine-and-risk-architecture.md`)
- Source Logic: `INSEEMembershipCardLogicBusinessModel.xlsx` (Summary of 8 Sheets & Section 13 Clarifications)

---

## Problem Statement

Historically, the platform functioned primarily as a single-item loan / BNPL origination tool and later introduced a general membership application workflow. However, it lacks a dedicated, enterprise-grade **Revolving Credit Card Decision Engine** and comprehensive risk management controls. Specifically:

1. **Lack of Multi-Dimensional Credit Scoring:** Credit evaluation currently relies on ad-hoc staff assessment without a standardized, weighted scoring engine (0–1,000 points) across financial stability, DTI, repayment history, account conduct, and behavioral patterns.
2. **Missing Dual-Limit Sub-allocation:** Standard loans disburse a single lump sum. A revolving membership card requires strict separation between **Purchase Limits** (merchant/partner ecosystem transactions) and **Cash Withdrawal Limits** (emergency cash capped at 20%–30%) to control liquidity and credit risk.
3. **Absence of Conservative Limit Calculation:** There is no automated formula preventing over-indebtedness by taking the conservative minimum of requested limit, tier cap, income-based capacity (annuity present value), risk-adjusted capacity, and regulatory ceiling.
4. **No Automated Delinquency Enforcement State Machine:** When members fall delinquent, the platform lacks granular operational states (e.g. DPD 1–7 Watch, DPD 8–30 Freeze Cash while permitting Purchase, DPD >30 Freeze Entire Card, and Auto-Unfreeze upon full cure).
5. **No Structured Periodic Re-scoring & Upgrade Mechanism:** There is no automated batch evaluation lifecycle (3-month cycles for Silver/Gold, 6-month cycles for Platinum/Diamond/VIP) that safely awards progressive limit increases (+15%–25%) while enforcing on-time payment and DPD guardrails.
6. **Maker-Checker Exception Governance:** Manual policy overrides currently lack structured reason codes, audit trail logging, and strict two-person (Maker-Checker) segregation of duties.

---

## Solution

Implement the complete **INSEE Membership Card Engine & Risk Control Architecture** as a central revolving credit platform:

1. **Credit Scoring Engine (1,000 Points Model):**
   - Implements 8 evaluation dimensions totaling 1,000 points: Income & Stability (20%), DTI (20%), Repayment History (20%), Account Conduct (10%), Employment Stability (10%), Card Behavior (10%), KYC/AML (5%), and Relationship/Assets (5%).
   - Maps scores into 6 Risk Grades: A1 (875–1,000), A2 (800–874), B1 (725–799), B2 (650–724), C (550–649), and D (<550 - Auto-Decline/Exception).
2. **Approved Limit Calculator (Conservative MIN Rule):**
   - Computes `Approved Limit = MIN(Requested Limit, Tier Cap, Income-based Limit, Risk-based Limit, Regulatory Cap)`.
   - Incorporates annuity amortization formula: `Income-based Limit = Available Monthly Capacity × (1 - (1 + Monthly Rate)^(-Tenor)) / Monthly Rate`.
   - Stores parameters (`Tenor = 24`, `Monthly Rate = 1.89%`, DTI thresholds) in database system configuration.
3. **Tier Gating & DTI Auto-Downgrade:**
   - Enforces **Silver Tier** default for all new applicants (`membership_age = 0`) to manage initial probation risk.
   - Automatically downgrades high-scoring applicants to the highest tier whose maximum DTI constraint they satisfy (e.g., if DTI is 42%, downgrade from Platinum to Silver rather than rejecting).
4. **Single Ledger, Dual Caps (Purchase vs Cash):**
   - Single credit account controlling two dynamic caps: `total_balance <= approved_limit` and `cash_balance <= cash_limit`.
   - Initial cash limit allocated at 20% for new members, expandable up to 25% (Gold) and 30% (Platinum/Diamond/VIP).
   - **Repayment Waterfall:** Repayments prioritize clearing higher-interest debt (Cash balance) before lower-interest debt (Purchase balance).
5. **Delinquency State Machine (DPD Enforcement):**
   - `DPD 1–7`: `Watch` status, suspends limit increase eligibility.
   - `DPD 8–30`: `Freeze Cash` status, completely blocks cash withdrawals while allowing partner purchase transactions.
   - `DPD > 30` or Fraud Alert: `Freeze Card` status, completely suspends card operations and escalates to Collections.
   - **Auto-Unfreeze:** Automatically restores normal status when overdue balance is paid in full (DPD returns to 0), retaining limit increase suspension until next review.
6. **Automated Batch Monitoring & Progressive Upgrade:**
   - Periodic re-scoring jobs run every 3 months (Silver/Gold) and 6 months (Platinum/Diamond/VIP).
   - **Zero-touch Auto-Upgrade:** Automatically applies policy step limit increases (+15%–25%) and max 1 tier upgrade for clean accounts satisfying on-time payment and utilization requirements.
   - Escalates Black/VIP upgrades and exception cases to Credit Committee.
7. **Maker-Checker Manual Override Governance:**
   - Requires independent Maker and Checker roles for any rule override (Rule R018).
   - Captures Reason Code, justification text, and immutable audit logs.

---

## User Stories

1. As a credit analyst, I want the system to calculate an applicant's credit score out of 1,000 points across 8 predefined dimensions, so that risk grading is objective and reproducible.
2. As a credit analyst, I want the system to reject applicants with a score below 550 automatically, so that high-risk applicants do not consume unnecessary underwriting bandwidth.
3. As a credit analyst, I want the system to calculate the income-based credit limit using the standard annuity present-value formula, so that approved limits strictly respect monthly debt servicing capacity.
4. As a risk manager, I want the system to take the minimum of requested limit, tier cap, income capacity, risk-based limit, and regulatory ceiling, so that over-extension of credit is systematically prevented.
5. As a risk manager, I want all new approved applicants to be assigned the Silver Tier on day one regardless of score, so that they prove repayment conduct before gaining access to larger tier caps.
6. As an underwriter, I want the system to auto-downgrade an applicant whose DTI exceeds their score-based tier cap to the highest tier they qualify for, so that creditworthy customers are not unfairly rejected.
7. As a cardholder, I want to use my membership card to make purchases at partner merchants up to my purchase limit, so that I can conveniently purchase goods and services.
8. As a cardholder, I want to withdraw cash up to my cash sub-limit (20%–30%), so that I have emergency liquidity when needed.
9. As a core banking operator, I want purchase and cash balances to be managed under a single credit account with dual sub-caps, so that accounting reconciliations remain clean and balanced.
10. As a financial controller, I want repayments to automatically clear cash debt first before purchase debt, so that customer interest accruals follow the regulatory and policy waterfall.
11. As a risk officer, I want accounts with 1–7 days past due to be flagged as 'Watch' and have limit increases blocked, so that early delinquency is caught immediately.
12. As a risk officer, I want accounts with 8–30 days past due to have cash withdrawals frozen while allowing partner purchases, so that cash bleeding is stopped without disrupting essential retail transactions.
13. As a risk officer, I want accounts with more than 30 days past due to have the entire card frozen, so that exposure is contained and debt recovery can begin.
14. As a customer whose card was frozen for late payment, I want my card to be automatically un-frozen as soon as I clear my overdue balance, so that I can resume using my card without waiting for manual staff intervention.
15. As a risk analyst, I want the system to run scheduled batch re-scores every 3 months for Silver and Gold members, so that limits and tiers reflect their recent conduct.
16. As an eligible member with 100% on-time payments, I want the system to automatically upgrade my tier by one level and increase my limit by 15%–25%, so that good credit behavior is promptly rewarded without paper applications.
17. As a branch manager, I want any manual rule override (e.g. R018) to require approval from an independent checker, so that no single employee can unilaterally bypass credit limits.
18. As an internal auditor, I want all manual overrides to store an immutable reason code, maker ID, checker ID, and timestamp, so that all policy exceptions can be audited.
19. As a systems administrator, I want interest rate, tenor, and DTI parameters to be configurable in database tables, so that the risk team can adjust policy parameters without requiring code deployments.
20. As a mobile app user, I want to view my approved limit, remaining purchase limit, and remaining cash limit separately in real time, so that I never exceed my allocated caps.

---

## Implementation Decisions

### 1. Modules and Boundaries

- **`CreditScoringEngine` (`src/services/credit-scoring.service.ts`):**
  - Pure evaluation module calculating scores (0–1,000) and risk grade (`A1` through `D`).
  - Inputs: Customer financial data, CIB profile liabilities, employment info, payment history metrics, and account conduct flags.
- **`LimitCalculatorService` (`src/services/limit-calculator.service.ts`):**
  - Implements Conservative MIN Rule: `MIN(requested, tier_cap, income_limit, risk_limit, reg_cap)`.
  - Implements annuity calculation using database-configured `monthly_rate` and `tenor_months`.
  - Implements DTI Tier Conflict Resolution (`autoDowngradeTier`).
- **`MembershipCardService` (`src/services/membership-card.service.ts`):**
  - Manages card issuance, dual-limit allocation (`cash_limit_amount`, `purchase_limit_amount`), transaction simulation, and balance updates.
- **`CardRiskControlService` (`src/services/card-risk-control.service.ts`):**
  - State machine transitions based on DPD: `NORMAL`, `WATCH`, `FREEZE_CASH`, `FREEZE_CARD`.
  - Evaluates transactions against MCC allowlists, blocked transaction types, and freeze states.
  - Implements `autoUnfreeze` upon successful reconciliation of overdue amounts.
- **`BatchReScoreService` (`src/services/batch-rescore.service.ts`):**
  - Cron-driven batch job identifying members due for 3-month or 6-month evaluation.
  - Evaluates progressive upgrade eligibility: 100% on-time payment, DPD = 0, utilization between 30%–80%, affordability refresh.
  - Executes Zero-touch Auto-Upgrade (max +1 tier, +15%–25% limit step) or routes to Credit Committee.

### 2. Prototype Data Structures & State Machine

```typescript
// Risk Grades and Score Mapping
export enum RiskGrade {
  A1 = 'A1', // 875 - 1000 pts (Black / VIP)
  A2 = 'A2', // 800 - 874 pts (Diamond)
  B1 = 'B1', // 725 - 799 pts (Platinum)
  B2 = 'B2', // 650 - 724 pts (Gold)
  C  = 'C',  // 550 - 649 pts (Silver)
  D  = 'D'   // < 550 pts (Decline)
}

// Delinquency Enforcement State Machine
export enum CardRiskStatus {
  NORMAL = 'NORMAL',
  WATCH = 'WATCH',               // DPD 1-7: Limit increase blocked
  FREEZE_CASH = 'FREEZE_CASH',   // DPD 8-30: Cash blocked, purchase permitted
  FREEZE_CARD = 'FREEZE_CARD',   // DPD >30 or Fraud: All blocked, collection
  CLOSED = 'CLOSED'
}

// Dual Limit Balances
export interface CardBalanceState {
  approvedLimit: number;
  totalOutstandingBalance: number;
  purchaseOutstandingBalance: number;
  cashOutstandingBalance: number;
  availablePurchaseLimit: number;
  availableCashLimit: number;
}
```

### 3. API Contracts

- **`POST /api/credit-scoring/evaluate`**:
  - Request: `{ customerId, applicationId, requestedLimit }`
  - Response: `{ totalScore, breakdown: { incomeScore, dtiScore, ... }, riskGrade, recommendedTier, calculatedLimit, autoDowngradeApplied }`
- **`POST /api/membership-cards/issue`**:
  - Request: `{ decisionId, customerId, approvedLimit, tierCode }`
  - Response: `{ cardId, cardNumberMasked, approvedLimit, purchaseLimit, cashLimit, status: 'NORMAL' }`
- **`POST /api/membership-cards/:cardId/authorize`**:
  - Request: `{ transactionType: 'PURCHASE' | 'CASH_WITHDRAWAL', amount, merchantCategoryCode }`
  - Response: `{ authorized: boolean, reason?: string, updatedBalances: CardBalanceState }`
- **`POST /api/membership-cards/:cardId/repay`**:
  - Request: `{ paymentAmount, paymentReference }`
  - Response: `{ clearedCashAmount, clearedPurchaseAmount, remainingBalance, unfreezeTriggered: boolean }`
- **`POST /api/membership-cards/batch-rescore`**:
  - Request: `{ asOfDate?: string }`
  - Response: `{ evaluatedCount, upgradedCount, downgradedCount, committeeReferralCount }`

---

## Testing Decisions

### 1. Seams and Boundaries
- **Primary Testing Seam:** **HTTP API Integration Boundary** via Supertest / Express app router.
  - Testing at the HTTP request/response seam verifies complete end-to-end orchestration: route validation, authentication, scoring evaluation, transaction rollback, and ledger updates.
- **Secondary Pure Domain Seam:** Unit tests for `CreditScoringEngine` and `LimitCalculatorService`.
  - Validates pure arithmetic edge cases: negative capacity, zero division, DTI boundary conditions (30%, 35%, 40%, 45%), and annuity discounting precision without database dependency.

### 2. Key Test Scenarios
- **Scoring Engine:** Verifies 1,000 points distribution across all 8 dimensions; verifies risk grade cutoffs.
- **Conservative MIN Rule:** Verifies that if `Income-based Limit < Tier Cap`, the income-based limit is chosen; if `Requested < Income-based`, requested is chosen.
- **New Member Onboarding Gating:** High-scoring new applicant is assigned Silver tier and initial limit capped at Silver max.
- **DTI Auto-Downgrade:** Platinum score with 42% DTI automatically downgrades to Silver (which allows <=45%).
- **Dual-Limit Authorization:** Purchase transaction succeeds if `<= availablePurchaseLimit`; Cash transaction rejects if `> availableCashLimit` even if total limit is available.
- **DPD State Enforcement:**
  - Cash withdrawal rejected when `status === FREEZE_CASH` (DPD 15).
  - Purchase succeeds when `status === FREEZE_CASH` (DPD 15).
  - Both rejected when `status === FREEZE_CARD` (DPD 35).
- **Auto-Unfreeze on Payment:** Full repayment sets DPD to 0 and transitions `FREEZE_CASH` / `FREEZE_CARD` to `NORMAL`.
- **Repayment Waterfall:** Partial payment of 1,500,000 LAK against 1,000,000 Cash debt and 2,000,000 Purchase debt completely clears Cash and reduces Purchase to 1,500,000.

---

## Out of Scope

1. **Card Embossing & Plastic Production:** Physical card manufacturing and courier logistics.
2. **VISA/Mastercard External Scheme Settlement:** System operates as a closed-loop proprietary ecosystem / partner network.
3. **E-Commerce Shopping Cart & Product Catalog:** Remains paused/deprecated as defined in System Development Document.

---

## Further Notes

- All parameters for scoring weights and limits are loaded through `system_configurations` to enable dynamic tuning by credit risk committees without code re-deployments.
- Rule override events (R018) require dual-signature (Maker-Checker) and produce tamper-evident audit logs.
