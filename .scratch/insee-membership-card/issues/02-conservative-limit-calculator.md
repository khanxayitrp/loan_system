# 02: Conservative Limit Calculator with Annuity Capacity & DTI Auto-Downgrade

## Context
Pursuant to [ADR 0003](file:///Users/inseemicrofinance02/loan_system/docs/adr/0003-insee-membership-card-engine-and-risk-architecture.md), microfinance revolving credit exposure requires rigorous downside risk protection. Rather than using simple income multipliers, INSEE utilizes a multi-constraint **Conservative MIN Rule**, integrating actuarial annuity discounting for debt capacity. Furthermore, all Day-1 applicants are restricted to **Silver Tier**, and applicants exceeding a tier's DTI ceiling are subject to an **Auto-Downgrade Mechanism** rather than being declined outright.

## Objective
Implement the Conservative Limit Calculator domain service and API that computes the approved revolving credit limit by evaluating five concurrent ceiling constraints, enforces Day-1 Silver Tier gating, applies DTI-based tier auto-downgrades, and persists the calculation breakdown.

## Business Rules
1. **The Conservative MIN Rule:**
   $$ApprovedLimit = \min(L_{requested}, L_{tier\_cap}, L_{capacity}, L_{risk}, L_{reg\_cap})$$
   * $L_{requested}$: Amount requested by the applicant.
   * $L_{tier\_cap}$: Ceiling dictated by the target Membership Tier:
     * Silver: 5,000,000 LAK
     * Gold: 15,000,000 LAK
     * Platinum: 30,000,000 LAK
     * Diamond: 50,000,000 LAK
     * VIP: 100,000,000 LAK
   * **Day-1 Origination Gating**: For new membership card applications, the initial tier is capped at **Silver** ($L_{tier\_cap} = 5,000,000$ LAK), regardless of score. Higher tiers can only be unlocked via subsequent periodic reviews (Ticket 06) or privileged Maker-Checker override (Ticket 07 / Rule R018).
   * $L_{capacity}$ (Annuity Capacity):
     $$L_{capacity} = \frac{\max(0, \text{MonthlyNetIncome} \times DTI_{max} - \text{ExistingMonthlyDebtService})}{\text{MonthlyAnnuityFactor}(r, n)}$$
     where:
     * $\text{MonthlyAnnuityFactor}(r, n) = \frac{r(1+r)^n}{(1+r)^n - 1}$
     * Default stress parameters: $r = 1.75\%$ per month (21% APR), tenor $n = 24$ months.
   * $L_{risk}$: Ceiling by Risk Grade:
     * A1: 100,000,000 LAK | A2: 50,000,000 LAK | A3: 30,000,000 LAK
     * B1: 20,000,000 LAK | B2: 12,000,000 LAK
     * C1: 5,000,000 LAK
     * C2, D: 0 LAK (Not eligible)
   * $L_{reg\_cap}$: Statutory microfinance unsecured line cap = 100,000,000 LAK.
2. **DTI Auto-Downgrade Mechanism:**
   * Each tier has a maximum allowable DTI threshold:
     * VIP / Diamond: Max DTI 40%
     * Platinum / Gold: Max DTI 45%
     * Silver: Max DTI 50%
   * If an applicant's calculated DTI exceeds the ceiling of their candidate tier, the engine does **not** decline the application; it automatically steps down the tier to the next lower tier until DTI satisfies the threshold or down to Silver. If even Silver DTI > 50%, $L_{capacity}$ drops to 0 or triggers decline.
3. **Rounding Invariant:**
   * Final approved limit must be rounded down to the nearest 100,000 LAK step.
   * Minimum viable approved card limit is 1,000,000 LAK. If $ApprovedLimit < 1,000,000$ LAK, result is `DECLINED_INSUFFICIENT_CAPACITY`.

## Scope
* **In Scope:**
  * Calculation service implementing the 5-constraint MIN rule.
  * Annuity factor discounting formula.
  * DTI calculation and tier auto-downgrade step down.
  * Day-1 Silver Tier constraint enforcement.
  * REST API endpoint `POST /api/v1/credit/limits/calculate`.
  * Integration test matrix verifying every constraint becoming the active binding minimum.
* **Out of Scope:**
  * Card balance tracking & split into Cash/Purchase limit (handled in Ticket 03).
  * Manual override by management (handled in Ticket 07).

## Database / Schema
Enhance or verify tables:
* `membership_assessments` or `credit_limit_applications`:
  * `id`: BIGINT PK AUTO_INCREMENT
  * `assessment_id`: BIGINT NOT NULL (FK to `credit_assessments`)
  * `requested_amount`: DECIMAL(15,2) NOT NULL
  * `calculated_dti`: DECIMAL(5,2) NOT NULL
  * `assigned_tier`: ENUM('SILVER','GOLD','PLATINUM','DIAMOND','VIP') NOT NULL
  * `downgraded_from_tier`: VARCHAR(20) NULL
  * `limit_requested_cap`: DECIMAL(15,2) NOT NULL
  * `limit_tier_cap`: DECIMAL(15,2) NOT NULL
  * `limit_capacity_cap`: DECIMAL(15,2) NOT NULL
  * `limit_risk_cap`: DECIMAL(15,2) NOT NULL
  * `limit_reg_cap`: DECIMAL(15,2) NOT NULL
  * `binding_constraint`: VARCHAR(50) NOT NULL
  * `final_approved_limit`: DECIMAL(15,2) NOT NULL
  * `created_at`, `updated_at`: DATETIME NOT NULL

## Domain Service
* **Service Class:** `ConservativeLimitCalculatorService` (`src/services/conservative-limit-calculator.service.ts`)
  * `calculateApprovedLimit(assessmentId: number, requestDto: LimitCalculationInputDto): Promise<LimitCalculationResult>`
  * `computeAnnuityCapacity(monthlyIncome: number, existingDebts: number, maxDti: number, r: number, n: number): number`
  * `evaluateDtiAndResolveTier(candidateTier: MembershipTier, dti: number, isDay1: boolean): { effectiveTier: MembershipTier, downgraded: boolean }`

## API Contract
* **Endpoint:** `POST /api/v1/credit/limits/calculate`
* **Request Body:**
```json
{
  "assessmentId": 9012,
  "requestedAmountLak": 10000000,
  "monthlyIncomeLak": 8500000,
  "existingMonthlyDebtLak": 1200000,
  "isDay1Application": true
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "calculationId": 401,
    "assessmentId": 9012,
    "riskGrade": "A3",
    "effectiveTier": "SILVER",
    "tierDowngraded": false,
    "calculatedDtiPercent": 14.12,
    "constraints": {
      "requestedAmount": 10000000,
      "tierCap": 5000000,
      "annuityCapacityCap": 15600000,
      "riskGradeCap": 30000000,
      "regulatoryCap": 100000000
    },
    "bindingConstraint": "TIER_CAP_DAY1_SILVER",
    "finalApprovedLimitLak": 5000000,
    "minimumLimitMet": true
  }
}
```

## Validation Rules
* `requestedAmountLak` must be positive and in increments of 100,000 LAK.
* `assessmentId` must refer to an eligible assessment (`is_eligible = true`).

## Error Cases
* `ASSESSMENT_NOT_ELIGIBLE` (422): Attempting to calculate limit for assessment with score < 550.
* `INSUFFICIENT_DEBT_CAPACITY` (422): When calculated $ApprovedLimit < 1,000,000$ LAK.
* `INVALID_ASSESSMENT_ID` (404): Assessment record does not exist.

## Idempotency
* Calling limit calculation with same `assessmentId` and parameters yields reproducible deterministic output.

## Concurrency Rules
* Database read locks on assessment record to prevent concurrent alteration during limit computation.

## Audit Requirements
* Store all 5 constraint values, the active binding constraint name, and any tier downgrade step in `membership_assessments`.

## Integration Tests
* `test_limit_binding_tier_cap_day1`: High income, Grade A1, requested 20M LAK -> Capped at 5M LAK by Day-1 Silver rule.
* `test_limit_binding_capacity_high_debt`: Monthly income 5M LAK, existing debt 2.1M LAK -> Capacity is binding constraint below tier cap.
* `test_limit_binding_requested_amount`: Customer requests 3M LAK with high capacity -> Binding constraint is `REQUESTED_AMOUNT`.
* `test_limit_dti_auto_downgrade`: Test scenario where applicant DTI exceeds Gold limit (45%) but satisfies Silver (50%), confirming auto-downgrade to Silver instead of decline.
* `test_limit_below_minimum_decline`: Capacity allows only 600,000 LAK (< 1M LAK threshold) -> Decline with `INSUFFICIENT_DEBT_CAPACITY`.

## Acceptance Criteria
- [ ] Conservative MIN calculation faithfully evaluates all 5 constraints.
- [ ] Annuity discounting formula properly calibrated ($r = 1.75\%$, $n = 24$).
- [ ] Day-1 Silver Tier cap (5,000,000 LAK) strictly enforced.
- [ ] DTI auto-downgrade steps down tier gracefully.
- [ ] Approved limit rounded down to 100,000 LAK increments.
- [ ] Full constraint diagnostics recorded in database.

## Dependencies
* **Blocked by:** Ticket 01-C (`01c-credit-assessment-intake-api.md`).
* **Blocks:** Ticket 03 (`03-membership-card-dual-limit.md`).
* **Cross-cutting Governance:** Overridden via Ticket 07 (`07-maker-checker-r018.md`) if privileged limit exception is approved.

## Definition of Done
* Service and Controller implemented in TypeScript.
* Database tables and migration scripts in place.
* 100% of boundary test cases for the 5 constraints pass cleanly.
