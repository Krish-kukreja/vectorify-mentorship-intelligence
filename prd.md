# 📋 Product Requirements Document
## Hintro — Meeting Intelligence Service

> **Status:** Ready to Build  
> **Timeline:** 6–10 hours (solo developer)  
> **Audience:** AI coding tools + developer reference  
> **Version:** 2.0 — All decisions pre-made, no ambiguity

---

## 📊 Project Overview

| Field | Value |
|-------|-------|
| **Product Name** | Meeting Intelligence Service |
| **Type** | REST API Backend Service |
| **Purpose** | Ingest meeting transcripts → generate AI-powered insights → manage action items → send overdue reminders |
| **Submission for** | Hintro Backend/Fullstack Engineering Internship |
| **Target Launch** | End of sprint (6–10 dev hours) |
| **Deployment Target** | Railway (free tier) |

---

## 🎯 Product Vision

A clean, production-grade backend API that takes raw meeting transcripts, applies LLM analysis to extract structured insights grounded exclusively in the transcript, tracks action items through their lifecycle, and automatically reminds assignees via email when tasks go overdue — all with consistent logging, tracing, and error handling.

**One-liner:** *"Turn raw meeting transcripts into actionable intelligence, automatically."*

---

## 👤 Target User

**Primary:** Hintro engineering evaluators reviewing the submission.

**Simulated end-user persona:**
- **Name:** Team Lead / Project Manager
- **Context:** Runs 5–10 meetings/week; loses track of who committed to what
- **Pain points:** Action items fall through the cracks; no single source of truth for decisions; no reminders for overdue tasks
- **Goal:** Submit a transcript → get structured summary + action items → be reminded when things are late

---

## 🛠️ Tech Stack — All Decisions Made

> No deliberation needed. Use exactly these.

| Layer | Choice | Reason |
|-------|--------|--------|
| **Language** | TypeScript | Type safety; better for maintainability scoring |
| **Runtime** | Node.js 20+ | Industry standard; rich ecosystem |
| **Framework** | Express.js | Lightweight; simple middleware chain; easy to organize |
| **Database** | PostgreSQL | Relational; enforces data integrity; best for filtering/pagination |
| **ORM** | Prisma | Excellent TypeScript types; easy migrations; clean schema file |
| **Auth** | JWT (JSON Web Tokens) | Stateless; no session store needed; simpler to deploy |
| **LLM Provider** | Google Gemini 1.5 Flash | Generous free tier; supports structured JSON output; fast |
| **External Integration** | Resend (Email API) | Free tier (100 emails/day); 1-minute setup; no SMTP config |
| **Scheduler** | node-cron | Lightweight; cron syntax; runs in-process |
| **Validation** | Zod | Schema-first; TypeScript-native; great error messages |
| **Logging** | Winston | Structured JSON logs; log levels; easy transport config |
| **API Docs** | swagger-ui-express + swagger-jsdoc | Inline JSDoc → Swagger UI; zero extra config |
| **Testing** | Jest + Supertest | Industry standard; easy HTTP testing |
| **Deployment** | Railway | Free PostgreSQL + Node service; one-click deploy from GitHub |

---

## ✨ Core Features

### Feature 1 — Authentication

**Mechanism:** JWT (Bearer token)  
**Library:** `jsonwebtoken` + `bcryptjs`

**Endpoints:**
```
POST /api/auth/register    → Create account
POST /api/auth/login       → Returns JWT token
```

**Register Request:**
```json
{
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

**Login Response:**
```json
{
  "traceId": "uuid-v4",
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "expiresIn": "7d"
  }
}
```

**Token behavior:**
- Expiry: `7d`
- Secret: pulled from `JWT_SECRET` env var
- All `/api/meetings` and `/api/action-items` routes require `Authorization: Bearer <token>` header
- Missing/invalid token → `401 Unauthorized`

**Prisma Schema:**
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  meetings     Meeting[]
}
```

---

### Feature 2 — Meeting Management

#### 2a. Create Meeting — `POST /api/meetings`

**Request Body (validated with Zod):**
```json
{
  "title": "Sprint Planning",
  "participants": ["alice@example.com", "bob@example.com"],
  "meetingDate": "2026-05-20T10:00:00Z",
  "transcript": [
    { "timestamp": "00:10", "speaker": "John", "text": "We should launch next Friday." },
    { "timestamp": "00:20", "speaker": "Alice", "text": "I will prepare release notes." }
  ]
}
```

**Zod Validation Rules:**
```typescript
const CreateMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  participants: z.array(z.string().email("Invalid email")).min(1),
  meetingDate: z.string().datetime("Invalid ISO 8601 date"),
  transcript: z.array(z.object({
    timestamp: z.string().min(1),
    speaker: z.string().min(1),
    text: z.string().min(1)
  })).min(1, "Transcript cannot be empty")
})
```

**Response:** `201 Created` → full meeting object

**Prisma Schema:**
```prisma
model Meeting {
  id           String           @id @default(uuid())
  userId       String
  user         User             @relation(fields: [userId], references: [id])
  title        String
  participants String[]
  meetingDate  DateTime
  transcript   Json             // Array of TranscriptEntry
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  analysis     MeetingAnalysis?
  actionItems  ActionItem[]
}
```

#### 2b. Get Meeting — `GET /api/meetings/:id`

- Returns full meeting + analysis (if exists) + action items
- `404` if not found

#### 2c. List Meetings — `GET /api/meetings`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Max 100 |
| `from` | ISO date | — | Filter meetings from this date |
| `to` | ISO date | — | Filter meetings up to this date |

**Response includes:**
```json
{
  "data": {
    "meetings": [...],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### Feature 3 — AI Meeting Analysis

**Endpoint:** `POST /api/meetings/:id/analyze`

**Flow:**
1. Load meeting + transcript from DB
2. Build prompt (see Prompt Spec below)
3. Call Gemini API with structured JSON output mode
4. Validate response (citations must reference real timestamps)
5. Save `MeetingAnalysis` to DB
6. Auto-create `ActionItem` rows from `actionItems` array (status: `PENDING`)
7. Return full analysis

**Prompt Spec (exact system prompt to use):**

```
You are a meeting analysis assistant. Your job is to extract structured insights from a meeting transcript.

STRICT RULES:
1. Only use information explicitly stated in the transcript below.
2. Do NOT invent attendees, tasks, decisions, or outcomes.
3. Every insight MUST include at least one citation with a "timestamp" matching exactly one of the transcript entries.
4. If something was not discussed, omit it entirely — do not guess or infer.

TRANSCRIPT:
{{transcript_json}}

Respond ONLY with a valid JSON object in this exact format — no markdown, no explanation:
{
  "summary": [{ "text": "...", "citations": [{ "timestamp": "00:10" }] }],
  "actionItems": [{ "task": "...", "assignee": "...", "citations": [{ "timestamp": "..." }] }],
  "decisions": [{ "text": "...", "citations": [{ "timestamp": "..." }] }],
  "followUpSuggestions": [{ "text": "...", "citations": [{ "timestamp": "..." }] }]
}
```

**Post-processing validation (required):**
```typescript
function validateCitations(analysis: AnalysisResult, transcript: TranscriptEntry[]): boolean {
  const validTimestamps = new Set(transcript.map(t => t.timestamp));
  // Check every citation in every field references a real timestamp
  // Return false if any citation timestamp is not in validTimestamps
  // Log a warning and strip invalid citations before saving
}
```

**Prisma Schema:**
```prisma
model MeetingAnalysis {
  id                String   @id @default(uuid())
  meetingId         String   @unique
  meeting           Meeting  @relation(fields: [meetingId], references: [id])
  summary           Json
  actionItems       Json
  decisions         Json
  followUpSuggestions Json
  createdAt         DateTime @default(now())
}
```

**Error cases:**
- `404` if meeting not found
- `409` if analysis already exists (return existing)
- `502` if LLM API call fails (with retry once)

---

### Feature 4 — Action Item Management

#### 4a. Create Action Item — `POST /api/action-items`

```json
{
  "task": "Prepare release notes",
  "assignee": "alice@example.com",
  "meetingId": "uuid-here",
  "dueDate": "2026-05-25T00:00:00Z",
  "citations": [{ "timestamp": "00:20" }]
}
```

**Zod Validation:**
- `task`: required string, min 1 char
- `assignee`: required valid email
- `meetingId`: required UUID, must exist in DB (check on creation)
- `dueDate`: optional, valid ISO datetime if present
- `citations`: optional array

#### 4b. Update Status — `PATCH /api/action-items/:id/status`

```json
{ "status": "IN_PROGRESS" }
```

**Valid enum values:** `PENDING` | `IN_PROGRESS` | `COMPLETED`  
**Zod:** `z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"])`

#### 4c. List Action Items — `GET /api/action-items`

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | enum | Filter by status |
| `assignee` | email | Filter by assignee |
| `meetingId` | UUID | Filter by meeting |
| `page` | number | Default: 1 |
| `limit` | number | Default: 10 |

**Prisma Schema:**
```prisma
model ActionItem {
  id        String     @id @default(uuid())
  meetingId String
  meeting   Meeting    @relation(fields: [meetingId], references: [id])
  task      String
  assignee  String
  status    ActionStatus @default(PENDING)
  dueDate   DateTime?
  citations Json?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  reminders ReminderLog[]
}

enum ActionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}
```

---

### Feature 5 — Overdue Detection

**Endpoint:** `GET /api/action-items/overdue`

**Query logic:**
```typescript
// Prisma query
const overdueItems = await prisma.actionItem.findMany({
  where: {
    status: { not: "COMPLETED" },
    dueDate: { lt: new Date() }
  },
  include: { meeting: { select: { title: true } } }
});
```

Response is a flat array of matching action items — no pagination required.

---

### Feature 6 — Scheduled Reminder Job

**Library:** `node-cron`  
**Schedule:** Every 5 minutes (`*/5 * * * *`) — frequent enough to demonstrate it works  
**Start on:** App boot (`app.ts` calls `startReminderScheduler()`)

**Scheduler logic (exact flow):**
```typescript
// src/jobs/reminderScheduler.ts
cron.schedule("*/5 * * * *", async () => {
  const logger = getLogger();
  const traceId = crypto.randomUUID();
  
  // Step 1: Find overdue items not yet reminded in last 24h
  const overdueItems = await prisma.actionItem.findMany({
    where: {
      status: { not: "COMPLETED" },
      dueDate: { lt: new Date() },
      reminders: {
        none: {
          sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }
    }
  });

  // Step 2: Send email per item
  for (const item of overdueItems) {
    try {
      await sendReminderEmail(item);
      await prisma.reminderLog.create({
        data: {
          actionItemId: item.id,
          channel: "email",
          deliveryStatus: "SUCCESS",
          sentAt: new Date()
        }
      });
      logger.info({ traceId, actionItemId: item.id, msg: "Reminder sent" });
    } catch (err) {
      await prisma.reminderLog.create({
        data: {
          actionItemId: item.id,
          channel: "email",
          deliveryStatus: "FAILED",
          sentAt: new Date(),
          response: String(err)
        }
      });
      logger.error({ traceId, actionItemId: item.id, err, msg: "Reminder failed" });
    }
  }
});
```

**Prisma Schema:**
```prisma
model ReminderLog {
  id             String   @id @default(uuid())
  actionItemId   String
  actionItem     ActionItem @relation(fields: [actionItemId], references: [id])
  channel        String   // "email"
  deliveryStatus String   // "SUCCESS" | "FAILED"
  response       String?
  sentAt         DateTime @default(now())
}
```

---

### Feature 7 — Email Integration (Resend)

**Provider:** [Resend](https://resend.com)  
**Free tier:** 100 emails/day, no credit card  
**Setup time:** ~5 minutes

**Installation:**
```bash
npm install resend
```

**Email service (exact implementation):**
```typescript
// src/integrations/resend.ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail(item: ActionItem) {
  await resend.emails.send({
    from: "reminders@yourdomain.com",  // or onboarding@resend.dev for testing
    to: item.assignee,
    subject: `⏰ Overdue: ${item.task}`,
    html: `
      <h2>Action Item Overdue</h2>
      <p><strong>Task:</strong> ${item.task}</p>
      <p><strong>Assigned To:</strong> ${item.assignee}</p>
      <p><strong>Due Date:</strong> ${item.dueDate?.toISOString().split("T")[0]}</p>
      <p>Please update the status of this action item.</p>
    `
  });
}
```

**Env var required:** `RESEND_API_KEY=re_xxxxxxxxxxxx`

> ⚠️ For local testing without a real domain, use `onboarding@resend.dev` as sender and only send to the email registered in your Resend account.

---

## 📱 Endpoint Inventory

| Method | Path | Auth | Status Code | Description |
|--------|------|------|-------------|-------------|
| `POST` | `/api/auth/register` | ❌ | 201 | Register new user |
| `POST` | `/api/auth/login` | ❌ | 200 | Login, get JWT |
| `POST` | `/api/meetings` | ✅ | 201 | Create meeting |
| `GET` | `/api/meetings` | ✅ | 200 | List meetings (paginated) |
| `GET` | `/api/meetings/:id` | ✅ | 200 | Get single meeting |
| `POST` | `/api/meetings/:id/analyze` | ✅ | 200 | Run AI analysis |
| `POST` | `/api/action-items` | ✅ | 201 | Create action item |
| `GET` | `/api/action-items` | ✅ | 200 | List action items (filtered) |
| `PATCH` | `/api/action-items/:id/status` | ✅ | 200 | Update status |
| `GET` | `/api/action-items/overdue` | ✅ | 200 | List overdue items |
| `GET` | `/health` | ❌ | 200 | Health check |
| `GET` | `/api/evaluation` | ❌ | 200 | Candidate evaluation info |
| `GET` | `/api/docs` | ❌ | — | Swagger UI |

---

## 🔄 Key User Flows

### Flow 1 — Full Happy Path

```
1. POST /api/auth/register          → Creates account
2. POST /api/auth/login             → Gets JWT token
3. POST /api/meetings               → Submits transcript
   → Server validates body (Zod)
   → Saves Meeting to PostgreSQL
   → Returns meeting.id
4. POST /api/meetings/:id/analyze   → Triggers AI
   → Builds Gemini prompt with transcript
   → Calls Gemini API
   → Validates citations against real timestamps
   → Saves MeetingAnalysis
   → Auto-creates ActionItem rows (status: PENDING)
   → Returns { summary, actionItems, decisions, followUpSuggestions }
5. GET  /api/action-items           → Lists all action items
6. PATCH /api/action-items/:id/status → Updates one to IN_PROGRESS
7. GET  /api/action-items/overdue   → Shows items past dueDate + not COMPLETED
```

### Flow 2 — Reminder Scheduler

```
Every 5 minutes:
  1. Cron fires
  2. Query: status != COMPLETED AND dueDate < NOW AND no reminder in last 24h
  3. For each result:
     a. Call Resend API → sends email to assignee
     b. INSERT into ReminderLog (SUCCESS or FAILED)
     c. Log with Winston: { traceId, actionItemId, sentAt }
```

### Flow 3 — Error Path

```
POST /api/meetings with missing title:
  1. Zod schema fails
  2. Zod error → mapped to { code: "VALIDATION_ERROR", message: "Title is required" }
  3. Global error handler catches it
  4. Response: 400 { traceId, success: false, error: { code, message } }
  5. Winston logs: { level: "warn", traceId, path, method, statusCode: 400 }
```

---

## 🏗️ Project Structure

```
src/
├── config/
│   ├── env.ts               # Typed env vars via process.env + validation
│   └── swagger.ts           # Swagger/OpenAPI config
├── middleware/
│   ├── auth.ts              # JWT verification middleware
│   ├── traceId.ts           # Generate/attach X-Trace-Id to req + res
│   ├── requestLogger.ts     # Winston logs per request
│   └── errorHandler.ts      # Global error handler → unified response
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.schema.ts   # Zod schemas
│   ├── meetings/
│   │   ├── meetings.routes.ts
│   │   ├── meetings.controller.ts
│   │   ├── meetings.service.ts
│   │   └── meetings.schema.ts
│   ├── analysis/
│   │   ├── analysis.routes.ts
│   │   ├── analysis.controller.ts
│   │   ├── analysis.service.ts
│   │   ├── analysis.prompt.ts   # Prompt builder
│   │   └── analysis.validator.ts # Citation validator
│   └── actionItems/
│       ├── actionItems.routes.ts
│       ├── actionItems.controller.ts
│       ├── actionItems.service.ts
│       └── actionItems.schema.ts
├── integrations/
│   └── resend.ts            # Email sender via Resend SDK
├── jobs/
│   └── reminderScheduler.ts # node-cron job
├── utils/
│   ├── logger.ts            # Winston instance
│   ├── response.ts          # successResponse() and errorResponse() helpers
│   └── traceId.ts           # UUID generator
├── prisma/
│   └── schema.prisma        # Full Prisma schema
├── __tests__/
│   ├── meetings.test.ts
│   ├── actionItems.test.ts
│   └── analysis.test.ts
└── app.ts                   # Express app, middleware, routes, cron start
```

---

## 🔁 Non-Functional Requirements

### NF-1: Unified Response Format (enforced via helpers)

```typescript
// utils/response.ts
export const successResponse = (data: unknown, traceId: string) => ({
  traceId,
  success: true,
  data
});

export const errorResponse = (code: string, message: string, traceId: string) => ({
  traceId,
  success: false,
  error: { code, message }
});
```

Every controller returns one of these two shapes — no exceptions.

### NF-2: Trace ID (middleware)

```typescript
// middleware/traceId.ts
export const traceIdMiddleware = (req, res, next) => {
  const traceId = (req.headers["x-trace-id"] as string) || crypto.randomUUID();
  req.traceId = traceId;
  res.setHeader("x-trace-id", traceId);
  next();
};
```

Mount FIRST in `app.ts` before all routes.

### NF-3: Structured Logging (Winston)

```typescript
// utils/logger.ts
import winston from "winston";
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});
```

Every log entry includes: `{ timestamp, traceId, method, path, statusCode, durationMs, error? }`

### NF-4: Global Error Handler

```typescript
// middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  const traceId = req.traceId;
  
  if (err instanceof ZodError) {
    logger.warn({ traceId, err: err.errors, msg: "Validation error" });
    return res.status(400).json(errorResponse("VALIDATION_ERROR", err.errors[0].message, traceId));
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json(errorResponse("UNAUTHORIZED", "Invalid or missing token", traceId));
  }

  logger.error({ traceId, err, msg: "Unhandled error" });
  return res.status(500).json(errorResponse("INTERNAL_ERROR", "Something went wrong", traceId));
};
```

Mount LAST in `app.ts`.

### NF-5: Input Validation (Zod)

All routes that accept a body use a Zod schema. Validation happens in a `validate()` middleware helper:

```typescript
export const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) throw result.error; // caught by errorHandler
  req.body = result.data;
  next();
};
```

---

## 🔐 Environment Variables

All secrets in `.env` file. Never hardcoded.

```env
# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your_super_secret_jwt_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hintro_db

# LLM
GEMINI_API_KEY=AIzaSy...

# Email
RESEND_API_KEY=re_...

# Scheduler
REMINDER_CRON_SCHEDULE=*/5 * * * *
```

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| All checklist items completed | 18/18 core items checked |
| All API endpoints return correct status codes | 100% |
| AI output always includes citations | 100% of insights have ≥1 citation |
| No hallucinated data in AI response | 0 fabricated entries (validated in code) |
| Scheduler triggers + logs reminder | Demonstrable in logs within 5 min |
| Email delivered through Resend | At least 1 real delivery shown |
| Swagger UI publicly accessible | `/api/docs` loads with all routes documented |
| App deployed and publicly accessible | Live URL in evaluation endpoint |
| All validation errors return 400 + code | Not 500 |
| App does not crash on bad input | Zero unhandled crashes |

---

## 🚫 Out of Scope (Do Not Build)

- Frontend / UI of any kind
- Real-time WebSocket features
- Audio/video transcription
- Multi-tenant organizations or workspaces
- Role-based access control (RBAC)
- Rate limiting (bonus only)
- Redis caching (bonus only)
- File upload (transcripts are JSON in request body)
- Multiple external integrations (implement exactly one — Resend)
- OAuth / social login
- Soft delete / archive functionality
- Pagination cursor-based (offset is fine)

---

## 🎯 Development Phases

### Phase 1 — Foundation (1.5 hrs)
- [ ] Init project: `npm init`, TypeScript config, ESLint, `.env`
- [ ] Install all dependencies
- [ ] Set up Prisma schema + `npx prisma migrate dev`
- [ ] Set up Express app with traceId, logging, and error handler middleware
- [ ] Implement `/health` and `/api/evaluation` endpoints

### Phase 2 — Auth + Meetings (1.5 hrs)
- [ ] `POST /api/auth/register` + `POST /api/auth/login`
- [ ] JWT middleware (`authMiddleware`)
- [ ] `POST /api/meetings` with Zod validation
- [ ] `GET /api/meetings/:id`
- [ ] `GET /api/meetings` with pagination

### Phase 3 — AI Analysis (2 hrs)
- [ ] Gemini API client setup
- [ ] Prompt builder (`analysis.prompt.ts`)
- [ ] `POST /api/meetings/:id/analyze`
- [ ] Citation validator (`analysis.validator.ts`)
- [ ] Auto-create ActionItems from analysis result
- [ ] Save MeetingAnalysis to DB

### Phase 4 — Action Items (1 hr)
- [ ] `POST /api/action-items`
- [ ] `GET /api/action-items` with filters
- [ ] `PATCH /api/action-items/:id/status`
- [ ] `GET /api/action-items/overdue`

### Phase 5 — Scheduler + Email (1 hr)
- [ ] Resend client setup (`integrations/resend.ts`)
- [ ] `reminderScheduler.ts` with node-cron
- [ ] ReminderLog insert on each send attempt
- [ ] Wire scheduler start into `app.ts`

### Phase 6 — Docs + Tests (1.5 hrs)
- [ ] Swagger JSDoc on all routes → `GET /api/docs`
- [ ] Jest unit tests: meetings service, action items service
- [ ] Supertest integration tests: create meeting → analyze → update status

### Phase 7 — Deploy (0.5 hrs)
- [ ] Push to GitHub (public repo)
- [ ] Create Railway project → add PostgreSQL plugin → set env vars
- [ ] `npm run build` → confirm deployment
- [ ] Verify `/health`, `/api/docs`, and `/api/evaluation` all return 200

---

## ✅ Definition of Done

The submission is complete when **all** of the following are true:

- [ ] Public GitHub repository exists with all source code
- [ ] Application is live at a public URL
- [ ] `GET /health` returns `{ "status": "UP" }`
- [ ] `GET /api/evaluation` returns candidate name, repo URL, deployed URL, and features list
- [ ] Swagger UI is accessible at `/api/docs` (no auth)
- [ ] All 10 API endpoints respond correctly
- [ ] AI analysis endpoint returns JSON with `summary`, `actionItems`, `decisions`, `followUpSuggestions` — all with citations
- [ ] No AI-generated insight references a timestamp not present in the input transcript
- [ ] Scheduler runs every 5 minutes and logs output
- [ ] At least one reminder email delivered through Resend
- [ ] `ReminderLog` table has at least one row after a scheduled run
- [ ] `README.md` covers setup, env vars, local run, and deploy steps
- [ ] `DECISIONS.md` covers DB, auth, integration choices with rationale
- [ ] `AI_APPROACH.md` covers prompt design and citation/grounding strategy
- [ ] `TESTING.md` covers scenarios tested and edge cases
- [ ] `CHECKLIST.md` submitted with all core items marked `[x]`

---

## 🎨 Design System (API Conventions)

Since this is a backend, "design system" means API consistency rules:

| Convention | Rule |
|------------|------|
| **IDs** | UUID v4 everywhere (`crypto.randomUUID()`) |
| **Dates** | ISO 8601 format in all inputs and outputs |
| **HTTP Verbs** | POST = create, GET = read, PATCH = partial update |
| **Status Codes** | 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict, 500 Server Error |
| **Error codes** | SCREAMING_SNAKE_CASE strings: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `CONFLICT`, `INTERNAL_ERROR` |
| **Pagination** | Always `{ data: [], pagination: { total, page, limit, totalPages } }` |
| **Timestamps** | All DB timestamps in UTC |
| **JSON fields** | camelCase everywhere |
| **Auth header** | `Authorization: Bearer <token>` |
| **Trace header** | `X-Trace-Id: <uuid>` — in both request and response |

---

## 📦 Dependencies Reference

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.x",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "node-cron": "^3.0.3",
    "resend": "^2.0.0",
    "@google/generative-ai": "^0.3.0",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.x",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/node-cron": "^3.0.11",
    "@types/cors": "^2.8.17",
    "prisma": "^5.x",
    "jest": "^29.x",
    "supertest": "^6.3.4",
    "@types/jest": "^29.x",
    "@types/supertest": "^6.0.2",
    "ts-jest": "^29.x"
  }
}
```

---

*PRD Version 2.0 — All decisions pre-made. Start coding from Phase 1.*  
*Prepared for: Hintro Backend/Fullstack Engineering Internship Assignment*
