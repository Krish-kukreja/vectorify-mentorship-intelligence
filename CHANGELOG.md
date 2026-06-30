# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.4.0] - 2026-06-05

### Added
- Swagger/OpenAPI 3.0 documentation at `/api/docs` with full request/response schemas
- Jest + Supertest test suite - 34 tests across 4 modules (all passing)
- Winston structured JSON logging with trace IDs on every request
- README.md, DECISIONS.md, AI_APPROACH.md, TESTING.md, CHECKLIST.md documentation
- Deployment configuration for Railway

## [1.3.0] - 2026-06-05

### Added
- Resend email integration for overdue action item reminders
- `sendReminderEmail()` with HTML template - subject: "⏰ Vectorify reminder - overdue: {task}", from: `onboarding@resend.dev`
- ReminderLog model tracking delivery status (SUCCESS / FAILED) with response details

## [1.2.0] - 2026-06-05

### Added
- Action item management - full CRUD with Zod validation
- `POST /api/action-items` - create student task linked to a session (ownership verified)
- `GET /api/action-items` - list with filters (status, assignee, sessionId) and pagination
- `PATCH /api/action-items/:id/status` - update status (PENDING → IN_PROGRESS → COMPLETED)
- `GET /api/action-items/overdue` - overdue detection (status ≠ COMPLETED, dueDate < now)
- `node-cron` scheduler running on configurable `REMINDER_CRON_SCHEDULE` (default: every 5 minutes)
- Scheduler queries overdue items not reminded in 24 hours, sends email, logs result

## [1.1.0] - 2026-06-05

### Added
- AI mentorship session analysis via Groq API (LLaMA 3) with JSON response mode
- `POST /api/sessions/:id/analyze` - analyzes transcript and returns summary, actionItems, decisions, followUpSuggestions
- Prompt engineering with 4 STRICT RULES preventing hallucination
- Citation validation using `Set<string>` - strips invalid timestamps, logs warnings
- Retry strategy - 1 retry with 1s delay before returning 502 LLM_ERROR
- Auto-creation of ActionItem records from analysis results (status: PENDING)
- Conflict detection - returns 409 if analysis already exists for a session

## [1.0.0] - 2026-06-05

### Added
- Project foundation - Express 4.18.2 + TypeScript 5.x + PostgreSQL 15 + Prisma 5.x
- Prisma schema with 5 models: User, Session, SessionAnalysis, ActionItem, ReminderLog
- PrismaClient singleton pattern via `globalThis` to prevent connection pool exhaustion
- Middleware stack in exact order: CORS → JSON → traceId → requestLogger → routes → errorHandler
- Unified response format: `{ traceId, success, data/error }` on every endpoint
- `POST /api/auth/register` - user registration with bcryptjs (saltRounds: 10)
- `POST /api/auth/login` - JWT authentication (7-day expiry)
- JWT verification middleware (`req.userId` injection)
- `POST /api/sessions` - create mentorship session with transcript (Zod validation)
- `GET /api/sessions` - list sessions with pagination and date range filtering
- `GET /api/sessions/:id` - get session with analysis and action items
- `GET /health` - health check endpoint
- `GET /api/evaluation` - evaluation metadata endpoint
- Zod validation middleware with structured error responses (400 VALIDATION_ERROR)
