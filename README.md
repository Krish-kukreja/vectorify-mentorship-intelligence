# Meeting Intelligence Service (Hintro)

AI-powered meeting analysis backend that extracts insights, tracks action items, and sends automated reminders.

## Tech Stack

- **Runtime:** Node.js 20+, TypeScript 5.x
- **Framework:** Express 4.18.2
- **Database:** PostgreSQL 15+ with Prisma 5.x ORM
- **AI:** Google Gemini 1.5 Flash (structured JSON output)
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
git clone https://github.com/yourname/hintro-api.git
cd hintro-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# 5. Start the development server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | `development` / `production` / `test` |
| `JWT_SECRET` | Strong random string (32+ chars) |
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `RESEND_API_KEY` | Resend dashboard API key |
| `REMINDER_CRON_SCHEDULE` | Cron expression (default: `*/5 * * * *`) |

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:3001/api/docs
```

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login, get JWT token |
| POST | `/api/meetings` | 🔒 | Create a meeting with transcript |
| GET | `/api/meetings` | 🔒 | List meetings (paginated, date filter) |
| GET | `/api/meetings/:id` | 🔒 | Get meeting details |
| POST | `/api/meetings/:id/analyze` | 🔒 | Run AI analysis on transcript |
| POST | `/api/action-items` | 🔒 | Create an action item |
| GET | `/api/action-items` | 🔒 | List action items (filtered) |
| PATCH | `/api/action-items/:id/status` | 🔒 | Update action item status |
| GET | `/api/action-items/overdue` | 🔒 | Get overdue action items |
| GET | `/health` | Public | Health check |
| GET | `/api/evaluation` | Public | Evaluation metadata |

## Testing

```bash
# Run all tests
npm test

# Run with verbose output
npx jest --verbose

# Run a specific test suite
npx jest src/__tests__/auth.test.ts
npx jest src/__tests__/meetings.test.ts
npx jest src/__tests__/analysis.test.ts
npx jest src/__tests__/actionItems.test.ts
```

**Test Coverage:** 34 tests across 4 modules — auth (8), meetings (10), analysis (5), action items (11).

## Deploy to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
3. Add a **PostgreSQL** plugin from the Railway dashboard
4. Set environment variables in **Settings → Variables**:
   - `DATABASE_URL` — auto-populated by Railway PostgreSQL plugin
   - `JWT_SECRET`, `GEMINI_API_KEY`, `RESEND_API_KEY` — set manually
   - `REMINDER_CRON_SCHEDULE` — set to `*/5 * * * *`
5. Set build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
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
│   ├── meetings/           # CRUD + pagination
│   ├── analysis/           # Gemini AI analysis
│   └── actionItems/        # CRUD + overdue
├── prisma/                 # schema.prisma
├── utils/                  # prisma.ts, logger.ts, response.ts
├── app.ts                  # Express app setup
└── server.ts               # Server bootstrap + scheduler
```

## License

MIT
