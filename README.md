# Vectorify Mentorship Intelligence Service

AI-powered backend for **Vectorify**, the IIT Kharagpur mentorship program for JEE/NEET aspirants. Mentors log their one-on-one session transcripts; the service extracts the concepts covered, the student's weak areas, the practice tasks assigned, and recommended next steps - then automatically reminds students about tasks they let go overdue.

## Tech Stack

- **Runtime:** Node.js 20+, TypeScript 5.x
- **Framework:** Express 4.18.2
- **Database:** PostgreSQL 15+ with Prisma 5.x ORM
- **AI:** Groq API (LLaMA 3) with structured JSON output
- **Email:** Resend (transactional email)
- **Auth:** JWT (stateless) + bcryptjs
- **Validation:** Zod
- **Logging:** Winston (structured JSON)
- **Scheduler:** node-cron
- **Testing:** Jest + Supertest
- **Docs:** Swagger UI (OpenAPI 3.0)

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/Krish-kukreja/vectorify-mentorship-intelligence.git
cd vectorify-mentorship-intelligence

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Generate Prisma client and run migrations
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma migrate dev --schema=src/prisma/schema.prisma

# 5. Start the development server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `development` / `production` / `test` |
| `JWT_SECRET` | Strong random string (32+ chars) |
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Groq API key (variable name retained for compatibility) |
| `RESEND_API_KEY` | Resend dashboard API key |
| `REDIS_URL` | Redis connection string (caching) |
| `REMINDER_CRON_SCHEDULE` | Cron expression (default: `*/5 * * * *`) |

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:3000/api/docs
```

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new mentor/user |
| POST | `/api/auth/login` | Public | Login, get JWT token |
| POST | `/api/sessions` | 🔒 | Create a mentorship session with transcript |
| GET | `/api/sessions` | 🔒 | List sessions (paginated, date filter) |
| GET | `/api/sessions/:id` | 🔒 | Get session details |
| POST | `/api/sessions/:id/analyze` | 🔒 | Run AI analysis on the session transcript |
| POST | `/api/action-items` | 🔒 | Create a student task |
| GET | `/api/action-items` | 🔒 | List student tasks (filtered) |
| PATCH | `/api/action-items/:id/status` | 🔒 | Update task status |
| GET | `/api/action-items/overdue` | 🔒 | Get overdue student tasks |
| GET | `/health` | Public | Health check |
| GET | `/api/evaluation` | Public | Evaluation metadata |

## What the AI Analysis Produces

Each analyzed session returns four sections, every item grounded with a citation back to a real transcript timestamp:

| Section | Meaning |
|---------|---------|
| `summary` | Key concepts and topics covered in the session |
| `actionItems` | Practice tasks / homework assigned to the student |
| `decisions` | Weak areas and study focus agreed on |
| `followUpSuggestions` | Recommended next steps and resources |

Action items are automatically saved as tasks with `status: PENDING`, feeding the overdue tracking and reminder system.

## Testing

```bash
# Run all tests
npm test

# Run a specific test suite
npx jest src/__tests__/auth.test.ts
npx jest src/__tests__/sessions.test.ts
npx jest src/__tests__/analysis.test.ts
npx jest src/__tests__/actionItems.test.ts
```

**Test Coverage:** 34 tests across 4 modules - auth (8), sessions (10), analysis (5), action items (11).

## Deploy to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
3. Add a **PostgreSQL** plugin from the Railway dashboard
4. Set environment variables in **Settings → Variables**:
   - `DATABASE_URL` - auto-populated by Railway PostgreSQL plugin
   - `JWT_SECRET`, `GEMINI_API_KEY`, `RESEND_API_KEY` - set manually
   - `REMINDER_CRON_SCHEDULE` - set to `*/5 * * * *`
5. Set build command: `npm install && npx prisma generate --schema=src/prisma/schema.prisma && npx prisma migrate deploy --schema=src/prisma/schema.prisma && npm run build`
6. Set start command: `npm start`
7. Deploy triggers automatically on push to `main`

## Project Structure

```
src/
├── __tests__/              # Jest test suites
├── config/                 # env.ts, swagger.ts
├── integrations/           # resend.ts (email)
├── jobs/                   # reminderScheduler.ts (cron)
├── middleware/             # auth, validate, traceId, logger, errorHandler
├── modules/
│   ├── auth/               # register, login
│   ├── sessions/           # mentorship session CRUD + pagination
│   ├── analysis/           # Groq AI analysis
│   └── actionItems/        # student task CRUD + overdue
├── prisma/                 # schema.prisma
├── utils/                  # prisma.ts, logger.ts, response.ts, redis.ts
├── app.ts                  # Express app setup
└── server.ts               # Server bootstrap + scheduler
```

## License

MIT
