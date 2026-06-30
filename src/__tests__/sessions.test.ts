import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock env
jest.mock('../config/env', () => ({
  env: {
    PORT: 3000,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt-secret-key-for-testing!',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    GEMINI_API_KEY: 'test-gemini-key',
    RESEND_API_KEY: 'test-resend-key',
    REMINDER_CRON_SCHEDULE: '0 9 * * *',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const TEST_USER_ID = 'user-uuid-123';
const TEST_JWT = jwt.sign(
  { userId: TEST_USER_ID, email: 'test@example.com' },
  'test-jwt-secret-key-for-testing!',
  { expiresIn: '7d' }
);

const validSessionPayload = {
  title: 'Physics - Rotational Motion Doubt Session',
  participants: ['mentor@vectorify.in', 'aspirant@example.com'],
  sessionDate: '2024-06-01T10:00:00.000Z',
  transcript: [
    { timestamp: '00:00:01', speaker: 'Mentor', text: 'Let us review your torque problems.' },
    { timestamp: '00:01:30', speaker: 'Student', text: 'I got stuck on the moment of inertia step.' },
  ],
};

const mockSession = {
  id: 'session-uuid-123',
  userId: TEST_USER_ID,
  title: 'Physics - Rotational Motion Doubt Session',
  participants: ['mentor@vectorify.in', 'aspirant@example.com'],
  sessionDate: new Date('2024-06-01T10:00:00.000Z'),
  transcript: validSessionPayload.transcript,
  createdAt: new Date('2024-06-01T12:00:00.000Z'),
  updatedAt: new Date('2024-06-01T12:00:00.000Z'),
};

describe('Sessions Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── CREATE ──

  describe('POST /api/sessions', () => {
    it('should create a session and return 201', async () => {
      (mockedPrisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${TEST_JWT}`)
        .send(validSessionPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'session-uuid-123');
      expect(res.body.data).toHaveProperty('title', 'Physics - Rotational Motion Doubt Session');
      expect(res.body).toHaveProperty('traceId');
    });

    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .send(validSessionPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 VALIDATION_ERROR for empty title', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${TEST_JWT}`)
        .send({ ...validSessionPayload, title: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 VALIDATION_ERROR for empty transcript', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${TEST_JWT}`)
        .send({ ...validSessionPayload, transcript: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 VALIDATION_ERROR for invalid participant email', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${TEST_JWT}`)
        .send({ ...validSessionPayload, participants: ['not-an-email'] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── LIST ──

  describe('GET /api/sessions', () => {
    it('should list sessions with pagination and return 200', async () => {
      const sessions = [mockSession];
      (mockedPrisma.session.findMany as jest.Mock).mockResolvedValue(sessions);
      (mockedPrisma.session.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sessions');
      expect(Array.isArray(res.body.data.sessions)).toBe(true);
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter sessions by date range and return 200', async () => {
      (mockedPrisma.session.findMany as jest.Mock).mockResolvedValue([mockSession]);
      (mockedPrisma.session.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/sessions')
        .query({
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-12-31T23:59:59.000Z',
        })
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Prisma was called with date filters
      const findManyCall = (mockedPrisma.session.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.sessionDate).toBeDefined();
      expect(findManyCall.where.sessionDate.gte).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(findManyCall.where.sessionDate.lte).toEqual(new Date('2024-12-31T23:59:59.000Z'));
    });

    it('should return 400 for invalid limit (> 100)', async () => {
      const res = await request(app)
        .get('/api/sessions')
        .query({ limit: 200 })
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── GET BY ID ──

  describe('GET /api/sessions/:id', () => {
    it('should return 200 with full session when found', async () => {
      const sessionWithRelations = {
        ...mockSession,
        analysis: null,
        actionItems: [],
      };
      (mockedPrisma.session.findUnique as jest.Mock).mockResolvedValue(sessionWithRelations);

      const res = await request(app)
        .get('/api/sessions/session-uuid-123')
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'session-uuid-123');
      expect(res.body.data).toHaveProperty('title', 'Physics - Rotational Motion Doubt Session');
      expect(res.body.data).toHaveProperty('analysis');
      expect(res.body.data).toHaveProperty('actionItems');
    });

    it('should return 404 NOT_FOUND when session does not exist', async () => {
      (mockedPrisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/sessions/nonexistent-uuid')
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
