# HINTRO CONTEXT - Paste at top of every prompt

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

## API Endpoints
POST /api/auth/register (public, 201)
POST /api/auth/login (public, 200)
POST /api/meetings (protected, 201)
GET /api/meetings (protected, 200)
GET /api/meetings/:id (protected, 200)
POST /api/meetings/:id/analyze (protected, 200)
POST /api/action-items (protected, 201)
GET /api/action-items (protected, 200)
PATCH /api/action-items/:id/status (protected, 200)
GET /api/action-items/overdue (protected, 200)
GET /health (public, 200)
GET /api/evaluation (public, 200)
GET /api/docs (public, Swagger UI)

## Env Vars
File location: .env (root) or Railway Dashboard → Settings → Environment Variables

PORT=3001
NODE_ENV=development
JWT_SECRET=<generate-strong-random-32-char-string>
DATABASE_URL=<from-railway-postgresql-plugin>
GROQ_API_KEY=<from-google-ai-studio>
RESEND_API_KEY=<from-resend-dashboard>
REMINDER_CRON_SCHEDULE=*/5 * * * *  // every 5 minutes