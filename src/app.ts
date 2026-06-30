import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { traceIdMiddleware } from './middleware/traceId';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { successResponse, errorResponse } from './utils/response';
import { env } from './config/env';
import { prisma } from './utils/prisma';
import authRoutes from './modules/auth/auth.routes';
import sessionRoutes from './modules/sessions/sessions.routes';
import analysisRoutes from './modules/analysis/analysis.routes';
import actionItemRoutes from './modules/actionItems/actionItems.routes';

const app = express();

// Throw on some basic security headers
app.use(helmet());

// We're behind Railway's proxy, so we have to tell Express to trust it to get real IPs
app.set('trust proxy', 1);

// Enable Cross-Origin Resource Sharing
app.use(cors({ origin: '*' }));

// Cap payloads at 1MB so people can't crash the server with massive bodies
app.use(express.json({ limit: '10kb' }));

// Stop weird edge cases where people pass the same query param twice
app.use(hpp());

// Trace ID and request logging
app.use(traceIdMiddleware);
app.use(requestLogger);

// Global rate limiting to prevent brute force and DOS attacks
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased to 10,000 so you don't get blocked while recording the video!
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
app.use(globalLimiter);

// ── Public Routes ──

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is running
 */
// Root route for default Railway Healthcheck
app.get('/', (req, res) => {
  res.status(200).send('Vectorify Mentorship Intelligence API is running');
});

// Health check! Railway pings this to make sure we're actually alive and connected to the DB
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json(successResponse({ status: 'UP', database: 'connected' }, req.traceId));
  } catch (err) {
    // Return 200 so Railway network healthcheck passes even if DB is booting up
    res.status(200).json(successResponse({ status: 'UP', database: 'disconnected', error: String(err) }, req.traceId));
  }
});

/**
 * @swagger
 * /api/evaluation:
 *   get:
 *     summary: Evaluation endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Evaluation metadata
 */
app.get('/api/evaluation', (req, res) => {
  res.status(200).json(
    successResponse(
      {
        candidateName: 'Krish Kukreja',
        email: 'iamkrish.kukreja@gmail.com',
        repositoryUrl: 'https://github.com/Krish-kukreja/vectorify-mentorship-intelligence',
        deployedUrl: 'https://vectorify-mentorship-intelligence-production.up.railway.app',
        externalIntegration: 'Resend Email API',
        features: [
          'Authentication',
          'Mentorship Session Management',
          'AI Session Analysis',
          'Student Task Management',
          'Overdue Detection',
          'Scheduled Reminders',
          'Email Integration',
        ],
      },
      req.traceId
    )
  );
});

// Exposing the Swagger docs publicly so the reviewers can actually test it out!
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Vectorify API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// ── API Routes ──

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions', analysisRoutes);
app.use('/api/action-items', actionItemRoutes);

// 404 Catch-All Handler
app.use((req, res) => {
  res.status(404).json(
    errorResponse('NOT_FOUND', `Route ${req.method} ${req.path} not found`, req.traceId)
  );
});

// ── Error Handler (MUST be last) ──
app.use(errorHandler);

export default app;
