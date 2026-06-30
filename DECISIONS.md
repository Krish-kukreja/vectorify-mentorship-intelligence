# Architecture Decisions

This document explains the rationale behind key technology choices for the Vectorify Mentorship Intelligence Service.

---

## PostgreSQL - Relational Integrity

**Why:** Mentorship data has strong relational requirements - mentors own sessions, sessions have analyses, analyses produce action items, and action items have reminder logs. PostgreSQL enforces referential integrity (foreign keys, cascading deletes) at the database level, preventing orphaned records.

**Alternatives considered:**
- **MongoDB** - flexible schema but no native joins or FK enforcement. Would require application-level integrity checks, increasing bug surface.
- **SQLite** - adequate for single-user but lacks concurrent connection handling needed for a multi-user API with cron jobs.

---

## Prisma - TypeScript-First ORM

**Why:** Prisma generates fully typed client code from the schema definition. Every query is type-checked at compile time - if a field name changes in the schema, the compiler catches all broken references instantly. The migration system (`prisma migrate dev`) produces versioned SQL files tracked in git.

**Alternatives considered:**
- **TypeORM** - decorator-heavy, weaker type inference, and inconsistent migration behavior.
- **Knex.js** - excellent query builder but no auto-generated types; requires manual type maintenance.
- **Raw SQL** - maximum control but zero type safety and high maintenance cost.

---

## Groq API (LLaMA 3) - AI Analysis Engine

**Why:** Groq API (LLaMA 3) was selected for three reasons:
1. **Free tier** - generous free quota suitable for hackathon and early-stage usage.
2. **JSON mode** - `responseMimeType: 'application/json'` enforces structured output, eliminating regex parsing of markdown/text responses.
3. **Large context window** - handles even lengthy session transcripts without chunking.

**Alternatives considered:**
- **GPT-4o** - stronger reasoning but significantly higher cost and no free tier.
- **Claude** - excellent but no native JSON mode at API level.
- **Local models** - too slow and resource-intensive for a deployed API.

---

## Resend - Transactional Email

**Why:** Resend provides a clean, modern API with a generous free tier (100 emails/day). The SDK is TypeScript-native with minimal setup. The `onboarding@resend.dev` sender domain works immediately without DNS configuration.

**Alternatives considered:**
- **SendGrid** - powerful but complex setup, heavier SDK.
- **AWS SES** - cheapest at scale but requires domain verification and IAM configuration.
- **Nodemailer + SMTP** - requires managing SMTP credentials and handling deliverability.

---

## Railway - Deployment Platform

**Why:** Railway offers one-click PostgreSQL provisioning, automatic `DATABASE_URL` injection, GitHub-based deploys, and a free tier. The deployment workflow (push → build → deploy) requires zero Docker or Kubernetes knowledge.

**Alternatives considered:**
- **Vercel** - optimized for frontend/serverless; not ideal for Express + cron jobs.
- **Render** - good but slower cold starts on free tier.
- **AWS EC2/ECS** - full control but significant DevOps overhead for a hackathon project.

---

## JWT - Stateless Authentication

**Why:** JSON Web Tokens enable stateless auth - the server doesn't need to store sessions in a database or Redis. Each request carries its own auth proof. This simplifies horizontal scaling (any server instance can validate any token) and eliminates session store infrastructure.

**Configuration:** Tokens expire after 7 days (`expiresIn: '7d'`), balancing security with user convenience.

**Alternatives considered:**
- **Session cookies + Redis** - more secure (server-side revocation) but adds infrastructure complexity.
- **OAuth2/OIDC** - appropriate for multi-provider auth but overkill for email/password-only.

---

## Zod - Runtime Validation

**Why:** Zod provides schema-based validation with automatic TypeScript type inference. A single schema definition (`z.object(...)`) serves as both the runtime validator and the TypeScript type (`z.infer<typeof Schema>`). This eliminates the common pattern of writing types and validators separately.

**Alternatives considered:**
- **Joi** - mature but no TypeScript type inference.
- **class-validator** - decorator-based, requires class instances instead of plain objects.
- **express-validator** - chain-based, verbose for complex nested schemas.

---

## Winston - Structured Logging

**Why:** Winston outputs structured JSON logs with consistent fields (`traceId`, `service`, `timestamp`). JSON logs are machine-parseable, enabling direct ingestion into Railway logs, CloudWatch, or Datadog without format transformation.

**Critical rule:** `console.log` is banned project-wide. All logging goes through the Winston singleton to ensure consistent formatting and log levels.
