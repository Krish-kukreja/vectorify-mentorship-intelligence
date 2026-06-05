import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { traceIdMiddleware } from './middleware/traceId';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { successResponse } from './utils/response';
import authRoutes from './modules/auth/auth.routes';
import meetingRoutes from './modules/meetings/meetings.routes';
import analysisRoutes from './modules/analysis/analysis.routes';
import actionItemRoutes from './modules/actionItems/actionItems.routes';

const app = express();

// ── Middleware (EXACT order: cors → json → traceId → requestLogger → routes → errorHandler) ──

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(traceIdMiddleware);
app.use(requestLogger);

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
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP' });
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
        candidateName: 'Your Full Name',
        email: 'your.email@example.com',
        repositoryUrl: 'https://github.com/Krish-kukreja/hintro-meeting-intelligence',
        deployedUrl: 'https://placeholder.up.railway.app',
        externalIntegration: 'Resend Email API',
        features: [
          'Authentication',
          'Meeting Management',
          'AI Analysis',
          'Action Item Management',
          'Overdue Detection',
          'Scheduled Reminders',
          'Email Integration',
        ],
      },
      req.traceId
    )
  );
});

// ── API Documentation ──

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Hintro API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// ── API Routes (to be mounted in subsequent chunks) ──

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meetings', analysisRoutes);
app.use('/api/action-items', actionItemRoutes);

// ── Error Handler (MUST be last) ──

app.use(errorHandler);

export default app;
