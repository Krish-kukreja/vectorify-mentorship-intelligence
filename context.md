# VECTORIFY CONTEXT - Paste at top of every prompt

## Product
Vectorify Mentorship Intelligence Service - backend for the IIT Kharagpur JEE/NEET mentorship program.
Mentors log one-on-one session transcripts; AI extracts concepts covered, weak areas, student tasks, and next steps.

## Tech Stack
Node.js 20+, TypeScript 5.x, Express 4.18.2, PostgreSQL 15+, Prisma 5.x
JWT (jsonwebtoken), bcryptjs, Zod, Winston, node-cron
Groq API (LLaMA 3), Resend, Jest + Supertest, Swagger UI

## Critical Rules
- Prisma singleton ONLY (src/utils/prisma.ts)
- NEVER commit .env
- Unified response: { traceId, success, data/error }
- Middleware order: cors → json → traceId → logger → routes → errorHandler
- All dates ISO 8601, DB timestamps UTC
- Winston only (no console.log)
- bcryptjs saltRounds = 10

## Prisma Schema
File location: src/prisma/schema.prisma. Models:

model User { id, email (unique), passwordHash, createdAt, sessions Session[] }

model Session {
  id, userId, user User @relation, title, participants String[],
  sessionDate DateTime, transcript Json, createdAt, updatedAt,
  analysis SessionAnalysis?, actionItems ActionItem[]
}

model SessionAnalysis {
  id, sessionId (unique), session Session @relation,
  summary Json, actionItems Json, decisions Json, followUpSuggestions Json, createdAt
}

model ActionItem {
  id, sessionId, session Session @relation, task, assignee,
  status ActionStatus @default(PENDING), dueDate DateTime?, citations Json?,
  createdAt, updatedAt, reminders ReminderLog[]
}

enum ActionStatus { PENDING, IN_PROGRESS, COMPLETED }

model ReminderLog {
  id, actionItemId, actionItem ActionItem @relation,
  channel, deliveryStatus, response String?, sentAt
}

## API Endpoints
POST /api/auth/register (public, 201)
POST /api/auth/login (public, 200)
POST /api/sessions (protected, 201)
GET /api/sessions (protected, 200)
GET /api/sessions/:id (protected, 200)
POST /api/sessions/:id/analyze (protected, 200)
POST /api/action-items (protected, 201)
GET /api/action-items (protected, 200)
PATCH /api/action-items/:id/status (protected, 200)
GET /api/action-items/overdue (protected, 200)
GET /health (public, 200)
GET /api/evaluation (public, 200)
GET /api/docs (public, Swagger UI)

## Env Vars
File location: .env (root) or Railway Dashboard → Settings → Environment Variables

PORT=3000
NODE_ENV=development
JWT_SECRET=<generate-strong-random-32-char-string>
DATABASE_URL=<from-railway-postgresql-plugin>
GEMINI_API_KEY=<groq-api-key>
RESEND_API_KEY=<from-resend-dashboard>
REDIS_URL=redis://localhost:6379
REMINDER_CRON_SCHEDULE=*/5 * * * *  // every 5 minutes
