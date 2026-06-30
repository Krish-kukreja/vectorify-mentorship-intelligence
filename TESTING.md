# Testing Strategy

**34 tests** across 4 modules. All tests use mocked Prisma and external APIs (Groq, Resend) for fast, deterministic execution.

---

## Test Suite Overview

| Suite | File | Tests | Coverage |
|-------|------|-------|----------|
| Auth | `src/__tests__/auth.test.ts` | 8 | Register, login, validation, duplicates |
| Sessions | `src/__tests__/sessions.test.ts` | 10 | CRUD, pagination, date filtering, validation |
| Analysis | `src/__tests__/analysis.test.ts` | 5 | AI analysis, conflicts, Groq failures, citations |
| Action Items | `src/__tests__/actionItems.test.ts` | 11 | CRUD, status updates, filtering, overdue logic |

---

## Auth Module - 8 Tests

| # | Test Case | Expected | Edge Case |
|---|-----------|----------|-----------|
| 1 | Register with valid email + password | 201, user data (no passwordHash) | Verifies passwordHash is excluded |
| 2 | Register with invalid email | 400 VALIDATION_ERROR | `"not-an-email"` format |
| 3 | Register with short password (< 8) | 400 VALIDATION_ERROR | `"short"` - 5 chars |
| 4 | Register with missing fields | 400 VALIDATION_ERROR | Empty body |
| 5 | Register with duplicate email | 409 CONFLICT | Prisma unique constraint |
| 6 | Login with correct credentials | 200, JWT token | Verifies token is a string |
| 7 | Login with wrong password | 401 UNAUTHORIZED | bcrypt comparison fails |
| 8 | Login with unknown email | 401 UNAUTHORIZED | User not found in DB |

---

## Sessions Module - 10 Tests

| # | Test Case | Expected | Edge Case |
|---|-----------|----------|-----------|
| 1 | Create session with valid data | 201, session object | All required fields present |
| 2 | Create without auth token | 401 UNAUTHORIZED | No Authorization header |
| 3 | Create with empty title | 400 VALIDATION_ERROR | `title: ""` |
| 4 | Create with empty transcript | 400 VALIDATION_ERROR | `transcript: []` - must have ≥1 entry |
| 5 | Create with invalid participant email | 400 VALIDATION_ERROR | `"not-email"` in array |
| 6 | List with pagination | 200, pagination metadata | Verifies total, page, totalPages |
| 7 | List with date range filter | 200, filtered results | `from` and `to` query params |
| 8 | List with limit > 100 | 400 VALIDATION_ERROR | Zod max(100) enforcement |
| 9 | Get by valid ID | 200, full session | Includes analysis + actionItems |
| 10 | Get by nonexistent ID | 404 NOT_FOUND | - |

---

## Analysis Module - 5 Tests

| # | Test Case | Expected | Edge Case |
|---|-----------|----------|-----------|
| 1 | Analyze session successfully | 200, all 4 fields | Verifies auto-created ActionItems |
| 2 | Analyze already-analyzed session | 409 CONFLICT | `session.analysis` is not null |
| 3 | Analyze nonexistent session | 404 NOT_FOUND | - |
| 4 | Groq fails twice | 502 LLM_ERROR | Both attempts throw | 
| 5 | Citation validation | Strips invalid timestamps | `"99:99"` and `"FAKE"` removed, valid kept |

### Key edge case: Citation validation
The test creates an analysis result with 4 citations - 2 valid (matching transcript timestamps) and 2 invalid. The validator:
- Keeps `"00:01"` and `"00:05"` (valid)
- Strips `"99:99"` and `"FAKE"` (not in transcript)
- Returns cleaned data without rejecting the entire analysis

---

## Action Items Module - 11 Tests

| # | Test Case | Expected | Edge Case |
|---|-----------|----------|-----------|
| 1 | Create with valid data | 201, action item object | Includes sessionId, dueDate |
| 2 | Create with invalid assignee email | 400 VALIDATION_ERROR | `"not-an-email"` |
| 3 | Create with nonexistent session | 404 NOT_FOUND | Session ownership check |
| 4 | Create with missing task | 400 VALIDATION_ERROR | `task` field required |
| 5 | Update status to COMPLETED | 200, updated item | Verifies new status value |
| 6 | Update with invalid status | 400 VALIDATION_ERROR | `"INVALID_STATUS"` - not in enum |
| 7 | Update nonexistent item | 404 NOT_FOUND | - |
| 8 | List filtered by status | 200, filtered results | Verifies Prisma query includes `status: 'PENDING'` |
| 9 | List filtered by assignee | 200, filtered results | Verifies Prisma query includes assignee email |
| 10 | Get overdue items | 200, array with 1 item | dueDate in past, status PENDING |
| 11 | Overdue excludes completed | 200, empty array | Verifies `status: { not: 'COMPLETED' }` in query |

---

## Mocking Strategy

All tests mock at the Prisma layer:

```typescript
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: { create: jest.fn(), findUnique: jest.fn() },
    session: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    // ... etc
  },
}));
```

**Why mock Prisma, not the database?**
- Tests run in ~6 seconds without any database connection.
- No test database setup, teardown, or seeding required.
- Tests are deterministic - no flaky failures from database state.
- Groq SDK is also mocked to prevent real API calls and cost.

## Running Tests

```bash
npm test                  # All tests with --forceExit
npx jest --verbose        # With individual test output
npx jest --coverage       # With coverage report
```
