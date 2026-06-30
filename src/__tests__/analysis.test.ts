import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../utils/prisma';
import { validateCitations } from '../modules/analysis/analysis.validator';

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
    sessionAnalysis: {
      create: jest.fn(),
    },
    actionItem: {
      createMany: jest.fn(),
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

// Mock Groq SDK
jest.mock('groq-sdk', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
    __mockCreate: mockCreate,
  };
});

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const { __mockCreate: mockGenerateContent } = jest.requireMock('groq-sdk');

const TEST_USER_ID = 'user-uuid-123';
const SESSION_ID = 'session-uuid-456';
const TEST_JWT = jwt.sign(
  { userId: TEST_USER_ID, email: 'test@example.com' },
  'test-jwt-secret-key-for-testing!',
  { expiresIn: '7d' }
);

const mockTranscript = [
  { timestamp: '00:01', speaker: 'Mentor', text: 'Let us review your study plan.' },
  { timestamp: '00:05', speaker: 'Mentor', text: 'I suggest we prioritize rotational motion.' },
  { timestamp: '00:10', speaker: 'Mentor', text: 'Agreed. Solve 20 problems by Friday.' },
];

const mockGeminiResponse = {
  summary: [
    { text: 'Reviewed study plan priorities.', citations: [{ timestamp: '00:01' }] },
  ],
  actionItems: [
    { task: 'Solve 20 rotational motion problems', assignee: 'aspirant@example.com', citations: [{ timestamp: '00:10' }] },
  ],
  decisions: [
    { text: 'Rotational motion is the top focus area.', citations: [{ timestamp: '00:05' }] },
  ],
  followUpSuggestions: [
    { text: 'Schedule a follow-up to check problem-solving progress.', citations: [{ timestamp: '00:10' }] },
  ],
};

const mockSessionNoAnalysis = {
  id: SESSION_ID,
  userId: TEST_USER_ID,
  title: 'Physics - Rotational Motion Doubt Session',
  participants: ['mentor@vectorify.in', 'aspirant@example.com'],
  sessionDate: new Date('2024-06-01T10:00:00.000Z'),
  transcript: mockTranscript,
  createdAt: new Date(),
  updatedAt: new Date(),
  analysis: null,
};

const mockSavedAnalysis = {
  id: 'analysis-uuid-789',
  sessionId: SESSION_ID,
  ...mockGeminiResponse,
  createdAt: new Date(),
};

describe('Analysis Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sessions/:id/analyze', () => {
    it('should analyze a session and return 200 with all 4 fields', async () => {
      (mockedPrisma.session.findUnique as jest.Mock).mockResolvedValue(mockSessionNoAnalysis);
      (mockedPrisma.sessionAnalysis.create as jest.Mock).mockResolvedValue(mockSavedAnalysis);
      (mockedPrisma.actionItem.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      mockGenerateContent.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockGeminiResponse) } }
        ]
      });

      const res = await request(app)
        .post(`/api/sessions/${SESSION_ID}/analyze`)
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('actionItems');
      expect(res.body.data).toHaveProperty('decisions');
      expect(res.body.data).toHaveProperty('followUpSuggestions');
      expect(res.body).toHaveProperty('traceId');

      // Verify action items were auto-created
      expect(mockedPrisma.actionItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            sessionId: SESSION_ID,
            task: 'Solve 20 rotational motion problems',
            assignee: 'aspirant@example.com',
            status: 'PENDING',
            dueDate: null,
          }),
        ]),
      });
    });

    it('should return 409 CONFLICT when analysis already exists', async () => {
      const sessionWithAnalysis = {
        ...mockSessionNoAnalysis,
        analysis: mockSavedAnalysis,
      };

      (mockedPrisma.session.findUnique as jest.Mock).mockResolvedValue(sessionWithAnalysis);

      const res = await request(app)
        .post(`/api/sessions/${SESSION_ID}/analyze`)
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 404 when session does not exist', async () => {
      (mockedPrisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/sessions/nonexistent-uuid/analyze')
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 502 LLM_ERROR when LLM fails twice', async () => {
      (mockedPrisma.session.findUnique as jest.Mock).mockResolvedValue(mockSessionNoAnalysis);

      mockGenerateContent
        .mockRejectedValueOnce(new Error('LLM rate limited'))
        .mockRejectedValueOnce(new Error('LLM still failing'));

      const res = await request(app)
        .post(`/api/sessions/${SESSION_ID}/analyze`)
        .set('Authorization', `Bearer ${TEST_JWT}`);

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LLM_ERROR');
    }, 15000);
  });

  describe('Citation Validation', () => {
    it('should strip invalid citations and keep valid ones', () => {
      const analysisWithBadCitations = {
        summary: [
          {
            text: 'Discussion about the study plan.',
            citations: [
              { timestamp: '00:01' },       // valid
              { timestamp: '99:99' },       // INVALID
            ],
          },
        ],
        actionItems: [
          {
            task: 'Do something',
            assignee: 'aspirant@example.com',
            citations: [
              { timestamp: '00:05' },       // valid
              { timestamp: 'FAKE' },        // INVALID
            ],
          },
        ],
        decisions: [
          {
            text: 'Decided something.',
            citations: [{ timestamp: '00:10' }],  // valid
          },
        ],
        followUpSuggestions: [
          {
            text: 'Follow up.',
            citations: [{ timestamp: 'NONEXISTENT' }],  // INVALID
          },
        ],
      };

      const cleaned = validateCitations(analysisWithBadCitations, mockTranscript, 'test-trace');

      // Valid citations kept
      expect(cleaned.summary[0].citations).toHaveLength(1);
      expect(cleaned.summary[0].citations[0].timestamp).toBe('00:01');

      expect(cleaned.actionItems[0].citations).toHaveLength(1);
      expect(cleaned.actionItems[0].citations[0].timestamp).toBe('00:05');

      expect(cleaned.decisions[0].citations).toHaveLength(1);
      expect(cleaned.decisions[0].citations[0].timestamp).toBe('00:10');

      // Invalid citation stripped entirely
      expect(cleaned.followUpSuggestions[0].citations).toHaveLength(0);
    });
  });
});
