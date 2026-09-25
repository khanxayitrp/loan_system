# 01-A: Hard Knockout & CIB Eligibility Policy Gate

**What to build:** An applicant eligibility policy gate that evaluates external Credit Information Bureau (CIB) delinquency, write-offs, and critical debt burden prior to running credit scoring. If an applicant fails any hard knockout rule, the policy gate immediately marks the application as ineligible with decision `AUTO_DECLINE`, reason code `REJECT_ACTIVE_CIB_DEFAULT`, risk grade `D`, and `score = NULL` (no score calculated). It records the assessment outcome for audit provenance without running the heavy scoring engine, preventing confusion between a D-grade caused by low points vs a D-grade caused by a hard knockout.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] Hard Knockout policy service evaluates CIB delinquency (`DPD > 90`, `WRITE_OFF`, bankruptcy/litigation).
- [ ] Knockout decision sets: `is_eligible = false`, `decision = 'AUTO_DECLINE'`, `risk_grade = 'D'`, `total_score = NULL`, `decline_reason = 'REJECT_ACTIVE_CIB_DEFAULT'`.
- [ ] When knocked out, the 8-dimension scoring engine is short-circuited (no calculation performed, score remains `NULL`).
- [ ] Passed applicants are marked with `is_eligible = true`, `knockout_status = 'PASSED'` and proceed to full credit scoring.
- [ ] An assessment record is saved with full CIB factor inputs to preserve audit provenance for MFI regulators.
- [ ] Integration tests verify immediate decline for severe delinquency profiles.

---

## Detailed Policy & Business Rules

### 1. Hard Knockout Criteria Matrix
| Rule ID | Metric / Trigger | Condition | Resulting Decision | Reason Code | Risk Grade | Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **KO-CIB-01** | Max DPD Last 12 Months | $\ge 91$ DPD | AUTO_DECLINE | `REJECT_ACTIVE_CIB_DEFAULT` | `D` | `NULL` |
| **KO-CIB-02** | External Write-off / Bad Debt | Active write-off > 0 LAK | AUTO_DECLINE | `REJECT_ACTIVE_CIB_DEFAULT` | `D` | `NULL` |
| **KO-CIB-03** | Legal / Bankruptcy Flag | Active judgment or insolvency | AUTO_DECLINE | `REJECT_CIB_LEGAL_FLAG` | `D` | `NULL` |
| **KO-CIB-04** | CIB Record Unreachable/Mandatory Missing | Missing mandatory bureau consent | REJECT / ERROR | `REJECT_CIB_CONSENT_MISSING` | `D` | `NULL` |

### 2. Distinction Between Knockout Grade D vs Low Score Grade D
* **Knockout Grade D**: `total_score = NULL`, triggered by critical external credit risk (DPD > 90 or default). Never calls dimension scoring algorithm.
* **Low Score Grade D**: `total_score < 500`, computed through all 8 dimensions where applicant has clean CIB but insufficient income/stability points.

---

## Schema & Domain Model Requirements

### `credit_assessments` Table Enhancements
Ensure the following attributes support nullability and knockout reason codes:
* `total_score`: `INT NULL` (NULL indicates knocked out before scoring)
* `risk_grade`: `ENUM('A1','A2','A3','B1','B2','C1','C2','D') NOT NULL`
* `is_eligible`: `BOOLEAN NOT NULL`
* `decision`: `ENUM('APPROVED', 'AUTO_DECLINE', 'MANUAL_REVIEW') NOT NULL`
* `decline_reason`: `VARCHAR(100) NULL` (e.g. `REJECT_ACTIVE_CIB_DEFAULT`)
* `dimension_scores`: `JSON NULL` (NULL when knocked out)
* `knockout_details`: `JSON NULL` (Stores specific rule triggered and raw CIB values)

---

## Domain Service Design

* **File:** `src/services/cib-eligibility-policy.service.ts`
* **Interface / Methods:**
  ```typescript
  export interface CibKnockoutEvaluationInput {
    customerId: number;
    applicationId?: number;
    cibMaxDpdLast12Months: number;
    hasActiveWriteOff: boolean;
    hasLegalInsolvency: boolean;
    cibBureauReportId?: string;
  }

  export interface CibKnockoutEvaluationResult {
    isEligible: boolean;
    decision: 'PASSED' | 'AUTO_DECLINE';
    riskGrade?: 'D';
    score: null;
    declineReason?: string;
    knockoutRuleId?: string;
    evaluatedAt: Date;
  }

  export class CibEligibilityPolicyService {
    evaluateKnockout(input: CibKnockoutEvaluationInput): CibKnockoutEvaluationResult;
  }
  ```

---

## Integration & Policy Tests
1. **`test_cib_knockout_active_dpd_91`**: Input applicant with `cibMaxDpdLast12Months = 91`, expect `isEligible = false`, `riskGrade = 'D'`, `score = null`, reason `REJECT_ACTIVE_CIB_DEFAULT`.
2. **`test_cib_knockout_write_off`**: Input applicant with `hasActiveWriteOff = true`, verify immediate rejection with `score = null`.
3. **`test_cib_clean_pass`**: Input applicant with `cibMaxDpdLast12Months = 0` and no bad debt, expect `isEligible = true`, `decision = 'PASSED'`, and ready for scoring engine.
