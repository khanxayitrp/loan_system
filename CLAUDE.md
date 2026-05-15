# CLAUDE.md

# loan_system Engineering Constitution

Version: 2.0
Project Type: Enterprise SaaS / Loan System / E-Commerce / AI Platform
Architecture:
- Modular Monolith
- Microservices
- Clean Architecture
- DDD
- Hexagonal Architecture

AI Agents:
- Claude Code
- GitHub Copilot

---

# PROJECT OVERVIEW

This repository powers a financial-grade platform that includes:

- Loan management system
- E-commerce platform
- OCR document processing
- AI workflows
- Trading systems
- OTP verification
- Payment processing
- PDF contract generation
- SOAP integrations with Lao Telecom
- Internal ERP/CMS operations

The platform serves:
- Admins
- Loan officers
- Sales staff
- Executives
- Merchants / partners
- Loan customers
- E-commerce customers

This system handles sensitive financial and personal data.

ALL GENERATED CODE MUST PRIORITIZE:
1. Security
2. Stability
3. Backward compatibility
4. Auditability
5. Scalability
6. Performance
7. Maintainability

---

# COMMON COMMANDS

## Development

```bash
npm run dev
npm run build
npm run start
```

## Testing

### SOAP Tests

```bash
npm run test:soap:all
npm run test:soap:connection
npm run test:soap:wsdl
npm run test:soap:interactive
```

### OTP Tests

```bash
npm run test:otp:all
npm run test:otp:send
npm run test:otp:verify
npm run test:otp:resend
npm run test:otp:status
npm run test:otp:invalid
npm run test:otp:stats
```

---

# NON-NEGOTIABLE ENGINEERING RULES

## STRICTLY FORBIDDEN

AI MUST NEVER:

- Rewrite entire files unnecessarily
- Introduce breaking API changes
- Rename existing production API response fields
- Delete migrations
- Modify database schema without migration
- Use raw SQL unless absolutely required
- Hardcode secrets
- Disable authentication
- Disable authorization
- Bypass validation
- Remove audit logs
- Leak sensitive data
- Commit credentials
- Use TypeScript `any` unnecessarily
- Put business logic inside controllers
- Put business logic inside React components
- Drop production DB columns directly
- Perform destructive migrations without fallback
- Break backward compatibility
- Skip transaction handling in financial operations
- Skip idempotency for payment/webhook systems

---

# AI EXECUTION PROTOCOL

Before modifying code, AI MUST:

1. Analyze architecture impact
2. Explain intended changes
3. Provide implementation plan
4. Identify risks
5. Preserve backward compatibility
6. Follow existing patterns
7. Minimize modification scope

AI SHOULD:
- Prefer small focused changes
- Reuse existing abstractions
- Follow established conventions
- Avoid unnecessary refactors

AI MUST NOT:
- Refactor unrelated modules
- Change code style globally
- Add unapproved dependencies
- Move files without reason

---

# CURRENT ARCHITECTURE

Current architecture follows:

- Controller-Service-Repository Pattern
- Clean Architecture principles
- Modular service boundaries

## Current Structure

```txt
src/
├── app.ts
├── server.ts
├── routes/
├── controllers/
├── services/
├── repositories/
├── models/
├── middlewares/
├── config/
├── utils/
├── templates/
├── jobs/
├── queues/
├── validators/
├── types/
└── docs/
```

## Future Monorepo Target Structure

```txt
apps/
  admin-web/
  customer-web/
  mobile/
  api-gateway/

services/
  auth-service/
  loan-service/
  ecommerce-service/
  payment-service/
  ai-service/
  notification-service/
  trading-service/

packages/
  ui/
  config/
  types/
  utils/
  eslint-config/
  ts-config/
```

---

# BACKEND STANDARDS

## Stack

- Node.js
- Express
- TypeScript
- Sequelize

## API Standards

REST ONLY.

Format:

```txt
/api/v1/
```

Standard response:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

Every endpoint MUST include:
- Validation
- Authentication
- Authorization
- Error handling
- Logging
- Audit tracking

---

# DATABASE RULES

## Databases

Primary:
- MySOL
- MariaDB

Secondary:
- MongoDB
- Redis
- Firebase
- Supabase

## Migration Rules

Migrations MUST:
- Support rollback
- Be reversible
- Avoid destructive changes
- Include data migration when required

NEVER:
- Drop production columns directly
- Rename production fields directly
- Delete production data silently

Preferred strategy:
- additive changes
- phased rollout
- deprecation strategy

---

# AUTHENTICATION & AUTHORIZATION

Supported:
- JWT access token
- JWT refresh token
- Session
- OAuth
- SSO

Authorization:
- RBAC
- Permission-based access

Requirements:
- Token rotation
- Session invalidation
- Audit logs
- Secure cookies
- Rate limiting

---

# SECURITY RULES

Mandatory protections:
- SQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting
- OWASP compliance
- Secure headers
- Input sanitization
- Output encoding
- Secret management

Sensitive systems MUST:
- Encrypt PII
- Mask logs
- Avoid exposing personal data

Loan systems MUST:
- Support PDPA compliance
- Preserve approval history
- Track audit events

---

# PAYMENT & WEBHOOK RULES

Supported systems:
- Lao Payment Gateway
- LaoQR
- Insee e-Wallet
- Insee Deposit Account

Webhook requirements:
- Idempotency
- Signature verification
- Retry support
- Logging
- Duplicate prevention

Financial systems MUST:
- Use transaction boundaries
- Support rollback
- Maintain consistency

---

# EXTERNAL INTEGRATIONS

## Lao Telecom SOAP Services

SOAP integrations MUST:
- Handle timeout safely
- Retry safely
- Log SOAP requests/responses
- Mask sensitive data
- Validate XML payloads

---

# OTP SYSTEM RULES

OTP systems MUST:
- Expire codes properly
- Rate limit requests
- Prevent brute force
- Support resend protection
- Log verification attempts

Sensitive OTP data MUST NEVER be logged.

---

# PDF GENERATION RULES

PDF templates located in:

```txt
src/templates/
```

Rules:
- Templates MUST remain deterministic
- Financial values MUST be validated
- Generated contracts MUST be auditable

---

# QUEUE & BACKGROUND JOBS

Queue SYSTEM:
- Redis Queue

Used for:
- Notifications
- Emails
- OCR
- AI processing
- Loan scoring
- Payment callbacks
- Daily tracking
- Reminder cron jobs

Rules:
- Jobs MUST be retryable
- Jobs MUST be idempotent
- Failures MUST be observable
- Long-running tasks MUST be asynchronous

---

# AI SYSTEM RULES

Supported AI:
- Claude
- Gemini
- Local LLM

AI workflows MUST:
- Use prompt versioning
- Use structured outputs
- Validate AI responses
- Track AI costs
- Prevent hallucinations
- Log AI activity
- Implement retry strategy

AI MUST NEVER:
- Execute unsafe actions automatically
- Bypass business rules
- Access secrets directly

---

# TRADING SYSTEM RULES

Trading systems MUST prioritize:
- Low latency
- Event-driven design
- WebSocket-first architecture
- Fail-safe handling
- Paper trading support
- Risk management

Critical requirements:
- Concurrency safety
- Transaction integrity
- Idempotency
- Retry handling
- Position consistency

---

# TESTING STANDARDS

Frameworks:
- Jest
- Vitest

Coverage target:
- 90%

Critical systems requiring mandatory tests:
- Payments
- Loan approval
- Authentication
- Trading execution
- OCR pipeline
- SOAP integrations
- OTP verification

---

# PERFORMANCE RULES

Required:
- Pagination
- Query optimization
- Proper indexing
- Caching strategy
- Lazy loading
- Efficient rerender control

Avoid:
- N+1 queries
- Blocking operations
- Overfetching
- Large payloads

---

# LOGGING & OBSERVABILITY

Tools:
- Winston/Pino
- ELK
- Grafana
- Sentry

Rules:
- Structured logs only
- Correlation IDs required
- Error context required
- No sensitive logs

Critical audit flows:
- Loan approval
- Payments
- Authentication
- Admin actions

---

# ENVIRONMENT RULES

Environments:
- local
- dev
- staging
- production

Required:
- .env.example
- Environment validation
- Secret rotation

AI MUST NEVER:
- Modify production secrets
- Commit credentials
- Hardcode environment values

---

# FRONTEND STANDARDS

Frontend stack:
- React 19
- Vue
- React Native
- TypeScript
- Redux Toolkit
- React Hook Form
- Zod
- Axios
- Tailwind CSS v4

Rules:
- Functional components only
- Avoid unnecessary useEffect
- No inline styles
- No business logic in UI
- Prefer reusable hooks
- Prefer composition

Naming convention:
- snake_case

---

# MOBILE RULES

React Native:
- Expo
- Redux
- Offline-first support

Mobile apps MUST:
- Handle unstable networks
- Retry safely
- Cache securely

---

# ERROR HANDLING STANDARD

Use centralized error handling.

Use domain-specific error codes:

```txt
AUTH_INVALID_TOKEN
LOAN_NOT_FOUND
PAYMENT_FAILED
OTP_INVALID
OCR_PROCESSING_ERROR
```

Errors MUST:
- Be machine-readable
- Preserve traceability
- Avoid leaking internal details

---

# DOCUMENTATION

Required:
- Swagger/OpenAPI
- Postman collections

All APIs MUST:
- Be documented
- Include validation rules
- Include examples

---

# DEBUGGING WORKFLOW

Before fixing:
1. Reproduce issue
2. Analyze logs
3. Identify root cause
4. Check recent deployments
5. Validate assumptions
6. Apply minimal fix
7. Add regression tests

---

# INCIDENT HANDLING

Critical incidents:
- Payment failures
- Loan inconsistencies
- Trading mismatches
- Authentication outages

AI MUST:
1. Identify impact
2. Avoid destructive fixes
3. Preserve evidence/logs
4. Suggest rollback
5. Minimize risk

---

# PR REVIEW CHECKLIST

Every PR MUST verify:
- No breaking changes
- Validation exists
- Tests exist
- Logging exists
- Security reviewed
- Performance reviewed
- Backward compatibility preserved

---

# FINAL ENGINEERING PHILOSOPHY

This system is:
- Financial-grade
- Enterprise-grade
- Security-critical
- Audit-sensitive
- Production-first

Generated code MUST prioritize:
- Stability
- Safety
- Scalability
- Maintainability
- Long-term architecture quality

Speed MUST NEVER compromise system integrity.