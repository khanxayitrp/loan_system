# 03: Membership Card Issuance & Dual-Limit Sub-allocation (Purchase vs Cash)

## Context
In microfinance credit operations, uncontrolled cash advances represent the highest risk factor for borrower over-indebtedness. Per [ADR 0003](file:///Users/inseemicrofinance02/loan_system/docs/adr/0003-insee-membership-card-engine-and-risk-architecture.md), the INSEE Membership Card operates on a **Single Ledger** but enforces a **Dual-Limit Sub-allocation**: strictly **20% for Cash Advances** and **80% for Merchant/Retail Purchases**. Both sub-limits draw from the single revolving account, ensuring that total exposure cannot exceed the approved credit limit.

## Objective
Implement the card issuance domain service, database ledger structure, and balance enquiry APIs that allocate approved credit limits into dual cash and purchase limits, bind the issued card to the customer credit account, and support independent real-time querying of available balances.

## Business Rules
1. **Dual-Limit Allocation Invariant:**
   * $\text{total\_credit\_limit} = \text{cash\_limit} + \text{purchase\_limit}$
   * $\text{cash\_limit} = \lfloor \text{total\_credit\_limit} \times 0.20 \rfloor$
   * $\text{purchase\_limit} = \text{total\_credit\_limit} - \text{cash\_limit}$
   * *Example:* A 5,000,000 LAK credit limit splits into:
     * Cash Limit: 1,000,000 LAK (20%)
     * Purchase Limit: 4,000,000 LAK (80%)
2. **Single Ledger Balance Invariant:**
   * $\text{total\_utilized\_amount} = \text{cash\_utilized\_amount} + \text{purchase\_utilized\_amount}$
   * $\text{total\_available\_amount} = \max(0, \text{total\_credit\_limit} - \text{total\_utilized\_amount})$
   * $\text{cash\_available\_amount} = \min(\text{cash\_limit} - \text{cash\_utilized\_amount}, \text{total\_available\_amount})$
   * $\text{purchase\_available\_amount} = \min(\text{purchase\_limit} - \text{purchase\_utilized\_amount}, \text{total\_available\_amount})$
3. **Card Lifecycle Status:**
   * Initial state on creation: `PENDING_ISSUANCE` or `ISSUED`.
   * Activated state: `ACTIVE`.
   * Delinquency status: defaults to `NORMAL` (DPD = 0).
4. **Card Number & Member Code Generation:**
   * Unique 16-digit card number format with Luhn algorithm checksum.
   * Member code prefix based on tier (e.g. `SILV-xxxxxx`).

## Scope
* **In Scope:**
  * Creation and provisioning of `credit_accounts` with dual-limit fields.
  * Creation of `member_cards` linked to the credit account and customer.
  * Real-time calculation and presentation of dual available balances.
  * REST API endpoints:
    * `POST /api/v1/cards/issue` (Issues card and provisions account)
    * `GET /api/v1/cards/:cardId/balances` (Returns real-time dual-limit balance summary)
  * Unit and integration tests validating balance math and invariants.
* **Out of Scope:**
  * Transaction processing, authorizations, and DPD delinquency rules (handled in Ticket 04).
  * Repayment processing (handled in Ticket 05).

## Database / Schema
Enhance or verify tables:
* `credit_accounts`:
  * `id`: BIGINT PK AUTO_INCREMENT
  * `customer_id`: BIGINT NOT NULL
  * `account_no`: VARCHAR(30) UNIQUE NOT NULL
  * `credit_limit`: DECIMAL(15,2) NOT NULL (Master credit limit)
  * `cash_limit`: DECIMAL(15,2) NOT NULL (20%)
  * `purchase_limit`: DECIMAL(15,2) NOT NULL (80%)
  * `cash_utilized_amount`: DECIMAL(15,2) DEFAULT 0.00
  * `purchase_utilized_amount`: DECIMAL(15,2) DEFAULT 0.00
  * `total_utilized_amount`: DECIMAL(15,2) DEFAULT 0.00
  * `status`: ENUM('active','suspended','closed') DEFAULT 'active'
  * `version`: INT DEFAULT 1 (Optimistic lock)
* `member_cards`:
  * `id`: BIGINT PK AUTO_INCREMENT
  * `customer_id`: BIGINT NOT NULL
  * `credit_account_id`: BIGINT NOT NULL (FK to `credit_accounts`)
  * `card_no`: VARCHAR(19) UNIQUE NOT NULL
  * `member_code`: VARCHAR(30) UNIQUE NOT NULL
  * `tier`: ENUM('SILVER','GOLD','PLATINUM','DIAMOND','VIP') NOT NULL
  * `card_status`: ENUM('PENDING_ISSUANCE','ISSUED','ACTIVE','SUSPENDED','EXPIRED','CLOSED') DEFAULT 'ACTIVE'
  * `delinquency_state`: ENUM('NORMAL','WATCH','FREEZE_CASH','FREEZE_CARD','WRITE_OFF') DEFAULT 'NORMAL'
  * `dpd`: INT DEFAULT 0
  * `issued_at`, `activated_at`: DATETIME NULL

## Domain Service
* **Service Class:** `MembershipCardIssuanceService` (`src/services/membership-card-issuance.service.ts`)
  * `issueMembershipCard(customerId: number, approvedLimitLak: number, tier: MembershipTier, createdBy: number): Promise<CardIssuanceResult>`
  * `getCardBalances(cardId: number): Promise<CardDualBalanceSummary>`

## API Contract
* **Issuance Endpoint:** `POST /api/v1/cards/issue`
* **Request Body:**
```json
{
  "customerId": 1024,
  "approvedLimitLak": 5000000,
  "tier": "SILVER"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "cardId": 808,
    "cardNo": "9704001234567890",
    "memberCode": "SILV-1024-908",
    "tier": "SILVER",
    "cardStatus": "ACTIVE",
    "delinquencyState": "NORMAL",
    "dpd": 0,
    "creditAccount": {
      "accountNo": "CR-1024-001",
      "totalCreditLimit": 5000000,
      "cashLimit": 1000000,
      "purchaseLimit": 4000000,
      "cashAvailable": 1000000,
      "purchaseAvailable": 4000000,
      "totalAvailable": 5000000
    },
    "issuedAt": "2026-09-25T14:15:00.000Z"
  }
}
```

* **Balances Endpoint:** `GET /api/v1/cards/:cardId/balances`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cardId": 808,
    "cardNo": "**** **** **** 7890",
    "delinquencyState": "NORMAL",
    "dpd": 0,
    "limits": {
      "totalLimit": 5000000,
      "cashLimit": 1000000,
      "purchaseLimit": 4000000
    },
    "utilized": {
      "totalUtilized": 1200000,
      "cashUtilized": 400000,
      "purchaseUtilized": 800000
    },
    "available": {
      "totalAvailable": 3800000,
      "cashAvailable": 600000,
      "purchaseAvailable": 3200000
    }
  }
}
```

## Validation Rules
* `approvedLimitLak` must be >= 1,000,000 LAK and a multiple of 100,000 LAK.
* Customer cannot have more than 1 `ACTIVE` card.

## Error Cases
* `DUPLICATE_ACTIVE_CARD` (409): Customer already possesses an active membership card.
* `CUSTOMER_NOT_FOUND` (404): Customer record missing.
* `INVALID_LIMIT_AMOUNT` (400): Amount less than 1,000,000 LAK or not divisible by 100,000.

## Idempotency
* Card issuance supports `Idempotency-Key` header; re-submitting returns the created card without duplicating.

## Concurrency Rules
* Row-level lock (`FOR UPDATE`) on customer record during issuance to prevent race condition of issuing multiple cards concurrently.

## Audit Requirements
* Emit `MEMBERSHIP_CARD_ISSUED` audit event with initial limits, actor, and timestamp.

## Integration Tests
* `test_card_issuance_dual_limit_math`: Issue 5,000,000 LAK card, assert cash limit = 1M (20%), purchase limit = 4M (80%).
* `test_single_ledger_dual_balance_enquiry`: Partially utilize cash and purchase, verify that available amounts sum correctly and respect both bucket limits and master limit.
* `test_prevent_duplicate_active_card`: Attempt to issue second card to same customer, assert 409 Conflict.

## Acceptance Criteria
- [ ] Dual-limit allocation strictly satisfies 20% cash / 80% purchase.
- [ ] Single ledger invariant mathematically guaranteed (`cash_utilized + purchase_utilized = total_utilized`).
- [ ] Card and Credit Account entities created atomically in single DB transaction.
- [ ] Real-time balance enquiry provides accurate bucket-level and aggregate availability.
- [ ] Integration test suite passes.

## Dependencies
* **Blocked by:** Ticket 02 (`02-conservative-limit-calculator.md`).
* **Blocks:** Ticket 04 (`04-transaction-authorization-dpd.md`).

## Definition of Done
* TypeScript domain services, controllers, and routes wired.
* Database migration verified on MySQL/Postgres.
* Automated integration tests green.
