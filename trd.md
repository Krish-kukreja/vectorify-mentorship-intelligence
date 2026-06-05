**TECHNICAL REQUIREMENTS DOCUMENT**

**Meeting Intelligence Service**

Hintro Backend / Fullstack Engineering Internship

| **Field**           | **Value**                                      |
| ------------------- | ---------------------------------------------- |
| Document Type       | Technical Requirements Document (TRD)          |
| Target Product      | REST API Backend Service                       |
| PRD Version         | v2.0 (All decisions pre-made)                  |
| TRD Version         | v1.0                                           |
| Developer Profile   | Beginner - AI-assisted build (Cursor / Claude) |
| Timeline Target     | 2-3 days at 6-8 hrs/day                        |
| Cost Target         | \$0/month for first 1,000 users                |
| Deployment Platform | Railway (free tier)                            |
| Database            | PostgreSQL via Railway plugin                  |
| AI LLM Provider     | Google Gemini 1.5 Flash (free tier)            |
| Email Provider      | Resend (100 emails/day free)                   |

**⚠️ Starting Fresh - Account Setup Required Before Coding**

• Create Google AI Studio account → get GEMINI_API_KEY at aistudio.google.com

• Create Resend account → get RESEND_API_KEY at resend.com (free, no credit card)

• Create Railway account → free PostgreSQL plugin at railway.app

• Create GitHub account (public repo required for submission)

• All four are free and take ~15 minutes total to set up

**📊 1. Document Overview**

_Purpose, scope, and how to use this TRD with AI coding tools_

## **What This Document Is**

This TRD translates the Hintro PRD into exact technical specifications optimised for AI coding tools. Every table, field name, API signature, and configuration value here is the single source of truth your AI coding assistant should use. Do not deviate from these names - AI tools will use them verbatim.

## **How to Use This TRD with AI Tools**

Recommended workflow for each build phase:

- Open this TRD alongside your AI coding tool (Cursor, Claude, etc.)
- Copy the exact section relevant to the feature you are building
- Paste it as context into your AI prompt, then ask it to implement
- Field names, table names, and API paths must match exactly - do not rename them
- If the AI suggests a different library or pattern, override it with what this document specifies

## **Scope Confirmation**

This is a pure backend REST API. There is no frontend, no mobile app, and no WebSocket. The deliverables are:

- A running Express.js TypeScript API deployed on Railway
- A PostgreSQL database managed via Prisma ORM
- AI-powered meeting analysis via Google Gemini 1.5 Flash
- Automated overdue reminder emails via Resend
- A scheduled job (node-cron) that runs every 5 minutes
- Swagger UI documentation at /api/docs
- Jest + Supertest test suite with full endpoint coverage
- A public GitHub repository with all required markdown documentation

**🏗️ 2. System Architecture**

_Component layout and data flow_

## **Architecture Diagram**

All components run on Railway's free tier. There is no separate frontend server.

**HTTP CLIENT (curl / Postman / Evaluator)**

↓ Authorization: Bearer &lt;JWT&gt; | X-Trace-Id: &lt;uuid&gt;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**EXPRESS.JS API (Railway Node.js Service)**

Middleware: traceId → requestLogger → authMiddleware → Zod validate → errorHandler

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌────────────────┐ ┌─────────────────┐ ┌───────────────┐

│ PRISMA ORM │ │ GEMINI 1.5 │ │ RESEND API │

│ ↕ │ │ FLASH (LLM) │ │ (Email) │

│ POSTGRESQL │ │ aistudio API │ │ resend.com │

│ (Railway DB) │ │ │ │ │

└────────────────┘ └─────────────────┘ └───────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NODE-CRON SCHEDULER (in-process, every 5 min)**

Queries overdue ActionItems → Sends Resend emails → Writes ReminderLog rows

## **Request Lifecycle (Every API Call)**

- HTTP request arrives → traceId middleware generates X-Trace-Id UUID
- requestLogger middleware records method, path, timestamp
- authMiddleware verifies JWT Bearer token (skipped on public routes)
- validate() middleware runs Zod schema against req.body
- Controller calls Service function → Service calls Prisma
- Service may call Gemini API or Resend (on analysis/email routes)
- Controller wraps result in successResponse() helper
- Response sent with X-Trace-Id header
- requestLogger records status code and duration
- Any thrown error is caught by errorHandler middleware → errorResponse()

**🛠️ 3. Technology Stack**

_Exact package names and versions for AI tools to use_

## **Runtime & Framework**

| **Component**   | **Package / Technology** | **Version** | **Why**                                      |
| --------------- | ------------------------ | ----------- | -------------------------------------------- |
| Runtime         | Node.js                  | 20+         | LTS; free on Railway                         |
| Language        | TypeScript               | 5.x         | Type safety; better AI completion            |
| Framework       | express                  | ^4.18.2     | Lightweight; standard; AI knows it perfectly |
| Env vars        | dotenv                   | ^16.3.1     | Simple .env loading                          |
| CORS            | cors                     | ^2.8.5      | Required for cross-origin requests           |
| Process manager | ts-node-dev              | ^2.0.0      | Auto-reload in development                   |

## **Database & ORM**

| **Component** | **Package / Technology** | **Version** | **Why**                                 |
| ------------- | ------------------------ | ----------- | --------------------------------------- |
| Database      | PostgreSQL               | 15+         | Relational; free Railway plugin         |
| ORM           | @prisma/client           | ^5.x        | TypeScript-native; auto-generates types |
| ORM CLI       | prisma                   | ^5.x        | Migrations via npx prisma migrate dev   |

## **Authentication**

| **Component**        | **Package / Technology** | **Version** | **Why**                      |
| -------------------- | ------------------------ | ----------- | ---------------------------- |
| JWT signing/verify   | jsonwebtoken             | ^9.0.2      | Industry standard; stateless |
| JWT TypeScript types | @types/jsonwebtoken      | ^9.0.5      | Required for TS              |
| Password hashing     | bcryptjs                 | ^2.4.3      | Pure JS; no native bindings  |
| bcrypt types         | @types/bcryptjs          | ^2.4.6      | Required for TS              |

## **Validation, Logging & Docs**

| **Component**      | **Package / Technology** | **Version** | **Why**                                       |
| ------------------ | ------------------------ | ----------- | --------------------------------------------- |
| Input validation   | zod                      | ^3.22.4     | Schema-first; TypeScript-native; clear errors |
| Structured logging | winston                  | ^3.11.0     | JSON logs; log levels; easy to configure      |
| API docs UI        | swagger-ui-express       | ^5.0.0      | Auto Swagger UI at /api/docs                  |
| Swagger spec gen   | swagger-jsdoc            | ^6.2.8      | JSDoc comments → OpenAPI spec                 |
| cors types         | @types/cors              | ^2.8.17     | Required for TS                               |
| express types      | @types/express           | ^4.17.21    | Required for TS                               |
| node types         | @types/node              | ^20.x       | Required for TS                               |

## **AI, Email & Scheduling**

| **Component**   | **Package / Technology** | **Version** | **Why**                          |
| --------------- | ------------------------ | ----------- | -------------------------------- |
| LLM SDK         | @google/generative-ai    | ^0.3.0      | Official Gemini SDK; free tier   |
| Email           | resend                   | ^2.0.0      | 100 emails/day free; 5-min setup |
| Job scheduler   | node-cron                | ^3.0.3      | In-process cron; no Redis needed |
| node-cron types | @types/node-cron         | ^3.0.11     | Required for TS                  |

## **Testing**

| **Component**   | **Package / Technology** | **Version** | **Why**                               |
| --------------- | ------------------------ | ----------- | ------------------------------------- |
| Test runner     | jest                     | ^29.x       | Industry standard; rich assertions    |
| HTTP testing    | supertest                | ^6.3.4      | Test Express without a running server |
| Jest TS config  | ts-jest                  | ^29.x       | Run TypeScript tests directly         |
| Jest types      | @types/jest              | ^29.x       | TS support for test functions         |
| Supertest types | @types/supertest         | ^6.0.2      | TS support for HTTP assertions        |

**💡 Key Installation Reminder**

• Install all dependencies in one shot: npm install express @prisma/client jsonwebtoken bcryptjs zod winston node-cron resend @google/generative-ai swagger-ui-express swagger-jsdoc cors dotenv

• Install all devDependencies: npm install -D typescript ts-node ts-node-dev @types/express @types/node @types/jsonwebtoken @types/bcryptjs @types/node-cron @types/cors prisma jest supertest ts-jest @types/jest @types/supertest

• Initialize Prisma after installing: npx prisma init

**🗄️ 4. Database Schema**

_Exact Prisma model definitions - copy these verbatim into schema.prisma_

## **Complete Prisma Schema**

File location: src/prisma/schema.prisma. Copy this entire block verbatim. Do not rename any field.

generator client {

provider = "prisma-client-js"

}

datasource db {

provider = "postgresql"

url = env("DATABASE_URL")

}

model User {

id String @id @default(uuid())

email String @unique

passwordHash String

createdAt DateTime @default(now())

meetings Meeting\[\]

}

model Meeting {

id String @id @default(uuid())

userId String

user User @relation(fields: \[userId\], references: \[id\])

title String

participants String\[\]

meetingDate DateTime

transcript Json

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

analysis MeetingAnalysis?

actionItems ActionItem\[\]

}

model MeetingAnalysis {

id String @id @default(uuid())

meetingId String @unique

meeting Meeting @relation(fields: \[meetingId\], references: \[id\])

summary Json

actionItems Json

decisions Json

followUpSuggestions Json

createdAt DateTime @default(now())

}

model ActionItem {

id String @id @default(uuid())

meetingId String

meeting Meeting @relation(fields: \[meetingId\], references: \[id\])

task String

assignee String

status ActionStatus @default(PENDING)

dueDate DateTime?

citations Json?

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

reminders ReminderLog\[\]

}

enum ActionStatus {

PENDING

IN_PROGRESS

COMPLETED

}

model ReminderLog {

id String @id @default(uuid())

actionItemId String

actionItem ActionItem @relation(fields: \[actionItemId\], references: \[id\])

channel String

deliveryStatus String

response String?

sentAt DateTime @default(now())

}

## **Field Reference Guide**

| **Model**       | **Field**           | **Type**      | **Required** | **Notes**                                |
| --------------- | ------------------- | ------------- | ------------ | ---------------------------------------- |
| User            | id                  | String (UUID) | ✅ auto      | crypto.randomUUID() via Prisma           |
| User            | email               | String        | ✅           | Must be unique across all users          |
| User            | passwordHash        | String        | ✅           | bcryptjs hash, never store plaintext     |
| Meeting         | userId              | String (FK)   | ✅           | Foreign key → User.id                    |
| Meeting         | title               | String        | ✅           | Min 1 char (Zod enforced)                |
| Meeting         | participants        | String\[\]    | ✅           | Array of email strings                   |
| Meeting         | meetingDate         | DateTime      | ✅           | ISO 8601 input, stored UTC               |
| Meeting         | transcript          | Json          | ✅           | Array of {timestamp, speaker, text}      |
| MeetingAnalysis | summary             | Json          | ✅           | Array of {text, citations\[\]}           |
| MeetingAnalysis | actionItems         | Json          | ✅           | Array of {task, assignee, citations\[\]} |
| MeetingAnalysis | decisions           | Json          | ✅           | Array of {text, citations\[\]}           |
| MeetingAnalysis | followUpSuggestions | Json          | ✅           | Array of {text, citations\[\]}           |
| ActionItem      | status              | ActionStatus  | ✅ auto      | Default: PENDING on create               |
| ActionItem      | assignee            | String        | ✅           | Email address of assignee                |
| ActionItem      | dueDate             | DateTime?     | ❌           | Optional; triggers overdue logic if set  |
| ActionItem      | citations           | Json?         | ❌           | Array of {timestamp: string}             |
| ReminderLog     | channel             | String        | ✅           | Always 'email' in current version        |
| ReminderLog     | deliveryStatus      | String        | ✅           | Either 'SUCCESS' or 'FAILED'             |
| ReminderLog     | response            | String?       | ❌           | Error message if FAILED                  |

## **Migration Commands**

Run these commands in exact order after writing schema.prisma:

- npx prisma migrate dev --name init ← Creates tables in Railway PostgreSQL
- npx prisma generate ← Regenerates Prisma Client with TypeScript types
- npx prisma studio ← Opens browser GUI to browse/edit data (optional, dev only)
- npx prisma migrate deploy ← Use this on Railway production, not migrate dev

**📁 5. Project File Structure**

_Exact directory layout - create this before writing any code_

Tell your AI coding tool to create this exact structure first. It prevents import errors and helps the AI understand where each file lives.

hintro-api/

├── src/

│ ├── config/

│ │ ├── env.ts # Typed env var access (no raw process.env elsewhere)

│ │ └── swagger.ts # swagger-jsdoc config object

│ ├── middleware/

│ │ ├── auth.ts # JWT verify → attaches req.userId

│ │ ├── traceId.ts # Generate/attach X-Trace-Id to req + res

│ │ ├── requestLogger.ts # Winston log per request (method, path, ms)

│ │ ├── validate.ts # Zod wrapper: validate(schema) middleware

│ │ └── errorHandler.ts # Global error handler → errorResponse()

│ ├── modules/

│ │ ├── auth/

│ │ │ ├── auth.routes.ts

│ │ │ ├── auth.controller.ts

│ │ │ ├── auth.service.ts

│ │ │ └── auth.schema.ts # Zod: RegisterSchema, LoginSchema

│ │ ├── meetings/

│ │ │ ├── meetings.routes.ts

│ │ │ ├── meetings.controller.ts

│ │ │ ├── meetings.service.ts

│ │ │ └── meetings.schema.ts # Zod: CreateMeetingSchema, ListQuerySchema

│ │ ├── analysis/

│ │ │ ├── analysis.routes.ts

│ │ │ ├── analysis.controller.ts

│ │ │ ├── analysis.service.ts

│ │ │ ├── analysis.prompt.ts # buildPrompt(transcript) function

│ │ │ └── analysis.validator.ts # validateCitations() function

│ │ └── actionItems/

│ │ ├── actionItems.routes.ts

│ │ ├── actionItems.controller.ts

│ │ ├── actionItems.service.ts

│ │ └── actionItems.schema.ts # Zod: CreateActionItemSchema, etc.

│ ├── integrations/

│ │ └── resend.ts # sendReminderEmail(item: ActionItem)

│ ├── jobs/

│ │ └── reminderScheduler.ts # startReminderScheduler() export

│ ├── utils/

│ │ ├── logger.ts # Winston instance (export: logger)

│ │ ├── response.ts # successResponse() + errorResponse() helpers

│ │ └── prisma.ts # Prisma client singleton (export: prisma)

│ ├── prisma/

│ │ └── schema.prisma

│ ├── \__tests_\_/

│ │ ├── auth.test.ts

│ │ ├── meetings.test.ts

│ │ ├── analysis.test.ts

│ │ └── actionItems.test.ts

│ └── app.ts # Express app bootstrap + route mounting

├── .env # Local secrets (NEVER commit)

├── .env.example # Template with keys but no values (COMMIT this)

├── .gitignore # node_modules, .env, dist/

├── tsconfig.json

├── jest.config.ts

├── package.json

├── README.md

├── DECISIONS.md

├── AI_APPROACH.md

├── TESTING.md

└── CHECKLIST.md

**🚨 Critical: The Prisma singleton pattern**

• Create src/utils/prisma.ts that exports a single PrismaClient instance

• Import this shared instance in EVERY service file: import { prisma } from '../utils/prisma'

• Never call new PrismaClient() inside a service or job - it causes connection pool exhaustion

• This is the single most common mistake beginners make with Prisma

**🔌 6. API Design**

_Every endpoint with inputs, outputs, and error cases_

## **Response Envelope - All Endpoints**

Every single response must use one of these two shapes. No exceptions.

| **Field**     | **Success Response**           | **Error Response**             |
| ------------- | ------------------------------ | ------------------------------ |
| traceId       | UUID string (from req.traceId) | UUID string (from req.traceId) |
| success       | true                           | false                          |
| data          | The response payload object    | (omitted)                      |
| error.code    | (omitted)                      | SCREAMING_SNAKE_CASE string    |
| error.message | (omitted)                      | Human-readable description     |

## **Standard HTTP Status Codes**

| **Code**                  | **When to Use**                                | **Error Code String** |
| ------------------------- | ---------------------------------------------- | --------------------- |
| 200 OK                    | Successful GET or PATCH                        | (no error)            |
| 201 Created               | Successful POST that creates a resource        | (no error)            |
| 400 Bad Request           | Zod validation fails on request body           | VALIDATION_ERROR      |
| 401 Unauthorized          | Missing or invalid JWT token                   | UNAUTHORIZED          |
| 404 Not Found             | Resource ID not found in DB                    | NOT_FOUND             |
| 409 Conflict              | Resource already exists (e.g. analysis exists) | CONFLICT              |
| 502 Bad Gateway           | LLM API (Gemini) call failed after retry       | LLM_ERROR             |
| 500 Internal Server Error | Any other unhandled exception                  | INTERNAL_ERROR        |

## **Auth Endpoints**

| **Endpoint**            | **Method**               | **Auth**  | **Status** |
| ----------------------- | ------------------------ | --------- | ---------- |
| POST /api/auth/register | Create new user account  | ❌ Public | 201        |
| POST /api/auth/login    | Login, receive JWT token | ❌ Public | 200        |

### **POST /api/auth/register**

Request body fields (all required):

- email - string, valid email format
- password - string, minimum 8 characters

Success response data fields:

- id - UUID of the created user
- email - the registered email
- createdAt - ISO 8601 timestamp

Error cases:

- 400 VALIDATION_ERROR - email invalid or password too short
- 409 CONFLICT - email already registered

### **POST /api/auth/login**

Request body fields (all required):

- email - string
- password - string

Success response data fields:

- token - JWT string
- expiresIn - '7d'

Error cases:

- 400 VALIDATION_ERROR - missing fields
- 401 UNAUTHORIZED - email not found or password incorrect

## **Meeting Endpoints**

| **Endpoint**                   | **Description**                              | **Auth** | **Status** |
| ------------------------------ | -------------------------------------------- | -------- | ---------- |
| POST /api/meetings             | Create meeting with transcript               | ✅ JWT   | 201        |
| GET /api/meetings              | List meetings (paginated)                    | ✅ JWT   | 200        |
| GET /api/meetings/:id          | Get single meeting + analysis + action items | ✅ JWT   | 200        |
| POST /api/meetings/:id/analyze | Run Gemini AI analysis on transcript         | ✅ JWT   | 200        |

### **POST /api/meetings - Request Body**

| **Field**                | **Type**   | **Required** | **Validation Rule**                           |
| ------------------------ | ---------- | ------------ | --------------------------------------------- |
| title                    | string     | ✅           | min 1 character                               |
| participants             | string\[\] | ✅           | array of valid emails, min 1 item             |
| meetingDate              | string     | ✅           | valid ISO 8601 datetime string                |
| transcript               | object\[\] | ✅           | min 1 item; each has timestamp, speaker, text |
| transcript\[\].timestamp | string     | ✅           | min 1 char (e.g. '00:10')                     |
| transcript\[\].speaker   | string     | ✅           | min 1 char                                    |
| transcript\[\].text      | string     | ✅           | min 1 char                                    |

### **GET /api/meetings - Query Parameters**

| **Param** | **Type**        | **Default** | **Max** | **Description**                         |
| --------- | --------------- | ----------- | ------- | --------------------------------------- |
| page      | number          | 1           | -       | Page number for pagination              |
| limit     | number          | 10          | 100     | Items per page                          |
| from      | ISO date string | -           | -       | Filter: meetings on or after this date  |
| to        | ISO date string | -           | -       | Filter: meetings on or before this date |

GET /api/meetings response data shape:

- meetings - array of Meeting objects (see DB schema for fields)
- pagination.total - total matching rows in DB
- pagination.page - current page number
- pagination.limit - current limit
- pagination.totalPages - calculated: Math.ceil(total / limit)

## **Action Item Endpoints**

| **Endpoint**                       | **Description**                                | **Auth** | **Status** |
| ---------------------------------- | ---------------------------------------------- | -------- | ---------- |
| POST /api/action-items             | Create a manual action item                    | ✅ JWT   | 201        |
| GET /api/action-items              | List action items with filters + pagination    | ✅ JWT   | 200        |
| PATCH /api/action-items/:id/status | Update status to PENDING/IN_PROGRESS/COMPLETED | ✅ JWT   | 200        |
| GET /api/action-items/overdue      | List all non-COMPLETED items past dueDate      | ✅ JWT   | 200        |

### **POST /api/action-items - Request Body**

| **Field** | **Type**   | **Required** | **Validation Rule**                      |
| --------- | ---------- | ------------ | ---------------------------------------- |
| task      | string     | ✅           | min 1 character                          |
| assignee  | string     | ✅           | valid email address                      |
| meetingId | string     | ✅           | valid UUID; must exist in Meeting table  |
| dueDate   | string     | ❌           | valid ISO 8601 datetime if provided      |
| citations | object\[\] | ❌           | array of {timestamp: string} if provided |

### **PATCH /api/action-items/:id/status - Request Body**

| **Field** | **Type**      | **Required** | **Allowed Values**                  |
| --------- | ------------- | ------------ | ----------------------------------- |
| status    | string (enum) | ✅           | PENDING \| IN_PROGRESS \| COMPLETED |

### **GET /api/action-items - Query Parameters**

| **Param** | **Type**     | **Default** | **Description**                             |
| --------- | ------------ | ----------- | ------------------------------------------- |
| status    | enum string  | -           | Filter: PENDING \| IN_PROGRESS \| COMPLETED |
| assignee  | email string | -           | Filter by assignee email                    |
| meetingId | UUID string  | -           | Filter by parent meeting                    |
| page      | number       | 1           | Pagination page                             |
| limit     | number       | 10          | Items per page                              |

## **System Endpoints (No Auth Required)**

| **Endpoint**        | **Response**                                      | **Purpose**                           |
| ------------------- | ------------------------------------------------- | ------------------------------------- |
| GET /health         | { "status": "UP" }                                | Railway health check; must return 200 |
| GET /api/evaluation | Candidate name, repo URL, live URL, features list | Hintro evaluator endpoint             |
| GET /api/docs       | Swagger UI HTML page                              | Interactive API documentation         |

**🤖 7. AI Integration**

_Gemini 1.5 Flash - setup, prompt, and output validation_

## **Gemini Setup**

| **Setting**      | **Value**                                                  |
| ---------------- | ---------------------------------------------------------- |
| SDK package      | @google/generative-ai version ^0.3.0                       |
| Model to use     | gemini-1.5-flash                                           |
| API key env var  | GEMINI_API_KEY                                             |
| Where to get key | aistudio.google.com → Get API Key → Create API Key         |
| Free tier limit  | 15 requests/minute, 1 million tokens/day                   |
| Response format  | JSON mode (structured output - forces valid JSON response) |
| Max retries      | 1 retry on failure, then return 502                        |
| File location    | src/modules/analysis/analysis.service.ts                   |

## **Exact System Prompt**

File location: src/modules/analysis/analysis.prompt.ts. Export a function buildPrompt(transcript) that injects the transcript JSON and returns this exact string:

You are a meeting analysis assistant.

Your job is to extract structured insights from a meeting transcript.

STRICT RULES:

1\. Only use information explicitly stated in the transcript below.

2\. Do NOT invent attendees, tasks, decisions, or outcomes.

3\. Every insight MUST include at least one citation with a "timestamp"

matching exactly one of the transcript entries.

4\. If something was not discussed, omit it entirely - do not guess or infer.

TRANSCRIPT:

{{transcript_json}} ← replace with JSON.stringify(transcript)

Respond ONLY with a valid JSON object in this exact format.

No markdown, no explanation, no code fences:

{

"summary": \[{ "text": "...", "citations": \[{ "timestamp": "00:10" }\] }\],

"actionItems": \[{ "task": "...", "assignee": "...",

"citations": \[{ "timestamp": "..." }\] }\],

"decisions": \[{ "text": "...", "citations": \[{ "timestamp": "..." }\] }\],

"followUpSuggestions": \[{ "text": "...", "citations": \[{ "timestamp": "..." }\] }\]

}

## **Citation Validation - Required**

File location: src/modules/analysis/analysis.validator.ts. This function must run before saving analysis to DB:

| **Step**                        | **What to Do**                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| 1\. Extract valid timestamps    | Build a Set&lt;string&gt; from all transcript\[\].timestamp values                   |
| 2\. Check summary citations     | For each item in summary\[\], check each citation.timestamp exists in the Set        |
| 3\. Check actionItems citations | Same for actionItems\[\]                                                             |
| 4\. Check decisions citations   | Same for decisions\[\]                                                               |
| 5\. Check followUpSuggestions   | Same for followUpSuggestions\[\]                                                     |
| 6\. On invalid citation found   | Log a WARNING with Winston (do not throw), strip the invalid citation from the array |
| 7\. Return cleaned analysis     | Return the analysis object with only valid citations remaining                       |

## **Auto-Create ActionItems from Analysis**

Immediately after saving MeetingAnalysis to the DB, loop over analysis.actionItems array and insert one ActionItem row per item:

| **ActionItem field** | **Source from Gemini output**                 |
| -------------------- | --------------------------------------------- |
| meetingId            | The meeting ID from the route param (:id)     |
| task                 | actionItem.task from Gemini array             |
| assignee             | actionItem.assignee from Gemini array         |
| status               | PENDING (hardcoded on creation)               |
| citations            | actionItem.citations array from Gemini output |
| dueDate              | null (Gemini does not set due dates)          |

## **Gemini Error Handling**

| **Scenario**                   | **What to Do**                               |
| ------------------------------ | -------------------------------------------- |
| API call throws an error       | Catch error, wait 1000ms, retry once         |
| Retry also fails               | Return 502 with error code LLM_ERROR         |
| Response is not valid JSON     | Return 502 with error code LLM_ERROR         |
| Response missing required keys | Return 502 with error code LLM_ERROR         |
| Rate limit hit (429)           | Same as above - treat as failure, return 502 |

**⏰ 8. Scheduler & Email Integration**

_node-cron + Resend configuration and flow_

## **Reminder Scheduler**

| **Setting**      | **Value**                                                        |
| ---------------- | ---------------------------------------------------------------- |
| Library          | node-cron version ^3.0.3                                         |
| Cron expression  | \*/5 \* \* \* \* (every 5 minutes)                               |
| Env var override | REMINDER_CRON_SCHEDULE (optional - defaults to \*/5 \* \* \* \*) |
| File location    | src/jobs/reminderScheduler.ts                                    |
| Export           | startReminderScheduler() - called once in app.ts at startup      |
| Runs in          | Same Node.js process as the API (no separate worker)             |

## **Scheduler Logic Flow**

- Cron fires → generate new traceId for this run
- Query: find ActionItems where status != COMPLETED AND dueDate < now()
- Filter out items that already have a ReminderLog with sentAt > now - 24h
- For each remaining item: call sendReminderEmail(item)
- If email succeeds: INSERT ReminderLog with deliveryStatus = 'SUCCESS'
- If email throws: INSERT ReminderLog with deliveryStatus = 'FAILED', response = error message
- Log each attempt with Winston: { traceId, actionItemId, deliveryStatus, sentAt }

## **Resend Email Setup**

| **Setting**                 | **Value**                                                                    |
| --------------------------- | ---------------------------------------------------------------------------- |
| Library                     | resend version ^2.0.0                                                        |
| API key env var             | RESEND_API_KEY                                                               |
| Where to get key            | resend.com → Sign Up → API Keys → Create API Key                             |
| Free tier limit             | 100 emails per day, no credit card required                                  |
| File location               | src/integrations/resend.ts                                                   |
| Sender address (testing)    | <onboarding@resend.dev> ← use this without a custom domain                   |
| Sender address (production) | <reminders@yourdomain.com> ← requires domain verification                    |
| Send-to restriction         | During testing: can only send to the email registered in your Resend account |

## **Email Template Fields**

| **HTML Element** | **Content**                                      |
| ---------------- | ------------------------------------------------ |
| Subject line     | ⏰ Overdue: {item.task}                          |
| H2 heading       | Action Item Overdue                              |
| Task line        | Task: {item.task}                                |
| Assigned line    | Assigned To: {item.assignee}                     |
| Due date line    | Due Date: {item.dueDate formatted as YYYY-MM-DD} |
| CTA line         | Please update the status of this action item.    |

**🔒 9. Security & Validation**

_JWT auth, Zod schemas, and middleware order_

## **JWT Configuration**

| **Setting**      | **Value**                                                   |
| ---------------- | ----------------------------------------------------------- |
| Secret env var   | JWT_SECRET                                                  |
| Token expiry     | 7d                                                          |
| Algorithm        | HS256 (default for jsonwebtoken)                            |
| Header format    | Authorization: Bearer &lt;token&gt;                         |
| Token payload    | { userId: string, email: string, iat: number, exp: number } |
| On missing token | Return 401 UNAUTHORIZED immediately                         |
| On invalid token | Return 401 UNAUTHORIZED (do not reveal why it is invalid)   |
| On expired token | Return 401 UNAUTHORIZED                                     |

## **Protected vs Public Routes**

| **Route Pattern**    | **Auth Required** | **Reason**                           |
| -------------------- | ----------------- | ------------------------------------ |
| /health              | ❌ Public         | Railway health checks have no auth   |
| /api/docs            | ❌ Public         | Evaluators must access without token |
| /api/evaluation      | ❌ Public         | Evaluators must access without token |
| /api/auth/register   | ❌ Public         | Creates the account                  |
| /api/auth/login      | ❌ Public         | Returns the token                    |
| /api/meetings/\*     | ✅ Required       | User data; must be authenticated     |
| /api/action-items/\* | ✅ Required       | User data; must be authenticated     |

## **Middleware Mounting Order in app.ts**

The ORDER of middleware matters in Express. Mount them exactly in this sequence:

| **Order** | **Middleware**          | **Why This Position**                                |
| --------- | ----------------------- | ---------------------------------------------------- |
| 1st       | cors()                  | Before everything else so CORS headers are set early |
| 2nd       | express.json()          | Parse JSON bodies before any route runs              |
| 3rd       | traceIdMiddleware       | Generate traceId before logging or routes            |
| 4th       | requestLoggerMiddleware | Log every request (traceId must exist first)         |
| 5th       | Routes mounted          | All /api/\* and /health routes                       |
| Last      | errorHandler            | Catches ALL errors from routes - must be last        |

## **Zod Validation Schemas Summary**

| **Schema Name**            | **File**              | **Fields Validated**                                           |
| -------------------------- | --------------------- | -------------------------------------------------------------- |
| RegisterSchema             | auth.schema.ts        | email (valid email), password (min 8 chars)                    |
| LoginSchema                | auth.schema.ts        | email (valid email), password (string)                         |
| CreateMeetingSchema        | meetings.schema.ts    | title, participants\[\], meetingDate, transcript\[\]           |
| ListMeetingsQuerySchema    | meetings.schema.ts    | page (number), limit (max 100), from (date), to (date)         |
| CreateActionItemSchema     | actionItems.schema.ts | task, assignee (email), meetingId (UUID), dueDate?, citations? |
| UpdateStatusSchema         | actionItems.schema.ts | status (enum: PENDING \| IN_PROGRESS \| COMPLETED)             |
| ListActionItemsQuerySchema | actionItems.schema.ts | status?, assignee?, meetingId?, page, limit                    |

## **Password Security**

- Hash algorithm: bcryptjs with saltRounds = 10
- Never store plaintext password anywhere - not in DB, not in logs
- Never return passwordHash field in any API response
- On login: use bcrypt.compare(plaintext, storedHash) - never decrypt

**🔑 10. Environment Variables**

_Complete .env reference - never hardcode these values_

| **Variable**           | **Required** | **Example Value**                               | **Where to Get It**                                                                |
| ---------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| PORT                   | ✅           | 3000                                            | Set to 3000 locally; Railway auto-sets this                                        |
| NODE_ENV               | ✅           | development                                     | development locally; production on Railway                                         |
| JWT_SECRET             | ✅           | my_super_secret_32chars_minimum                 | Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" |
| DATABASE_URL           | ✅           | postgresql://user:pass@localhost:5432/hintro_db | Railway → PostgreSQL plugin → Connect → Connection URL                             |
| GEMINI_API_KEY         | ✅           | AIzaSyXXXXXXXXXXXXXXXXXX                        | aistudio.google.com → Get API Key                                                  |
| RESEND_API_KEY         | ✅           | re_xxxxxxxxxxxxxxxxxxxx                         | resend.com → API Keys → Create                                                     |
| REMINDER_CRON_SCHEDULE | ❌           | \*/5 \* \* \* \*                                | Optional override; defaults to every 5 min                                         |

**🚨 Never Commit .env to GitHub**

• Add .env to your .gitignore file immediately after creating it

• Create a .env.example file with the same keys but empty values - this IS safe to commit

• If you accidentally push .env to GitHub, revoke all API keys immediately and generate new ones

• Railway reads env vars from its own dashboard - set them there separately from your local .env

## **Local Development Setup**

Steps to get running locally for the first time:

- Install PostgreSQL locally or use a free cloud DB (Neon.tech recommended for local dev)
- Create a new database: createdb hintro_db
- Copy .env.example to .env and fill in all values
- Run: npm install
- Run: npx prisma migrate dev --name init
- Run: npx prisma generate
- Run: npm run dev (starts ts-node-dev with auto-reload)
- Test: GET <http://localhost:3000/health> should return { status: 'UP' }

**🧪 11. Testing Strategy**

_Full endpoint coverage with Jest + Supertest_

You selected full coverage on every endpoint. This section defines every test case to implement. Each file maps to one module.

## **Jest Configuration**

| **Setting**          | **Value**                                                               |
| -------------------- | ----------------------------------------------------------------------- |
| Config file          | jest.config.ts in project root                                          |
| Preset               | ts-jest                                                                 |
| Test environment     | node                                                                    |
| Test file pattern    | src/\__tests_\_/\*\*/\*.test.ts                                         |
| Test database        | Use a separate test DB via TEST_DATABASE_URL env var, or mock Prisma    |
| Recommended approach | Mock Prisma Client using jest.mock('../utils/prisma') in each test file |

## **auth.test.ts - Required Test Cases**

| **Test Name**             | **Method**              | **Scenario**           | **Expected**                        |
| ------------------------- | ----------------------- | ---------------------- | ----------------------------------- |
| register: success         | POST /api/auth/register | Valid email + password | 201 + user object (no passwordHash) |
| register: invalid email   | POST /api/auth/register | email = 'notanemail'   | 400 VALIDATION_ERROR                |
| register: short password  | POST /api/auth/register | password = '123'       | 400 VALIDATION_ERROR                |
| register: missing fields  | POST /api/auth/register | Empty body {}          | 400 VALIDATION_ERROR                |
| register: duplicate email | POST /api/auth/register | Same email twice       | 409 CONFLICT                        |
| login: success            | POST /api/auth/login    | Correct credentials    | 200 + { token, expiresIn }          |
| login: wrong password     | POST /api/auth/login    | Wrong password         | 401 UNAUTHORIZED                    |
| login: unknown email      | POST /api/auth/login    | Email not in DB        | 401 UNAUTHORIZED                    |

## **meetings.test.ts - Required Test Cases**

| **Test Name**               | **Method**                        | **Scenario**                    | **Expected**                      |
| --------------------------- | --------------------------------- | ------------------------------- | --------------------------------- |
| create: success             | POST /api/meetings                | Valid body + valid JWT          | 201 + meeting object with id      |
| create: no auth             | POST /api/meetings                | No Authorization header         | 401 UNAUTHORIZED                  |
| create: empty title         | POST /api/meetings                | title = ''                      | 400 VALIDATION_ERROR              |
| create: empty transcript    | POST /api/meetings                | transcript = \[\]               | 400 VALIDATION_ERROR              |
| create: invalid participant | POST /api/meetings                | participants = \['notanemail'\] | 400 VALIDATION_ERROR              |
| list: success               | GET /api/meetings                 | Valid JWT, no filters           | 200 + meetings array + pagination |
| list: with date filter      | GET /api/meetings?from=2026-01-01 | Valid JWT + from param          | 200 + filtered results            |
| list: invalid limit         | GET /api/meetings?limit=999       | limit > 100                     | 400 VALIDATION_ERROR              |
| get: found                  | GET /api/meetings/:id             | Valid ID + JWT                  | 200 + full meeting object         |
| get: not found              | GET /api/meetings/:id             | Random UUID not in DB           | 404 NOT_FOUND                     |

## **analysis.test.ts - Required Test Cases**

| **Test Name**                   | **Scenario**                                 | **Expected**                                 |
| ------------------------------- | -------------------------------------------- | -------------------------------------------- |
| analyze: success                | Valid meeting ID + Gemini returns valid JSON | 200 + analysis with all four fields          |
| analyze: already exists         | Analysis already in DB for this meeting      | 409 CONFLICT (returns existing)              |
| analyze: meeting not found      | Random UUID not in DB                        | 404 NOT_FOUND                                |
| analyze: gemini fails           | Gemini mock throws error twice               | 502 LLM_ERROR                                |
| citation validation: strips bad | Gemini returns timestamp not in transcript   | Analysis saved with invalid citation removed |

## **actionItems.test.ts - Required Test Cases**

| **Test Name**                      | **Method**                                         | **Scenario**                      | **Expected**                |
| ---------------------------------- | -------------------------------------------------- | --------------------------------- | --------------------------- |
| create: success                    | POST /api/action-items                             | Valid body + JWT                  | 201 + action item           |
| create: invalid assignee           | POST /api/action-items                             | assignee = 'notanemail'           | 400 VALIDATION_ERROR        |
| create: meeting not found          | POST /api/action-items                             | meetingId does not exist          | 404 NOT_FOUND               |
| create: missing task               | POST /api/action-items                             | No task field                     | 400 VALIDATION_ERROR        |
| update status: pending→in_progress | PATCH /api/action-items/:id/status                 | { status: 'IN_PROGRESS' }         | 200 + updated item          |
| update status: invalid value       | PATCH /api/action-items/:id/status                 | { status: 'DONE' }                | 400 VALIDATION_ERROR        |
| update status: not found           | PATCH /api/action-items/:id/status                 | Random UUID                       | 404 NOT_FOUND               |
| list: filter by status             | GET /api/action-items?status=PENDING               | Valid JWT                         | 200 + only PENDING items    |
| list: filter by assignee           | GET /api/action-items?assignee=<alice@example.com> | Valid JWT                         | 200 + filtered items        |
| overdue: returns correct items     | GET /api/action-items/overdue                      | Items with dueDate < now          | 200 + overdue array         |
| overdue: excludes completed        | GET /api/action-items/overdue                      | Completed items with past dueDate | 200 + excluded from results |

**🚀 12. Deployment Strategy**

_Railway free tier - step-by-step from zero to live URL_

## **Required Files Before Deploying**

| **File**             | **Content Required**                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| package.json scripts | "build": "tsc", "start": "node dist/app.js", "dev": "ts-node-dev src/app.ts" |
| tsconfig.json        | outDir: './dist', rootDir: './src', strict: true, esModuleInterop: true      |
| .gitignore           | node_modules/, dist/, .env (never commit these)                              |
| Procfile (optional)  | web: node dist/app.js ← Railway auto-detects but this makes it explicit      |

## **Step-by-Step Railway Deployment**

| **Step** | **Action**                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| 1        | Push all code to a public GitHub repository                                                                |
| 2        | Go to railway.app → New Project → Deploy from GitHub repo                                                  |
| 3        | Select your repository → Railway auto-detects Node.js                                                      |
| 4        | In Railway dashboard → New → Database → Add PostgreSQL                                                     |
| 5        | Click the PostgreSQL service → Connect tab → copy the DATABASE_URL                                         |
| 6        | Go to your Node.js service → Variables tab                                                                 |
| 7        | Add all env vars: PORT=3000, NODE_ENV=production, JWT_SECRET, DATABASE_URL, GEMINI_API_KEY, RESEND_API_KEY |
| 8        | Railway will automatically run npm install and npm run build                                               |
| 9        | After build succeeds, Railway runs npm start (node dist/app.js)                                            |
| 10       | Click Generate Domain → get your public URL (e.g. hintro-api.up.railway.app)                               |
| 11       | Run Prisma migration on Railway: open the Railway shell → npx prisma migrate deploy                        |
| 12       | Test: GET <https://your-url.up.railway.app/health> → should return { status: 'UP' }                        |
| 13       | Test: GET <https://your-url.up.railway.app/api/docs> → should show Swagger UI                              |
| 14       | Copy the live URL into your /api/evaluation endpoint response                                              |

**💡 Railway Free Tier Limits**

• Free tier includes \$5 credit/month - enough for 24/7 small Node API + PostgreSQL

• PostgreSQL: 1GB storage free - more than enough for this project

• If the service sleeps after inactivity, the first request may be slow - this is normal

• Railway auto-deploys on every git push to main branch - no manual deploys needed after setup

## **Post-Deploy Verification Checklist**

- GET /health returns { "status": "UP" }
- GET /api/docs loads Swagger UI with all routes visible
- GET /api/evaluation returns your name, repo URL, live URL, and features list
- POST /api/auth/register creates a user successfully
- POST /api/auth/login returns a JWT token
- POST /api/meetings creates a meeting with the JWT
- POST /api/meetings/:id/analyze returns AI analysis with citations
- Wait 5 minutes → check Railway logs for cron scheduler output

**💰 13. Cost Estimate**

_Free tier breakdown at various usage levels_

| **Service**             | **Free Tier Limit**       | **Cost at 100 Users** | **Cost at 1,000 Users** | **Cost at 10,000 Users** |
| ----------------------- | ------------------------- | --------------------- | ----------------------- | ------------------------ |
| Railway (Node.js)       | \$5 credit/month          | \$0                   | \$0-5                   | ~\$10-20                 |
| Railway (PostgreSQL)    | 1 GB storage              | \$0                   | \$0                     | ~\$5 (if > 1GB)          |
| Google Gemini 1.5 Flash | 1M tokens/day, 15 req/min | \$0                   | \$0                     | ~\$5-15 (if heavy use)   |
| Resend (Email)          | 100 emails/day free       | \$0                   | \$0                     | ~\$20 (Starter plan)     |
| GitHub                  | Unlimited public repos    | \$0                   | \$0                     | \$0                      |
| TOTAL                   | -                         | \$0/month             | \$0-5/month             | ~\$35-40/month           |

_For the purposes of this internship submission, the total cost is \$0. The Railway \$5 free credit per month comfortably covers a continuously-running Node.js service and PostgreSQL instance at evaluation-level traffic._

**📋 14. Development Checklist**

_Day-by-day task breakdown for 2-3 day sprint_

## **Day 1 - Foundation + Auth + Meetings (6-8 hours)**

### **Phase 1: Project Setup (1.5 hrs)**

| **#** | **Task**                                                                            | **Done?** |
| ----- | ----------------------------------------------------------------------------------- | --------- |
| 1     | Create GitHub repo, clone locally, init npm, add .gitignore                         | \[ \]     |
| 2     | Install all dependencies (production + dev) from Section 3                          | \[ \]     |
| 3     | Create tsconfig.json with outDir: ./dist, rootDir: ./src, strict: true              | \[ \]     |
| 4     | Create .env from .env.example with all keys (see Section 10)                        | \[ \]     |
| 5     | Write src/prisma/schema.prisma (copy verbatim from Section 4)                       | \[ \]     |
| 6     | Run npx prisma migrate dev --name init + npx prisma generate                        | \[ \]     |
| 7     | Create src/utils/prisma.ts (PrismaClient singleton)                                 | \[ \]     |
| 8     | Create src/utils/logger.ts (Winston instance)                                       | \[ \]     |
| 9     | Create src/utils/response.ts (successResponse + errorResponse)                      | \[ \]     |
| 10    | Create src/middleware/traceId.ts + requestLogger.ts + errorHandler.ts + validate.ts | \[ \]     |
| 11    | Wire up src/app.ts with all middleware in correct order                             | \[ \]     |
| 12    | Add GET /health and GET /api/evaluation endpoints in app.ts                         | \[ \]     |
| 13    | Test: npm run dev → GET localhost:3000/health returns { status: 'UP' }              | \[ \]     |

### **Phase 2: Auth (1 hr)**

| **#** | **Task**                                                             | **Done?** |
| ----- | -------------------------------------------------------------------- | --------- |
| 14    | Create src/modules/auth/auth.schema.ts (RegisterSchema, LoginSchema) | \[ \]     |
| 15    | Create src/modules/auth/auth.service.ts (register + login functions) | \[ \]     |
| 16    | Create src/modules/auth/auth.controller.ts                           | \[ \]     |
| 17    | Create src/modules/auth/auth.routes.ts + mount in app.ts             | \[ \]     |
| 18    | Create src/middleware/auth.ts (JWT verification middleware)          | \[ \]     |
| 19    | Test: register user → login → receive JWT token                      | \[ \]     |

### **Phase 3: Meetings (1.5 hrs)**

| **#** | **Task**                                                                 | **Done?** |
| ----- | ------------------------------------------------------------------------ | --------- |
| 20    | Create meetings.schema.ts (CreateMeetingSchema, ListMeetingsQuerySchema) | \[ \]     |
| 21    | Create meetings.service.ts (createMeeting, getMeeting, listMeetings)     | \[ \]     |
| 22    | Create meetings.controller.ts + meetings.routes.ts                       | \[ \]     |
| 23    | Mount meetings routes in app.ts with authMiddleware                      | \[ \]     |
| 24    | Test: POST /api/meetings with JWT → 201 + meeting object                 | \[ \]     |
| 25    | Test: GET /api/meetings → 200 + array + pagination                       | \[ \]     |
| 26    | Test: GET /api/meetings/:id → 200 with full meeting                      | \[ \]     |

## **Day 2 - AI Analysis + Action Items + Scheduler (6-8 hours)**

### **Phase 4: AI Analysis (2 hrs)**

| **#** | **Task**                                                                          | **Done?** |
| ----- | --------------------------------------------------------------------------------- | --------- |
| 27    | Create analysis.prompt.ts with buildPrompt(transcript) function                   | \[ \]     |
| 28    | Create analysis.validator.ts with validateCitations() function                    | \[ \]     |
| 29    | Create analysis.service.ts (call Gemini, validate, save, auto-create ActionItems) | \[ \]     |
| 30    | Create analysis.controller.ts + analysis.routes.ts                                | \[ \]     |
| 31    | Mount analysis routes under /api/meetings/:id/analyze in app.ts                   | \[ \]     |
| 32    | Test: POST /api/meetings/:id/analyze → 200 + analysis with citations              | \[ \]     |
| 33    | Test: Call analyze twice → second call returns 409 CONFLICT                       | \[ \]     |
| 34    | Verify: ActionItem rows auto-created in DB after analysis                         | \[ \]     |

### **Phase 5: Action Items (1 hr)**

| **#** | **Task**                                                                                   | **Done?** |
| ----- | ------------------------------------------------------------------------------------------ | --------- |
| 35    | Create actionItems.schema.ts (CreateActionItemSchema, UpdateStatusSchema, ListQuerySchema) | \[ \]     |
| 36    | Create actionItems.service.ts (create, list, updateStatus, getOverdue)                     | \[ \]     |
| 37    | Create actionItems.controller.ts + actionItems.routes.ts                                   | \[ \]     |
| 38    | Test: POST /api/action-items → 201                                                         | \[ \]     |
| 39    | Test: GET /api/action-items?status=PENDING → filtered results                              | \[ \]     |
| 40    | Test: PATCH /api/action-items/:id/status → 200                                             | \[ \]     |
| 41    | Test: GET /api/action-items/overdue → correct results                                      | \[ \]     |

### **Phase 6: Scheduler + Email (1 hr)**

| **#** | **Task**                                                                          | **Done?** |
| ----- | --------------------------------------------------------------------------------- | --------- |
| 42    | Sign up for Resend.com, get API key, add to .env                                  | \[ \]     |
| 43    | Create src/integrations/resend.ts (sendReminderEmail function)                    | \[ \]     |
| 44    | Create src/jobs/reminderScheduler.ts (startReminderScheduler function)            | \[ \]     |
| 45    | Call startReminderScheduler() in app.ts at startup                                | \[ \]     |
| 46    | Create an overdue ActionItem (set dueDate to past), wait 5 min, verify log output | \[ \]     |
| 47    | Check ReminderLog table has at least one row                                      | \[ \]     |

## **Day 3 - Swagger Docs + Tests + Deploy (4-6 hours)**

### **Phase 7: Swagger Documentation (1.5 hrs)**

| **#** | **Task**                                                          | **Done?** |
| ----- | ----------------------------------------------------------------- | --------- |
| 48    | Set up src/config/swagger.ts with swagger-jsdoc config            | \[ \]     |
| 49    | Add @swagger JSDoc comment to every route handler (all 11 routes) | \[ \]     |
| 50    | Mount swagger-ui-express at /api/docs in app.ts                   | \[ \]     |
| 51    | Test: GET localhost:3000/api/docs shows all routes                | \[ \]     |

### **Phase 8: Full Test Suite (2 hrs)**

| **#** | **Task**                                                  | **Done?** |
| ----- | --------------------------------------------------------- | --------- |
| 52    | Set up jest.config.ts with ts-jest preset                 | \[ \]     |
| 53    | Write auth.test.ts (8 test cases from Section 11)         | \[ \]     |
| 54    | Write meetings.test.ts (10 test cases from Section 11)    | \[ \]     |
| 55    | Write analysis.test.ts (5 test cases from Section 11)     | \[ \]     |
| 56    | Write actionItems.test.ts (11 test cases from Section 11) | \[ \]     |
| 57    | Run: npx jest → all tests green                           | \[ \]     |

### **Phase 9: Documentation Files (30 min)**

| **#** | **Task**                                                                               | **Done?** |
| ----- | -------------------------------------------------------------------------------------- | --------- |
| 58    | Write README.md (setup, env vars, local run steps, deploy steps)                       | \[ \]     |
| 59    | Write DECISIONS.md (why PostgreSQL, why Gemini, why Resend, why Railway)               | \[ \]     |
| 60    | Write AI_APPROACH.md (how prompt was designed, how citations work, grounding strategy) | \[ \]     |
| 61    | Write TESTING.md (what was tested, edge cases covered, how to run tests)               | \[ \]     |
| 62    | Write CHECKLIST.md (all 18+ core items marked with \[x\])                              | \[ \]     |

### **Phase 10: Deploy (30 min)**

| **#** | **Task**                                                                | **Done?** |
| ----- | ----------------------------------------------------------------------- | --------- |
| 63    | Push all code to public GitHub repo                                     | \[ \]     |
| 64    | Create Railway project, connect GitHub repo                             | \[ \]     |
| 65    | Add PostgreSQL plugin to Railway project                                | \[ \]     |
| 66    | Set all env vars in Railway dashboard (Section 10)                      | \[ \]     |
| 67    | Run npx prisma migrate deploy via Railway shell                         | \[ \]     |
| 68    | Generate Railway public domain URL                                      | \[ \]     |
| 69    | Verify all 3 public endpoints respond from live URL                     | \[ \]     |
| 70    | Update /api/evaluation endpoint with live Railway URL + GitHub repo URL | \[ \]     |
| 71    | Final push → Railway auto-deploys                                       | \[ \]     |
| 72    | Submit GitHub repo URL to Hintro                                        | \[ \]     |

**🎯 15. Technical Success Criteria**

_How to know the project is done_

## **Hard Pass/Fail Criteria**

| **Criterion**                  | **Pass Condition**                                                                  | **Status** |
| ------------------------------ | ----------------------------------------------------------------------------------- | ---------- |
| Public GitHub repo exists      | All source code visible; README, DECISIONS, AI_APPROACH, TESTING, CHECKLIST present | \[ \]      |
| Live URL accessible            | GET /health on Railway URL returns 200 { status: 'UP' }                             | \[ \]      |
| Swagger UI working             | GET /api/docs loads without errors; all 11 routes visible                           | \[ \]      |
| Evaluation endpoint            | GET /api/evaluation returns name, repo URL, live URL, features array                | \[ \]      |
| All 10 API routes respond      | Every route returns correct status code with traceId in response                    | \[ \]      |
| AI analysis includes citations | Every summary/decision/followUp item has ≥1 citation.timestamp                      | \[ \]      |
| No hallucinated timestamps     | All citation timestamps exist in the original transcript input                      | \[ \]      |
| Scheduler logs output          | Railway logs show cron firing within first 10 minutes of app start                  | \[ \]      |
| At least 1 email delivered     | A real email arrived through Resend (check your inbox)                              | \[ \]      |
| ReminderLog has rows           | Prisma Studio or DB shows ≥1 row in ReminderLog table                               | \[ \]      |
| Validation errors are 400      | All missing/invalid input → 400 VALIDATION_ERROR, never 500                         | \[ \]      |
| No unhandled crashes           | 100 requests on valid + invalid inputs - server stays up                            | \[ \]      |
| All tests pass                 | npx jest exits with 0 failures                                                      | \[ \]      |

## **Winston Log Format Verification**

Every log entry in production must match this exact shape:

{

"timestamp": "2026-05-20T10:00:00.000Z",

"level": "info",

"traceId": "550e8400-e29b-41d4-a716-446655440000",

"method": "POST",

"path": "/api/meetings",

"statusCode": 201,

"durationMs": 142

}

## **API Response Shape Verification**

Pick any successful endpoint response - it must match this structure exactly:

{

"traceId": "550e8400-e29b-41d4-a716-446655440000",

"success": true,

"data": {

// ... the actual response payload

}

}

And any error response must match:

{

"traceId": "550e8400-e29b-41d4-a716-446655440000",

"success": false,

"error": {

"code": "VALIDATION_ERROR",

"message": "Title is required"

}

}

**Good luck with your Hintro submission!**

This TRD is your single source of truth. When in doubt, refer back here. The field names, package names, and endpoint paths in this document are definitive - your AI coding tool should use them verbatim.