import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { UuidParamSchema } from '../../utils/uuid.schema';
import * as analysisController from './analysis.controller';

const router = Router();

// The Groq API costs money, so let's limit how often people can hit this
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per user
  keyGenerator: (req: any) => req.userId,
  message: 'Analysis limit reached, try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * @swagger
 * /sessions/{id}/analyze:
 *   post:
 *     summary: Run AI analysis on a mentorship session transcript
 *     description: |
 *       Sends the mentorship session transcript to the Groq LLM API for analysis.
 *       Returns summary, actionItems, decisions, and followUpSuggestions - all with validated citations.
 *       Retries once on LLM failure before returning 502.
 *       Auto-creates ActionItem records from the analysis result.
 *     tags: [Analysis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID to analyze
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 traceId:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                     summary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           citations:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 timestamp:
 *                                   type: string
 *                     actionItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           task:
 *                             type: string
 *                           assignee:
 *                             type: string
 *                           citations:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 timestamp:
 *                                   type: string
 *                     decisions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     followUpSuggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       409:
 *         description: Analysis already exists for this session
 *       502:
 *         description: AI analysis failed after retry (LLM_ERROR)
 */
router.post('/:id/analyze', authenticate, analysisLimiter, validate(UuidParamSchema, 'params'), analysisController.analyzeSession);

export default router;
