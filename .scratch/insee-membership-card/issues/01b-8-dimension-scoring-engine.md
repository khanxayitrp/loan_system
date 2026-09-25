# 01-B: 8-Dimension 1,000-Point Scoring Engine & Risk Grade Evaluation

**What to build:** A pure, deterministic calculation engine that ingests the 8 credit risk dimensions for eligible applicants, computes individual dimension scores totaling up to 1,000 points, maps the total score to a standardized Risk Grade (`A1` to `D`), and enforces the policy score floor (< 550 points triggers auto-decline `REJECT_CREDIT_SCORE_BELOW_THRESHOLD`).

**Blocked by:** `01-A: Hard Knockout & CIB Eligibility Policy Gate`

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] 8-dimension scoring engine implemented following the locked contract table totaling exactly 1,000 points.
- [ ] Dimension scores and total score constrained strictly to $[0, 1000]$.
- [ ] Risk grade mapping table evaluates all 8 tiers (`A1`, `A2`, `A3`, `B1`, `B2`, `C1`, `C2`, `D`).
- [ ] Total score $< 550$ (Grades C2 and D) triggers `isEligible = false`, `decision = 'AUTO_DECLINE'`, `decline_reason = 'REJECT_CREDIT_SCORE_BELOW_THRESHOLD'`.
- [ ] Total score $\ge 550$ (Grades C1, B2, B1, A3, A2, A1) triggers `isEligible = true`, `decision = 'APPROVED'`.
- [ ] Dimension breakdown output object includes individual points for all 8 dimensions with zero-loss precision.
- [ ] Unit and boundary tests cover exact score transitions (549 vs 550, 779 vs 780, 849 vs 850) and missing data fallback rules.

---

## Locked 8-Dimension Scoring Contract (Model Version: `v1.0.0`)

| Dimension ID & Name | Max Pts | Input Variables | Calculation & Binning Rules | Boundary / Thresholds | Missing Data Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **D1: Income & Employment Stability** | **200** | `employmentTenureMonths`<br>`employmentType` | • Tenure $>36$ mo: 140 pts<br>• $12-36$ mo: 100 pts<br>• $6-12$ mo: 60 pts<br>• $<6$ mo: 25 pts<br>• Permanent salaried: +60 pts<br>• Fixed contract: +30 pts<br>• Self-employed: +20 pts | Max 200 pts | If missing, default tenure = 0, self-employed (45 pts) |
| **D2: CIB Repayment History** | **200** | `cibMaxDpdLast12Months`<br>`cibHistoricalDelinquencyCount` | • 0 DPD: 200 pts<br>• 1–30 DPD (1 time): 130 pts<br>• 1–30 DPD (>1 time): 90 pts<br>• 31–60 DPD: 50 pts<br>• 61–90 DPD: 0 pts | Max 200 pts | If bureau empty with no record: 100 pts (Neutral default) |
| **D3: Debt-to-Income (DTI) & Leverage** | **150** | `monthlyIncomeLak`<br>`cibActiveDebtsMonthlyPayment` | Calculated $\text{DTI} = \frac{\text{DebtService}}{\text{MonthlyIncome}}$<br>• $\text{DTI} < 30\%$: 150 pts<br>• $30\% \le \text{DTI} < 45\%$: 110 pts<br>• $45\% \le \text{DTI} < 60\%$: 60 pts<br>• $\text{DTI} \ge 60\%$: 0 pts | Max 150 pts | Income $\le 0$ rejected by validation |
| **D4: Residential & Collateral Stability** | **100** | `residentialStatus`<br>`residenceYears` | • Owned (with title/free): 100 pts<br>• Mortgaged / Family home: 70 pts<br>• Rented $>2$ yrs: 50 pts<br>• Rented $<1$ yr: 20 pts | Max 100 pts | Default to Rented $<1$ yr (20 pts) |
| **D5: Internal INSEE Track Record** | **150** | `inseeHistoryMonths`<br>`inseeLateCount` | • Clean $>12$ mo: 150 pts<br>• Clean $6-12$ mo: 110 pts<br>• Clean $<6$ mo: 90 pts<br>• New to INSEE: 80 pts (Neutral)<br>• Past late $1-30$ DPD: 30 pts<br>• Past late $>30$ DPD: 0 pts | Max 150 pts | New customer defaults to 80 pts |
| **D6: Behavioral & Transaction Velocity** | **80** | `appLoginFrequency`<br>`isBiometricVerified`<br>`profileCompletenessPct` | • Biometric KYC verified: +40 pts<br>• Profile complete $\ge 90\%$: +25 pts<br>• Regular app engagement: +15 pts | Max 80 pts | Default unverified = 0 pts |
| **D7: Demographic & Dependency Burden** | **60** | `numberOfDependents`<br>`applicantAge` | • 0 dependents: 35 pts<br>• 1 dependent: 30 pts<br>• 2 dependents: 20 pts<br>• $\ge 3$ dependents: 10 pts<br>• Age $25-55$: +25 pts (Others: +15 pts) | Max 60 pts | Default 2 dependents, age in range = 45 pts |
| **D8: Emergency Liquidity Buffer** | **60** | `liquidSavingsLak`<br>`monthlyIncomeLak` | Months of buffer = $\frac{\text{Savings}}{\text{Income}}$<br>• Buffer $\ge 3$ months: 60 pts<br>• Buffer $1-3$ months: 40 pts<br>• Buffer $<1$ month: 15 pts<br>• No savings: 0 pts | Max 60 pts | Default 0 pts |
| **TOTAL** | **1,000** | | $\sum (D1 + D2 + \dots + D8)$ | **Max 1,000 pts** | |

---

## Risk Grade Mapping Table & Action Matrix

| Score Range | Risk Grade | Description | Eligibility Decision | Reason Code | Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **850 – 1000** | **A1** | Prime Super Elite | `APPROVED` | `None` | Proceeds to Ticket 02 Limit Sizing |
| **780 – 849** | **A2** | Prime High | `APPROVED` | `None` | Proceeds to Ticket 02 Limit Sizing |
| **720 – 779** | **A3** | Prime Standard | `APPROVED` | `None` | Proceeds to Ticket 02 Limit Sizing |
| **660 – 719** | **B1** | Near Prime High | `APPROVED` | `None` | Proceeds to Ticket 02 Limit Sizing |
| **600 – 659** | **B2** | Near Prime Standard | `APPROVED` | `None` | Proceeds to Ticket 02 Limit Sizing |
| **550 – 599** | **C1** | Subprime Low Risk | `APPROVED` | `None` | Proceeds to Ticket 02 Limit Sizing |
| **500 – 549** | **C2** | Subprime High Risk | `AUTO_DECLINE` | `REJECT_CREDIT_SCORE_BELOW_THRESHOLD` | Gated, no credit line granted |
| **0 – 499** | **D** | Deep Subprime | `AUTO_DECLINE` | `REJECT_CREDIT_SCORE_BELOW_THRESHOLD` | Gated, no credit line granted |

---

## Domain Engine Design

* **File:** `src/services/credit-scoring-engine.service.ts`
* **Interface / Methods:**
  ```typescript
  export interface CreditScoringInput {
    employmentTenureMonths: number;
    employmentType: 'PERMANENT_SALARIED' | 'FIXED_CONTRACT' | 'SELF_EMPLOYED';
    monthlyIncomeLak: number;
    cibMaxDpdLast12Months: number;
    cibHistoricalDelinquencyCount?: number;
    cibActiveDebtsMonthlyPayment: number;
    residentialStatus: 'OWNED' | 'MORTGAGED' | 'RENTED_OVER_2YR' | 'RENTED_UNDER_1YR';
    inseeHistoryMonths?: number;
    inseeLateCount?: number;
    appLoginFrequency?: number;
    isBiometricVerified?: boolean;
    profileCompletenessPct?: number;
    numberOfDependents: number;
    applicantAge: number;
    liquidSavingsLak?: number;
  }

  export interface DimensionBreakdown {
    d1_income_employment: number;
    d2_cib_repayment: number;
    d3_dti_leverage: number;
    d4_residential: number;
    d5_insee_track_record: number;
    d6_behavioral: number;
    d7_demographic: number;
    d8_liquidity_buffer: number;
  }

  export interface CreditScoringEvaluationResult {
    totalScore: number;
    riskGrade: 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'C1' | 'C2' | 'D';
    isEligible: boolean;
    decision: 'APPROVED' | 'AUTO_DECLINE';
    declineReason?: string;
    dimensionBreakdown: DimensionBreakdown;
    modelVersion: string; // 'v1.0.0'
  }

  export class CreditScoringEngineService {
    calculateScore(input: CreditScoringInput): CreditScoringEvaluationResult;
    evaluateRiskGrade(totalScore: number): 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'C1' | 'C2' | 'D';
  }
  ```

---

## Boundary & Unit Tests
1. **`test_boundary_549_vs_550`**:
   * Input calibrated to produce 549 pts: Assert `riskGrade = 'C2'`, `isEligible = false`, `decision = 'AUTO_DECLINE'`, `declineReason = 'REJECT_CREDIT_SCORE_BELOW_THRESHOLD'`.
   * Input calibrated to produce 550 pts: Assert `riskGrade = 'C1'`, `isEligible = true`, `decision = 'APPROVED'`, `declineReason = undefined`.
2. **`test_boundary_779_vs_780`**:
   * Input yielding 779: Grade `A3`.
   * Input yielding 780: Grade `A2`.
3. **`test_boundary_849_vs_850`**:
   * Input yielding 849: Grade `A2`.
   * Input yielding 850: Grade `A1`.
4. **`test_all_max_scores`**:
   * All dimensions at maximum ceiling: Assert `totalScore = 1000`, `riskGrade = 'A1'`.
5. **`test_all_min_scores`**:
   * Worst eligible profile: Assert `totalScore` bounded $\ge 0$, Grade `D`.
