# 05: Repayment Waterfall & Auto-Unfreeze Automation

## Context
Together with Ticket 04, the repayment engine is one of the two most mission-critical and financial-integrity-sensitive components of the INSEE Membership Card system ([ADR 0003](file:///Users/inseemicrofinance02/loan_system/docs/adr/0003-insee-membership-card-engine-and-risk-architecture.md)). Repayments must follow a strictly ordered **Repayment Waterfall**, clearing higher-interest debt (Cash Advances) before lower-interest debt (Retail Purchases). Crucially, the system must deliver **Zero-touch Auto-Unfreeze**: the exact instant a delinquent borrower clears overdue balances (bringing DPD back to 0), the engine immediately restores card functionality without manual staff intervention, while preserving the policy safeguard of suspending credit limit increase requests until the subsequent periodic review.

## Objective
Implement the Repayment Waterfall Engine and Auto-Unfreeze Automation. This service accepts repayment transactions, allocates funds strictly according to policy priorities, credits the dual-limit buckets on the single ledger, recomputes DPD, and automatically transitions cards from `FREEZE_CARD` or `FREEZE_CASH` back to `NORMAL`.

## Business Rules
1. **Strict Repayment Waterfall Hierarchy:**
   When a repayment amount $P$ is processed against an account, funds must cascade strictly down the following hierarchy until $P$ is exhausted:
   * **Step 1: Penalties & Late Fees** (Unpaid overdue late fees, administrative charges).
   * **Step 2: Accrued Cash Advance Interest** (Interest accrued on cash withdrawals; typically 28% APR).
   * **Step 3: Cash Advance Principal** (Decreases `cash_utilized_amount` and `total_utilized_amount`).
   * **Step 4: Accrued Retail Purchase Interest** (Interest accrued on merchant purchases; typically 18% APR).
   * **Step 5: Retail Purchase Principal** (Decreases `purchase_utilized_amount` and `total_utilized_amount`).
   * **Step 6: Excess Credit Balance** (Any surplus beyond total owed is recorded as an unbilled credit balance / prepaid credit).
2. **Auto-Unfreeze Automation Logic:**
   * Upon successful allocation of repayment:
     * If the payment covers all past-due minimum amounts such that **DPD reaches 0**:
       * Card `delinquency_state` automatically flips from `FREEZE_CARD` or `FREEZE_CASH` or `WATCH` back to **`NORMAL`** immediately in the same transaction.
       * `cash_available_amount` and `purchase_available_amount` become immediately spendable.
     * **Policy Safeguard:** A card that has been auto-unfrozen retains a `limit_increase_suspended = true` flag until the next scheduled periodic re-score batch cycle (Ticket 06).
   * If the payment is a partial payment that reduces DPD but does not clear past-due minimum (e.g. DPD drops from 35 to 20):
     * State transitions accordingly (e.g., from `FREEZE_CARD` to `FREEZE_CASH`).

## Scope
* **In Scope:**
  * Repayment processing API (`POST /api/v1/cards/:cardId/repayments`).
  * Mathematical waterfall allocation logic across 6 distinct debt buckets.
  * Atomic updating of `credit_accounts`, `member_cards`, and `credit_ledgers`.
  * Real-time DPD recalculation and Auto-Unfreeze state transition.
  * Concurrency and race-condition safety via pessimistic row locks.
  * Integration tests verifying exact waterfall penny-level allocation and state transitions.
* **Out of Scope:**
  * External bank payment gateway webhooks (already integrated in parent payment service).
  * Batch auto-upgrades (handled in Ticket 06).

## Database / Schema
Enhance or verify tables:
* `credit_accounts`:
  * `cash_utilized_amount`: DECIMAL(15,2) NOT NULL
  * `purchase_utilized_amount`: DECIMAL(15,2) NOT NULL
  * `total_utilized_amount`: DECIMAL(15,2) NOT NULL
  * `accrued_cash_interest`: DECIMAL(15,2) DEFAULT 0.00
  * `accrued_purchase_interest`: DECIMAL(15,2) DEFAULT 0.00
  * `unpaid_fees`: DECIMAL(15,2) DEFAULT 0.00
  * `excess_credit_balance`: DECIMAL(15,2) DEFAULT 0.00
* `member_cards`:
  * `delinquency_state`: ENUM('NORMAL','WATCH','FREEZE_CASH','FREEZE_CARD','WRITE_OFF')
  * `dpd`: INT NOT NULL
  * `limit_increase_suspended`: BOOLEAN DEFAULT false
  * `last_unfrozen_at`: DATETIME NULL
* `repayments`:
  * `id`: BIGINT PK AUTO_INCREMENT
  * `credit_account_id`: BIGINT NOT NULL
  * `card_id`: BIGINT NOT NULL
  * `payment_ref`: VARCHAR(64) UNIQUE NOT NULL
  * `amount_paid`: DECIMAL(15,2) NOT NULL
  * `allocated_fees`: DECIMAL(15,2) NOT NULL
  * `allocated_cash_interest`: DECIMAL(15,2) NOT NULL
  * `allocated_cash_principal`: DECIMAL(15,2) NOT NULL
  * `allocated_purchase_interest`: DECIMAL(15,2) NOT NULL
  * `allocated_purchase_principal`: DECIMAL(15,2) NOT NULL
  * `allocated_excess`: DECIMAL(15,2) NOT NULL
  * `previous_dpd`: INT NOT NULL
  * `new_dpd`: INT NOT NULL
  * `previous_state`: VARCHAR(20) NOT NULL
  * `new_state`: VARCHAR(20) NOT NULL
  * `paid_at`: DATETIME NOT NULL

## Domain Service
* **Service Class:** `RepaymentWaterfallService` (`src/services/repayment-waterfall.service.ts`)
  * `processRepayment(cardId: number, dto: RepaymentDto): Promise<RepaymentResult>`
  * `calculateWaterfallAllocation(account: CreditAccount, paymentAmount: number): WaterfallBreakdown`
  * `evaluateAutoUnfreeze(card: MemberCard, remainingOverdue: number): UnfreezeEvaluation`

## API Contract
* **Endpoint:** `POST /api/v1/cards/:cardId/repayments`
* **Headers:** `Idempotency-Key: <UUIDv4>`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "paymentRef": "PAY-20260925-8831",
  "paymentMethod": "BCEL_ONE_QR",
  "amountLak": 2000000,
  "paidAt": "2026-09-25T14:45:00.000Z"
}
```
* **Success Response - Auto-Unfreeze Triggered (200 OK):**
```json
{
  "success": true,
  "data": {
    "repaymentId": 5012,
    "cardId": 808,
    "paymentRef": "PAY-20260925-8831",
    "amountPaid": 2000000,
    "waterfallAllocation": {
      "fees": 50000,
      "cashInterest": 70000,
      "cashPrincipal": 800000,
      "purchaseInterest": 40000,
      "purchasePrincipal": 1040000,
      "excessBalance": 0
    },
    "delinquencyTransition": {
      "previousDpd": 15,
      "newDpd": 0,
      "previousState": "FREEZE_CASH",
      "newState": "NORMAL",
      "autoUnfrozen": true,
      "limitIncreaseSuspended": true
    },
    "updatedBalances": {
      "totalCreditLimit": 5000000,
      "totalUtilized": 460000,
      "totalAvailable": 4540000,
      "cashAvailable": 1000000,
      "purchaseAvailable": 3540000
    }
  }
}
```

## Validation Rules
* `amountLak` must be strictly positive (> 0).
* `paymentRef` must be unique across the entire system.

## Error Cases
* `CARD_NOT_FOUND` (404): Specified card ID does not exist.
* `DUPLICATE_PAYMENT_REF` (409): Payment reference has already been executed.
* `ACCOUNT_IN_WRITE_OFF` (422): Repayments for written-off debt must follow specialized recovery routing.

## Idempotency
* Full idempotency enforced via `Idempotency-Key` and `paymentRef`. Reprocessing the same reference returns the cached allocation receipt without altering ledger balances a second time.

## Concurrency Rules
* **Pessimistic Locking:** Acquire `SELECT ... FOR UPDATE` on both `credit_accounts` and `member_cards` rows at transaction start.
* Guarantees that concurrent authorizations (Ticket 04) or duplicate repayments cannot calculate overlapping balance snapshots.

## Audit Requirements
* Record granular `CREDIT` entries in `credit_ledgers` for every waterfall slice (Fees, Cash Interest, Cash Principal, Purchase Interest, Purchase Principal).
* Emit `AUTO_UNFREEZE_EXECUTED` audit event when a card transitions from frozen to `NORMAL`.

## Integration Tests
* `test_repayment_waterfall_clears_cash_before_purchase`: Account has 500k cash debt and 1M purchase debt. Repay 700k. Verify all 500k cash is wiped clean, and remaining 200k reduces purchase debt.
* `test_auto_unfreeze_from_freeze_cash`: Card at DPD 14 (`FREEZE_CASH`). Customer makes full repayment. Verify DPD becomes 0, status switches to `NORMAL`, cash advances immediately become authorized, and `limit_increase_suspended` is true.
* `test_auto_unfreeze_from_freeze_card`: Card at DPD 45 (`FREEZE_CARD`). Customer pays all overdue minimum. Verify status transitions to `NORMAL` and retail purchases are unlocked.
* `test_partial_repayment_step_down`: Card at DPD 35 (`FREEZE_CARD`). Repayment satisfies 30+ day tranche, leaving DPD at 12. Verify status transitions to `FREEZE_CASH` (cash still blocked, purchase allowed).
* `test_excess_repayment_records_credit`: Customer owes 1M LAK, pays 1.2M LAK. Verify 200k is credited to `excess_credit_balance`.

## Acceptance Criteria
- [ ] Strict 6-tier waterfall allocation implemented and mathematically proven.
- [ ] Cash advances (higher interest) prioritized ahead of retail purchases.
- [ ] Instant Zero-touch Auto-Unfreeze executes when DPD reaches 0.
- [ ] Card and account balances update atomically under pessimistic DB locking.
- [ ] Immutable double-entry ledger created for every allocation slice.
- [ ] Comprehensive integration test suite passes.

## Dependencies
* **Blocked by:** Ticket 04 (`04-transaction-authorization-dpd.md`).
* **Blocks:** Ticket 06 (`06-periodic-rescoring-auto-upgrade.md`).

## Definition of Done
* Service, controller, and repository code written in clean TypeScript.
* DB transactions verified under concurrent authorization/repayment load.
* 100% test coverage on waterfall priority and auto-unfreeze transition edges.
