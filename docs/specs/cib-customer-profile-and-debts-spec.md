# Technical Specification: Customer-Centric CIB Profile and Debt Snapshot Architecture

**Status:** Ready for Implementation  
**Triage Label:** `ready-for-agent`  
**Referenced Standards & ADRs:**
- Domain Glossary (`docs/glossary.md`)
- ADR 0001: Membership Workflow and Credit Origination Architecture (`docs/adr/0001-membership-workflow-and-credit-origination.md`)
- ADR 0002: Customer-Centric CIB Profile and Debt Snapshot Architecture (`docs/adr/0002-customer-centric-cib-architecture.md`)

---

## Problem Statement

Historically, the platform stored Credit Information Bureau (CIB) records exclusively within individual loan contracts via loan-scoped tables (`loan_cib_checks` and `loan_cib_history_details`). This creates significant structural bottlenecks:

1. **Inability to Reuse Credit Evidence:** When a customer applies for membership, requests a credit line increase, or goes through annual credit reviews, staff cannot reuse recently verified CIB data. They are forced to perform redundant verifications or create ad-hoc checks.
2. **Audit Trail Mutation Risk:** When credit officers update CIB information, historical checks risk being overwritten in-place, destroying the immutable snapshot of what the customer's liabilities were at the exact moment a past credit decision was approved.
3. **Decoupled AI Extraction:** While an AI parser can extract credit accounts from CIB PDF documents, the extracted results are merely returned as ephemeral JSON to the client rather than atomically persisted into an institutionalized, auditable credit layer.
4. **Architectural Mismatch with Membership 2.0:** The Membership Origination and Credit Facility engines require a centralized customer-level credit assessment foundation rather than single-loan-bound data.

---

## Solution

Establish a unified, immutable **Customer-Centric Shared Credit Data Layer** that decouples CIB verification from loan contracts and promotes it to a first-class customer asset:

1. **Customer CIB Profiles (`customer_cib_profiles`):** Point-in-time immutable snapshots representing each official CIB check performed for a customer. Once written, a profile is **never overwritten**. Subsequent checks append new profiles.
2. **Customer CIB Debts (`customer_cib_debts`):** Granular account-level underlying debt records (1:N relationship with `customer_cib_profiles`) detailing financial institutions, account categories, delinquency states, approved amounts, and outstanding balances.
3. **Multi-Module Consumer Integration:** Both `membership_assessments` and `credit_assessments` link directly to `cib_profile_id`. Loan underwriting operations can directly query active, unexpired CIB profiles (`valid_until >= NOW()`).
4. **Automated AI Extraction to Persistence Pipeline:** Integrate the PDF extraction engine with atomic database transactions that calculate worst-case severity status, compute validity periods, store raw audit artifacts, and populate profiles and debt items in a single atomic transaction.
5. **Additive Safe Migration:** Preserve legacy tables (`loan_cib_checks`, `loan_cib_history_details`) for backwards compatibility while establishing new flows on the customer-level layer.

---

## User Stories

1. As a credit officer, I want to upload a customer's official CIB PDF report, so that the system automatically extracts all active credit lines, liabilities, and delinquency days without manual data entry.
2. As a credit officer, I want the system to calculate the overall customer CIB status based on the worst delinquency found across all their debts, so that I can immediately determine risk grade without error.
3. As a credit officer, I want newly verified CIB reports to be saved as an immutable snapshot for that customer, so that past verification history remains tamper-proof.
4. As a compliance auditor, I want each CIB profile snapshot to retain the reference URL of the source PDF report, the staff ID who ran the check, and the exact timestamp, so that all credit checks can be audited against Bank of Lao PDR regulations.
5. As an underwriter evaluating a membership application, I want the system to link the application's assessment to an existing, valid CIB profile of the applicant, so that I do not re-check the bureau unnecessarily within the 30–90 day validity window.
6. As an underwriter, I want the customer's total outstanding debt and debt obligations from CIB debts to automatically feed into the Debt Service Ratio (DSR) calculation during membership assessment, so that recommended credit limits are grounded in verifiable liabilities.
7. As a credit committee manager, I want to review the exact breakdown of external bank debts that existed at the moment a membership application was submitted, so that I understand why an applicant was assigned a specific risk grade.
8. As a credit risk manager, I want periodic credit reviews to create a brand-new CIB profile snapshot when a customer requests a credit limit increase, so that we have before-and-after evidence of their debt evolution.
9. As a system administrator, I want existing legacy loan contracts to continue reading their historical CIB checks without breaking changes, so that existing production operations continue uninterrupted during the transition.
10. As an API client, I want to query the most recent valid CIB profile for a given customer, so that user portals or staff dashboards can quickly display current credit standing.
11. As a credit officer, I want the system to reject corrupted or non-PDF files before processing, so that the service layer remains resilient against invalid inputs.
12. As a loan officer processing a drawdown application, I want the loan underwriting flow to check if an active CIB profile already exists for the member customer, so that loans can be processed faster with lower turnaround time.
13. As a financial controller, I want all CIB profile and debt persistence operations to be wrapped in an atomic database transaction, so that a failure in saving debt details never leaves a dangling CIB profile header.
14. As a credit operations manager, I want CIB profile records to specify an explicit `valid_until` date, so that policies regarding expired bureau reports (e.g. older than 90 days) can be strictly enforced by automated validation rules.

---

## Implementation Decisions

### 1. Architectural Role and Layering
- **Domain Alignment:** Promoted from Loan submodule to **Customer Domain Core**. CIB data lives at `Customer -> CIB Profile (1:N) -> CIB Debts (1:N)`.
- **Consumer Contracts:** 
  - `membership_assessments` holds foreign key `cib_profile_id` referencing `customer_cib_profiles.id`.
  - `credit_assessments` holds foreign key `cib_profile_id` referencing `customer_cib_profiles.id`.
  - Underwriting workflows resolve active CIB profile via query: `WHERE customer_id = :id AND valid_until >= NOW() ORDER BY checked_at DESC LIMIT 1`.

### 2. Immutability & Point-in-Time Snapshot Rule
- **Strict Append-Only Policy:** The `customer_cib_profiles` and `customer_cib_debts` tables do not permit updating existing historical records. Re-running a CIB check creates a new profile record with its own debts.
- **Audit Preservation:** Maintains compliance evidence even if the customer's debt picture changes next week or next year.

### 3. Delinquency Classification & Status Computation
- The overall profile `cib_status` is determined by taking the maximum severity among all associated `customer_cib_debts`:
  - Severity hierarchy: `no_delay` (1) < `delay_30_days` (2) < `delay_60_days` (3) < `delay_90_days` (4) < `blacklist` (5).
  - If any debt item has `blacklist` or days overdue > 90, the entire profile becomes `blacklist`.
  - If no debts are recorded, status defaults to `no_delay`.

### 4. Data Shapes & Interface Models

#### Profile Snapshot Shape
```typescript
interface CustomerCibProfileSnapshot {
  id: number;
  customer_id: number;
  cib_status: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  report_file_url?: string;
  checked_by: number;
  checked_at: Date;
  valid_until: Date; // e.g. checked_at + configured validity window (30-90 days)
  debts: CustomerCibDebtItem[];
}
```

#### Debt Item Shape
```typescript
interface CustomerCibDebtItem {
  id?: number;
  cib_profile_id?: number;
  institution_name: string;
  account_type?: string;
  history_status: 'no_delay' | 'delay_30_days' | 'delay_60_days' | 'delay_90_days' | 'blacklist';
  approved_amount: number;
  outstanding_balance: number;
}
```

### 5. Service & Controller Seams
- Introduce dedicated `CibService` encapsulating:
  - `createCibSnapshot(customerId, debts, fileUrl, checkedByUserId, validityDays)`: Executes in an atomic transaction; creates profile, creates child debts, logs audit record, returns populated snapshot.
  - `getActiveProfile(customerId)`: Retrieves latest non-expired profile along with its debts.
  - `getProfileHistory(customerId)`: Retrieves all historical snapshots in reverse chronological order.
  - `parseAndSaveCib(customerId, pdfBuffer, fileUrl, checkedByUserId)`: Orchestrates AI PDF extraction and immediate snapshot creation.

---

## Testing Decisions

### 1. Seam Selection & Test Strategy
- **Primary Seam:** Test at the Service & API boundary (`CibService` and Customer/Membership Route endpoints) using real database transactions with rollback or isolated test fixtures.
- **Rationale:** Testing at the service boundary tests external business behavior (snapshot immutability, worst-status computation, valid_until computation, and atomic foreign-key relationships) without coupling to internal PDF layout parsing specifics.
- **AI Extraction Isolation:** In integration tests, mock the external LLM call with deterministic JSON responses representing standard clean, delinquent, and multi-bank debt profiles.

### 2. Key Test Scenarios
- **Scenario 1 (Worst-Status Aggregation):** When debts contain a mix of `no_delay`, `delay_30_days`, and `delay_90_days`, the profile `cib_status` must equal `delay_90_days`.
- **Scenario 2 (Append-Only Snapshotting):** Running a second CIB check for the same customer creates a new record ID; the previous record ID, timestamp, and debts remain unaltered.
- **Scenario 3 (Atomic Rollback):** If one debt record has invalid data causing a database constraint violation, the profile header must roll back and no dangling records should exist.
- **Scenario 4 (Validity Period Check):** Verify that querying active CIB profiles ignores snapshots where `valid_until < NOW()`.

### 3. Prior Art in Codebase
- Existing checklist verification logic in `checklist.service.ts` (e.g. `CreateCIBVerification`).
- Membership assessment tests and application versioning patterns in `membership-origination.service.ts`.

---

## Out of Scope

1. **OCR of Scanned Paper Images:** Optical character recognition of low-resolution scanned image PDFs without selectable text is handled by human fallback/manual entry; not part of this specification.
2. **Automated Live Host-to-Host CIB Clearing Integration:** Direct real-time TCP/SOAP connection to the Bank of Lao PDR CIB clearing house. System relies on uploaded official PDF export reports.
3. **Dropping Legacy Tables:** Dropping `loan_cib_checks` and `loan_cib_history_details` is out of scope to avoid breaking existing legacy loan contracts.

---

## Further Notes

- **Default Validity Duration:** By default, CIB reports are considered valid for 90 days from `checked_at`. This can be customized by configuration (e.g., 30 days for high-risk tiers).
- **Extensibility for Banking-Grade Fields:** Future iterations can add `monthly_installment`, `days_past_due`, `report_reference_no`, and `response_hash` without changing the core relationship structure established here.
