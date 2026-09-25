# 01-C: Credit Assessment Intake API, Audit Snapshots & Idempotency

**What to build:** An intake REST API endpoint (`POST /api/v1/credit/assessments/score`) that orchestrates the CIB Knockout Policy Gate (01-A) and 8-Dimension Scoring Engine (01-B). It enforces strict idempotency on retries (returning existing results without generating duplicate snapshots) while distinctly handling genuine re-assessments by appending new immutable rows to `credit_score_snapshots`, preserving complete historical audit provenance required for MFI regulatory compliance.

**Blocked by:** `01-B: 8-Dimension 1,000-Point Scoring Engine & Risk Grade Evaluation`

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] REST API endpoint `POST /api/v1/credit/assessments/score` implemented with request payload validation.
- [ ] Orchestration pipeline: runs CIB Knockout Gate first (01-A); if knocked out, short-circuits with `score = NULL`, `risk_grade = 'D'`, reason `REJECT_ACTIVE_CIB_DEFAULT`; if passed, executes 8-dimension scoring engine (01-B).
- [ ] **Strict Idempotency Handling:**
  - When invoked with an existing `Idempotency-Key` (or identical pending submission payload for the same `applicationId`), returns the cached/persisted assessment result directly without inserting new snapshots.
- [ ] **Audit Provenance & Re-assessment Invariance:**
  - Under genuine re-assessment (e.g. periodic review, updated financial inputs), creates a new assessment record and appends a new row to `credit_score_snapshots`.
  - **Never** overwrites or updates historical snapshots in-place.
- [ ] All database persistence is wrapped in an ACID database transaction.
- [ ] E2E integration test suite validates successful intake, idempotent retries, knockout short-circuiting, and immutable audit snapshot generation.

---

## Architectural Workflow

```text
POST /api/v1/credit/assessments/score (Idempotency-Key)
           │
           ▼
    Check Idempotency?
    ├── MATCH FOUND ──→ Return existing result (No DB write, No new snapshot)
    └── NEW REQUEST
           │
           ▼
    01-A: Hard Knockout Gate
    ├── KNOCKED OUT ──→ Persist Assessment (score=NULL, grade=D, AUTO_DECLINE)
    │                   Return 200 OK / 422 with REJECT_ACTIVE_CIB_DEFAULT
    └── PASSED
           │
           ▼
    01-B: 8-Dimension Scoring Engine (0-1000 pts)
           │
           ▼
    Persist Assessment & Immutable Snapshot (Audit Trail)
           │
           ▼
    Return 200 OK (Assessment ID, Risk Grade, Dimension Breakdown)
```

---

## API Specification

* **Endpoint:** `POST /api/v1/credit/assessments/score`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <jwt_token>`
  * `Idempotency-Key: <uuid-v4>` *(Optional but recommended)*

### Request Payload
```json
{
  "customerId": 1024,
  "applicationId": 501,
  "isReassessment": false,
  "cibProfile": {
    "cibMaxDpdLast12Months": 0,
    "hasActiveWriteOff": false,
    "hasLegalInsolvency": false,
    "cibActiveDebtsMonthlyPayment": 2100000
  },
  "financialProfile": {
    "monthlyIncomeLak": 8500000,
    "employmentTenureMonths": 24,
    "employmentType": "PERMANENT_SALARIED",
    "residentialStatus": "OWNED",
    "residenceYears": 3,
    "inseeHistoryMonths": 18,
    "inseeLateCount": 0,
    "appLoginFrequency": 12,
    "isBiometricVerified": true,
    "profileCompletenessPct": 95,
    "numberOfDependents": 1,
    "applicantAge": 32,
    "liquidSavingsLak": 15000000
  }
}
```

### Response 1: Eligible & Approved Scoring (200 OK)
```json
{
  "success": true,
  "data": {
    "assessmentId": 9012,
    "customerId": 1024,
    "applicationId": 501,
    "totalScore": 765,
    "riskGrade": "A3",
    "isEligible": true,
    "decision": "APPROVED",
    "dimensionBreakdown": {
      "d1_income_employment": 160,
      "d2_cib_repayment": 200,
      "d3_dti_leverage": 110,
      "d4_residential": 100,
      "d5_insee_track_record": 110,
      "d6_behavioral": 80,
      "d7_demographic": 55,
      "d8_liquidity_buffer": 40
    },
    "evaluatedAt": "2026-09-25T14:15:00.000Z"
  }
}
```

### Response 2: Hard Knockout Auto-Decline (200 OK)
```json
{
  "success": true,
  "data": {
    "assessmentId": 9013,
    "customerId": 1025,
    "applicationId": 502,
    "totalScore": null,
    "riskGrade": "D",
    "isEligible": false,
    "decision": "AUTO_DECLINE",
    "declineReason": "REJECT_ACTIVE_CIB_DEFAULT",
    "dimensionBreakdown": null,
    "evaluatedAt": "2026-09-25T14:15:10.000Z"
  }
}
```

### Response 3: Low Score Auto-Decline (200 OK)
```json
{
  "success": true,
  "data": {
    "assessmentId": 9014,
    "customerId": 1026,
    "applicationId": 503,
    "totalScore": 510,
    "riskGrade": "C2",
    "isEligible": false,
    "decision": "AUTO_DECLINE",
    "declineReason": "REJECT_CREDIT_SCORE_BELOW_THRESHOLD",
    "dimensionBreakdown": {
      "d1_income_employment": 85,
      "d2_cib_repayment": 130,
      "d3_dti_leverage": 60,
      "d4_residential": 20,
      "d5_insee_track_record": 80,
      "d6_behavioral": 40,
      "d7_demographic": 45,
      "d8_liquidity_buffer": 50
    },
    "evaluatedAt": "2026-09-25T14:15:20.000Z"
  }
}
```

---

## Idempotency vs Re-assessment Rules

1. **Idempotent Retry:**
   * Detected via `Idempotency-Key` or matched hash of input payload for the same pending `applicationId`.
   * **Action:** Fetches the existing assessment record and returns it immediately.
   * **Constraint:** Does **NOT** execute new calculation logic; does **NOT** insert any row into `credit_score_snapshots`.
2. **Re-assessment (`isReassessment = true`):**
   * Triggered when customer finances change or during periodic review (Ticket 06).
   * **Action:** Executes full evaluation pipeline.
   * **Constraint:** Inserts a brand new record into `credit_assessments` and a brand new snapshot row in `credit_score_snapshots`.
   * **Audit Guarantee:** The historical snapshots remain unaltered with original timestamps.

---

## Audit Persistence (`credit_score_snapshots`)
When an eligible applicant is scored, the service transactionally persists:
* `customer_id`: ID of the applicant.
* `score`: Computed integer score (or NULL if knocked out).
* `score_type`: `'INSEE_MEMBERSHIP_1000'`.
* `model_version`: `'v1.0.0'`.
* `reason`: Risk grade or decline reason string.
* `dimension_scores_json`: JSON string storing exact scores for D1 through D8.
* `raw_inputs_json`: JSON string storing all raw input metrics.
* `calculated_at`: Timestamp of execution.

---

## E2E Integration Tests
1. **`test_api_score_approved_flow`**: Send valid prime customer payload, expect 200 OK, grade `A1`-`A3`, and snapshot row created in DB.
2. **`test_api_idempotent_retry`**: Send the same request twice with the same `Idempotency-Key`. Verify that response 2 is identical to response 1 and `credit_score_snapshots` row count increases by exactly 1 (not 2).
3. **`test_api_reassessment_creates_new_snapshot`**: Send second request with `isReassessment: true` and updated income. Verify a second snapshot row is created, preserving the first snapshot untouched.
4. **`test_api_cib_knockout_short_circuit`**: Send payload with `cibMaxDpdLast12Months = 95`. Expect decision `AUTO_DECLINE`, `totalScore: null`, `riskGrade: "D"`, `declineReason: "REJECT_ACTIVE_CIB_DEFAULT"`, and no dimension score calculation.
