import { prisma } from '../../utils/prisma';
import logger from '../../utils/logger';
import { CreateSessionInput, ListSessionsQuery } from './sessions.schema';
import { getCache, setCache, invalidatePattern } from '../../utils/redis';

export interface SessionWithRelations {
  id: string;
  userId: string;
  title: string;
  participants: string[];
  sessionDate: Date;
  transcript: unknown;
  createdAt: Date;
  updatedAt: Date;
  analysis: unknown | null;
  actionItems: unknown[];
}

export interface PaginatedSessions {
  sessions: unknown[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function createSession(
  userId: string,
  data: CreateSessionInput
): Promise<unknown> {
  logger.info('Creating mentorship session', { userId, title: data.title });

  const session = await prisma.session.create({
    data: {
      userId,
      title: data.title,
      participants: data.participants,
      sessionDate: new Date(data.sessionDate),
      transcript: data.transcript as any,
    },
  });

  logger.info('Mentorship session created successfully', { sessionId: session.id, userId });

  await invalidatePattern(`sessions:${userId}:*`);

  return session;
}

export async function getSession(
  userId: string,
  sessionId: string
): Promise<SessionWithRelations | null> {
  logger.info('Fetching mentorship session', { userId, sessionId });

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      analysis: true,
      actionItems: true,
    },
  });

  if (!session) {
    logger.warn('Session not found', { sessionId });
    return null;
  }

  if (session.userId !== userId) {
    logger.warn('Session access denied: userId mismatch', {
      sessionId,
      ownerId: session.userId,
      requesterId: userId,
    });
    return null;
  }

  return session;
}

export async function listSessions(
  userId: string,
  query: ListSessionsQuery
): Promise<PaginatedSessions> {
  const { page, limit, from, to } = query;
  const skip = (page - 1) * limit;

  logger.info('Listing mentorship sessions', { userId, page, limit, from, to });

  const where: any = { userId };

  if (from || to) {
    where.sessionDate = {};
    if (from) where.sessionDate.gte = new Date(from);
    if (to) where.sessionDate.lte = new Date(to);
  }

  const cacheKey = `sessions:${userId}:page${page}:limit${limit}:from${from || 'all'}:to${to || 'all'}`;
  const cached = await getCache<PaginatedSessions>(cacheKey);
  if (cached) {
    logger.info('Sessions cache hit', { cacheKey, userId });
    return cached;
  }

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.session.count({ where }),
  ]);

  logger.info('Sessions listed', { userId, total, returned: sessions.length });

  const result = {
    sessions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  await setCache(cacheKey, result, 300); // 5 minutes
  logger.info('Sessions cache set', { cacheKey, userId });

  return result;
}
