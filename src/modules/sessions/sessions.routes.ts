import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { CreateSessionSchema } from './sessions.schema';
import { UuidParamSchema } from '../../utils/uuid.schema';
import * as sessionsController from './sessions.controller';

const router = Router();

// All session routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a new mentorship session
 *     description: Stores a mentor-student session with its transcript for later AI analysis. Requires authentication.
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, participants, sessionDate, transcript]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Physics - Rotational Motion Doubt Session
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 example: ["mentor@vectorify.in", "aspirant@example.com"]
 *               sessionDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-06-01T10:00:00.000Z"
 *               transcript:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [timestamp, speaker, text]
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       example: "00:01"
 *                     speaker:
 *                       type: string
 *                       example: Mentor
 *                     text:
 *                       type: string
 *                       example: Let us review where you got stuck on torque problems.
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - missing or invalid JWT
 */
router.post('/', validate(CreateSessionSchema), sessionsController.createSession);

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: List mentorship sessions with pagination and date filtering
 *     description: Returns paginated sessions for the authenticated mentor. Supports optional date range filtering.
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page (max 100)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter sessions on or after this date (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter sessions on or before this date (ISO 8601)
 *     responses:
 *       200:
 *         description: Paginated list of sessions
 *       400:
 *         description: Validation error (e.g. limit > 100)
 *       401:
 *         description: Unauthorized
 */
router.get('/', sessionsController.listSessions);

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Get a mentorship session by ID
 *     description: Returns the full session record including analysis and action items if available.
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session UUID
 *     responses:
 *       200:
 *         description: Session details with analysis and action items
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.get('/:id', validate(UuidParamSchema, 'params'), sessionsController.getSession);

export default router;
