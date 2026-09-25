# 06: Periodic Re-scoring & Progressive Auto-Upgrade Batch Service

## Context
A revolving microfinance line is a living facility that requires dynamic risk monitoring. Under [ADR 0003](file:///Users/inseemicrofinance02/loan_system/docs/adr/0003-insee-membership-card-engine-and-risk-architecture.md), card accounts are not static. The system enforces scheduled periodic reviews (every 3 months for Silver/Gold, every 6 months for Platinum/Diamond/VIP). For stellar cardholders maintaining a 100% clean track record, the engine provides **Zero-touch Progressive Auto-Upgrades**: increasing the credit line by +15% to +25% (step cap) and promoting up to 1 tier level automatically. However, promotion into the highest tier (`VIP`) or accounts with risk flags are strictly gated from automated promotion and must be routed to Credit Committee review.

## Objective
Build the Periodic Re-scoring & Auto-Upgrade Batch Engine. The service identifies accounts due for cycle review, recalculates credit score and debt capacity, evaluates qualification for zero-touch progression, automatically executes tier/limit increases within policy guardrails, and routes flagged or VIP candidate accounts to the committee review queue.

## Business Rules
1. **Periodic Review Frequency:**
   * **Silver & Gold Cards:** Evaluated every **3 months** from card activation or last review date.
   * **Platinum, Diamond, VIP Cards:** Evaluated every **6 months**.
2. **Zero-Touch Auto-Upgrade Qualification Criteria:**
   An account qualifies for automated upgrade if and only if **ALL** of the following conditions are met:
   * **Clean Payment Record:** 100% on-time payments over the preceding review period; cumulative DPD during period = 0.
   * **No Active Freeze/Suspension:** Card is in `NORMAL` status; `limit_increase_suspended` is false (or cleared by a full clean review cycle).
   * **Healthy Line Utilization:** Average revolving utilization over the past 3 billing cycles is within the healthy active range ($\ge 30\%$ and $\le 80\%$).
   * **Refreshed Credit Score:** Re-calculated 1,000-point score meets or exceeds the threshold for the higher tier.
   * **Refreshed DTI & Capacity:** Refreshed debt capacity satisfies the candidate limit under the Conservative MIN rule (Ticket 02).
3. **Step Cap & Progression Limits:**
   * **Credit Limit Increment:** Capped at **+15% to +25%** of the current credit limit per review cycle.
   * **Tier Promotion:** Maximum of **1 Tier promotion per cycle** (e.g. Silver $\rightarrow$ Gold; Gold $\rightarrow$ Platinum).
   * **Dual-Limit Adjustment:** The new approved limit automatically recalculates 20% Cash Limit / 80% Purchase Limit.
4. **Exceptions & Committee Escalation Gating:**
   * **VIP / Black Tier Gating:** An automated upgrade can never promote an account into `VIP`. Any candidate qualifying for VIP is held in `PENDING_COMMITTEE_APPROVAL` status and routed to Maker-Checker governance (Ticket 07).
   * **Negative Alert Gating:** If external CIB reveals new delinquent debt elsewhere, the account is flagged, limit is frozen or curtailed, and auto-upgrade is blocked.

## Scope
* **In Scope:**
  * Batch evaluation scheduler/trigger (`POST /api/v1/batch/rescore-cards`).
  * Account review qualification filter and scoring refresh.
  * Automated step-cap limit increase and 1-tier promotion execution.
  * Account-level eligibility enquiry API (`GET /api/v1/cards/:cardId/upgrade-eligibility`).
  * Integration tests covering automated progression and policy barrier gating.
* **Out of Scope:**
  * Interactive UI for Credit Committee manual approvals (handled in Ticket 07).

## Database / Schema
Enhance or verify tables:
* `credit_accounts`:
  * `last_reviewed_at`: DATETIME NULL
  * `next_review_due_at`: DATETIME NOT NULL
* `membership_decisions`:
  * `id`: BIGINT PK AUTO_INCREMENT
  * `card_id`: BIGINT NOT NULL
  * `review_cycle_type`: ENUM('3_MONTH','6_MONTH','ADHOC') NOT NULL
  * `action`: ENUM('AUTO_UPGRADE','MAINTAIN','DOWNGRADE','ESCALATE_TO_COMMITTEE') NOT NULL
  * `previous_tier`: VARCHAR(20) NOT NULL
  * `new_tier`: VARCHAR(20) NOT NULL
  * `previous_credit_limit`: DECIMAL(15,2) NOT NULL
  * `new_credit_limit`: DECIMAL(15,2) NOT NULL
  * `percentage_increase`: DECIMAL(5,2) NULL
  * `score_snapshot_id`: BIGINT NOT NULL
  * `decision_notes`: TEXT NULL
  * `created_at`: DATETIME NOT NULL

## Domain Service
* **Service Class:** `PeriodicRescoringBatchService` (`src/services/periodic-rescoring-batch.service.ts`)
  * `runScheduledRescoreBatch(options?: BatchOptions): Promise<BatchExecutionSummary>`
  * `evaluateCardEligibility(cardId: number): Promise<UpgradeEligibilityResult>`
  * `applyAutoUpgrade(cardId: number, proposal: UpgradeProposal): Promise<UpgradeExecutionResult>`

## API Contract
* **Batch Trigger Endpoint:** `POST /api/v1/batch/rescore-cards`
* **Headers:** `Authorization: Bearer <system_token>`
* **Request Body:**
```json
{
  "targetCycleMonths": 3,
  "dryRun": false
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalEvaluated": 150,
    "autoUpgradedCount": 42,
    "maintainedCount": 98,
    "escalatedToCommitteeCount": 10,
    "executionTimeMs": 3120,
    "completedAt": "2026-09-25T15:00:00.000Z"
  }
}
```

* **Single Card Eligibility Endpoint:** `GET /api/v1/cards/:cardId/upgrade-eligibility`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cardId": 808,
    "currentTier": "SILVER",
    "currentCreditLimit": 5000000,
    "eligibleForAutoUpgrade": true,
    "proposedNewTier": "GOLD",
    "proposedNewCreditLimit": 6250000,
    "stepIncreasePercent": 25.0,
    "proposedCashLimit": 1250000,
    "proposedPurchaseLimit": 5000000,
    "reviewCycleMonths": 3,
    "cleanPaymentHistory": true,
    "requiresCommitteeApproval": false
  }
}
```

## Validation Rules
* Step increase percentage cannot exceed +25.0%.
* Promoted tier cannot skip levels (e.g. Silver to Platinum is strictly forbidden).

## Error Cases
* `BATCH_ALREADY_RUNNING` (409): Concurrent batch rescore job is already executing.
* `INVALID_CYCLE_TYPE` (400): Cycle must be 3 or 6 months.

## Idempotency
* Running the batch multiple times on the same date will not re-upgrade accounts whose `last_reviewed_at` has already been updated for the current cycle.

## Concurrency Rules
* Process cards in chunked batches (e.g. 50 cards per transaction) using row locks (`FOR UPDATE`) to ensure consistent state.

## Audit Requirements
* Store full before-and-after audit records in `membership_decisions`.
* Emit `AUTO_UPGRADE_GRANTED` or `COMMITTEE_ESCALATION_TRIGGERED` events.

## Integration Tests
* `test_auto_upgrade_silver_to_gold_clean`: Card with 3 months clean payments and healthy utilization receives +25% limit and Gold tier. Dual limits (20%/80%) recalculate accordingly.
* `test_step_cap_limit_cannot_exceed_25_percent`: Verify algorithm caps limit increase strictly at 25% even if capacity allows more.
* `test_disqualify_on_past_dpd`: Card with DPD = 4 two months ago is disqualified from auto-upgrade; tier and limit maintained.
* `test_diamond_candidate_to_vip_escalates`: Diamond card qualifying for VIP is not auto-upgraded; action set to `ESCALATE_TO_COMMITTEE`.
* `test_lift_suspended_limit_increase`: Account previously auto-unfrozen with `limit_increase_suspended = true` completes full clean cycle; suspension flag is cleared.

## Acceptance Criteria
- [ ] Review cycle frequencies (3 mo Silver/Gold vs 6 mo Platinum/Diamond/VIP) accurately enforced.
- [ ] Zero-touch auto-upgrade applies +15% to +25% step cap and max 1 tier promotion.
- [ ] VIP promotions and risk-flagged accounts escalated to Committee queue.
- [ ] Dual-limit balances re-partitioned correctly upon limit increase.
- [ ] Batch execution is idempotent and thread-safe.

## Dependencies
* **Blocked by:** Ticket 05 (`05-repayment-waterfall.md`).
* **Blocks:** None (Terminal feature slice of core progression).
* **Escalations Handled by:** Ticket 07 (`07-maker-checker-r018.md`).

## Definition of Done
* Batch runner and eligibility service implemented in TypeScript with cron/API triggers.
* Full test suite with seeded portfolio accounts passing.
