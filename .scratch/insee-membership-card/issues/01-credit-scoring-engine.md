# 01: Credit Scoring Engine & Risk Grade Evaluation (1,000 Points Model)

## Context
Under the INSEE Membership Card risk policy ([ADR 0003](file:///Users/inseemicrofinance02/loan_system/docs/adr/0003-insee-membership-card-engine-and-risk-architecture.md) & [Specification](file:///Users/inseemicrofinance02/loan_system/docs/specs/insee-membership-card-engine-and-risk-architecture-spec.md)), customer creditworthiness must be quantitatively assessed using an 8-dimensional weighted scoring model producing an exact integer score between 0 and 1,000 points. This score maps deterministically to a standardized Risk Grade (`A1` to `D`) and serves as the primary gating mechanism for card origination and credit line decisions.

## Objective
Implement an end-to-end Credit Scoring Engine that ingests customer profile, income, external CIB debts, INSEE historical behavior, and stability metrics, computes the 1,000-point score, assigns the appropriate Risk Grade, and persists the assessment snapshot with audit provenance.

## Business Rules
1. **Dimension Weights (Total 1,000 pts):**
   * **D1: Income & Employment Stability (200 pts / 20%)**: Employment tenure (<6 mo: 40, 6–12 mo: 80, 1–3 yr: 140, >3 yr: 200), occupation contract stability.
   * **D2: CIB Repayment History & Delinquency (200 pts / 20%)**: Historical DPD (0 DPD: 200, 1–30 DPD: 130, 31–60 DPD: 70, >60 DPD: 0).
   * **D3: Debt-to-Income (DTI) & Leverage (150 pts / 15%)**: Current DTI (<30%: 150, 30–45%: 110, 45–60%: 60, >60%: 0).
   * **D4: Residential & Collateral Stability (100 pts / 10%)**: Home ownership (Owned: 100, Mortgaged: 70, Rented >2 yr: 50, Rented <1 yr: 20).
   * **D5: Internal INSEE Payment Track Record (150 pts / 15%)**: Repeat customer on-time record (Clean >1 yr: 150, Clean 6–12 mo: 110, New to INSEE: 80, Past late: 30).
   * **D6: Behavioral & Transaction Velocity (80 pts / 8%)**: App usage, profile completion, biometric verification.
   * **D7: Demographic & Dependency Burden (60 pts / 6%)**: Number of dependents, age group stability.
   * **D8: Emergency Liquidity & Savings Buffer (60 pts / 6%)**: Bank statements / verifiable savings vs monthly obligations (>3 mo: 60, 1–3 mo: 40, <1 mo: 15).
2. **Risk Grade Mapping:**
   * `850 – 1000 pts`: **A1** (Prime Super Elite)
   * `780 – 849 pts`: **A2** (Prime High)
   * `720 – 779 pts`: **A3** (Prime Standard)
   * `660 – 719 pts`: **B1** (Near Prime High)
   * `600 – 659 pts`: **B2** (Near Prime Standard)
   * `550 – 599 pts`: **C1** (Subprime Low Risk)
   * `500 – 549 pts`: **C2** (Subprime High Risk - Below Threshold)
   * `< 500 pts`: **D** (Deep Subprime / Default Risk)
3. **Hard Policy Gating:**
   * If `Score < 550` (Grades C2 and D): Auto-Decline decision triggered with reason code `REJECT_CREDIT_SCORE_BELOW_THRESHOLD`.
   * If applicant has active CIB status `DPD > 90` or `WRITE_OFF`: Immediate override to Grade D with auto-decline `REJECT_ACTIVE_CIB_DEFAULT`.

## Scope
* **In Scope:**
  * Score calculation algorithm across all 8 dimensions.
  * Score-to-Grade mapping table lookup.
  * Persistence to `credit_assessments` and `credit_score_snapshots`.
  * REST API endpoint for evaluating or re-evaluating applicant scores.
  * Integration tests verifying exact boundary score points and decline decisions.
* **Out of Scope:**
  * Credit limit amount sizing (handled in Ticket 02).
  * Physical card issuance (handled in Ticket 03).

## Database / Schema
Enhance or verify tables:
* `credit_assessments`:
  * `id`: BIGINT PK AUTO_INCREMENT
  * `customer_id`: BIGINT NOT NULL
  * `application_id`: BIGINT NULL
  * `total_score`: INT NOT NULL (0–1000)
  * `risk_grade`: ENUM('A1','A2','A3','B1','B2','C1','C2','D') NOT NULL
  * `is_eligible`: BOOLEAN NOT NULL (true if total_score >= 550)
  * `dimension_scores`: JSON NOT NULL (Breakdown of D1 to D8 scores)
  * `decline_reason`: VARCHAR(100) NULL
  * `evaluated_at`: DATETIME NOT NULL
  * `created_at`, `updated_at`: DATETIME NOT NULL
* `credit_score_snapshots`:
  * Records point-in-time calculation inputs and factors for auditability.

## Domain Service
* **Service Class:** `CreditScoringEngineService` (`src/services/credit-scoring-engine.service.ts`)
  * `calculateScore(customerId: number, inputData: CreditScoringInputDto): Promise<CreditScoringResult>`
  * `evaluateRiskGrade(score: number): RiskGrade`
  * `validateHardKnockoutRules(cibProfile: CustomerCibProfile): KnockoutResult`

## API Contract
* **Endpoint:** `POST /api/v1/credit/assessments/score`
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "customerId": 1024,
  "applicationId": 501,
  "employmentTenureMonths": 24,
  "employmentType": "PERMANENT_SALARIED",
  "monthlyIncomeLak": 8500000,
  "cibMaxDpdLast12Months": 0,
  "cibActiveDebtsMonthlyPayment": 2100000,
  "residentialStatus": "OWNED",
  "inseeHistoryMonths": 18,
  "inseeLateCount": 0,
  "numberOfDependents": 1,
  "liquidSavingsLak": 15000000
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "assessmentId": 9012,
    "customerId": 1024,
    "totalScore": 765,
    "riskGrade": "A3",
    "isEligible": true,
    "dimensionBreakdown": {
      "incomeEmploymentScore": 140,
      "cibRepaymentScore": 200,
      "dtiLeverageScore": 110,
      "residentialScore": 100,
      "inseeTrackRecordScore": 110,
      "behavioralScore": 40,
      "demographicScore": 35,
      "liquidityScore": 30
    },
    "evaluatedAt": "2026-09-25T14:00:00.000Z"
  }
}
```
* **Auto-Decline Response (200 OK or 422 Unprocessable):**
```json
{
  "success": true,
  "data": {
    "assessmentId": 9013,
    "customerId": 1025,
    "totalScore": 510,
    "riskGrade": "C2",
    "isEligible": false,
    "declineReason": "REJECT_CREDIT_SCORE_BELOW_THRESHOLD",
    "dimensionBreakdown": { "..." : 0 },
    "evaluatedAt": "2026-09-25T14:05:00.000Z"
  }
}
```

## Validation Rules
* `monthlyIncomeLak` must be positive integer (> 0).
* `employmentTenureMonths` >= 0.
* Total score must be mathematically constrained strictly to `0 <= totalScore <= 1000`.

## Error Cases
* `CUSTOMER_NOT_FOUND` (404): Given `customerId` does not exist.
* `INVALID_SCORING_INPUT` (400): Negative income, invalid employment enum.
* `CIB_RECORD_MISSING` (400): If external CIB data is mandatory and missing.

## Idempotency
* Calling `/score` with identical input payload and `applicationId` updates or returns the existing active assessment for that application rather than duplicating rows.

## Concurrency Rules
* Evaluation is read-heavy on history and transactional on `credit_assessments` insert. Wrapped in standard DB transaction.

## Audit Requirements
* Store full raw input attributes and calculated dimension weights in `credit_score_snapshots` with actor ID and timestamp.

## Integration Tests
* `test_scoring_super_prime_a1`: Input top-tier profile, verify score in [850, 1000], grade A1, isEligible = true.
* `test_scoring_boundary_550_c1`: Input boundary metrics yielding exactly 550, verify grade C1, isEligible = true.
* `test_scoring_fail_549_c2`: Input boundary metrics yielding 549, verify grade C2, isEligible = false, reason `REJECT_CREDIT_SCORE_BELOW_THRESHOLD`.
* `test_scoring_cib_bad_debt_knockout`: Applicant with active DPD > 90, verify auto-decline regardless of income.

## Acceptance Criteria
- [ ] 8-dimension scoring algorithm implemented with exact policy weights totaling 1,000 pts.
- [ ] Score-to-Grade mapping table validates A1 through D correctly.
- [ ] Hard decline triggered for score < 550 or active CIB severe delinquency.
- [ ] Assessment and snapshot tables updated transactionally.
- [ ] API endpoint tested with >85% branch coverage.

## Dependencies
* **Sub-ticket Breakdown (Tracer Bullets):**
  * `01-A`: [Hard Knockout & CIB Eligibility Policy Gate](file:///Users/inseemicrofinance02/loan_system/.scratch/insee-membership-card/issues/01a-hard-knockout-cib-gate.md)
  * `01-B`: [8-Dimension 1,000-Point Scoring Engine & Risk Grade Evaluation](file:///Users/inseemicrofinance02/loan_system/.scratch/insee-membership-card/issues/01b-8-dimension-scoring-engine.md)
  * `01-C`: [Credit Assessment Intake API, Audit Snapshots & Idempotency](file:///Users/inseemicrofinance02/loan_system/.scratch/insee-membership-card/issues/01c-credit-assessment-intake-api.md)
* **Blocked by:** None (can start immediately).
* **Blocks:** Ticket 02 (`02-conservative-limit-calculator.md`), Ticket 07 (`07-maker-checker-r018.md`).

## Definition of Done
* Code written in TypeScript, clean architecture in `src/services/` and `src/controllers/`.
* Sequelize models and migrations finalized.
* Automated integration test suite running green.
