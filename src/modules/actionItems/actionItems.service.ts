import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import logger from '../../utils/logger';
import { CreateActionItemInput, ListActionItemsQuery } from './actionItems.schema';
import { getCache, setCache, invalidatePattern } from '../../utils/redis';

export async function createActionItem(userId: string, data: CreateActionItemInput) {
  logger.info('Creating action item', { userId, sessionId: data.sessionId });

  // Verify session exists and belongs to the user
  const session = await prisma.session.findUnique({
    where: { id: data.sessionId },
  });

  if (!session || session.userId !== userId) {
    logger.warn('Session not found or access denied for action item creation', {
      userId,
      sessionId: data.sessionId,
    });
    return { error: 'NOT_FOUND' };
  }

  const actionItem = await prisma.actionItem.create({
    data: {
      sessionId: data.sessionId,
      task: data.task,
      assignee: data.assignee,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      citations: (data.citations as any) || [],
    },
  });

  logger.info('Action item created', { actionItemId: actionItem.id, sessionId: data.sessionId });

  await invalidatePattern(`actionItems:${userId}:*`);

  return { actionItem };
}

export async function listActionItems(userId: string, query: ListActionItemsQuery) {
  const { status, assignee, sessionId, page, limit } = query;
  const skip = (page - 1) * limit;

  logger.info('Listing action items', { userId, status, assignee, sessionId, page, limit });

  const where: any = {
    session: { userId },
  };

  if (status) where.status = status;
  if (assignee) where.assignee = assignee;
  if (sessionId) where.sessionId = sessionId;

  const cacheKey = `actionItems:${userId}:status${status || 'all'}:assignee${assignee || 'all'}:session${sessionId || 'all'}:page${page}:limit${limit}`;
  const cached = await getCache<{ actionItems: any[], pagination: any }>(cacheKey);
  if (cached) {
    logger.info('ActionItems cache hit', { cacheKey, userId });
    return cached;
  }

  const [actionItems, total] = await Promise.all([
    prisma.actionItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        session: { select: { title: true } },
      },
    }),
    prisma.actionItem.count({ where }),
  ]);

  const result = {
    actionItems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  await setCache(cacheKey, result, 300);
  logger.info('ActionItems cache set', { cacheKey, userId });

  return result;
}

export async function updateStatus(userId: string, actionItemId: string, status: string) {
  logger.info('Updating action item status', { userId, actionItemId, status });

  // Find the action item and verify ownership through session
  const actionItem = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    include: { session: { select: { userId: true } } },
  });

  if (!actionItem || actionItem.session.userId !== userId) {
    logger.warn('Action item not found or access denied', { userId, actionItemId });
    return { error: 'NOT_FOUND' };
  }

  const updated = await prisma.actionItem.update({
    where: { id: actionItemId },
    data: { status: status as any },
  });

  logger.info('Action item status updated', { actionItemId, oldStatus: actionItem.status, newStatus: status });

  await invalidatePattern(`actionItems:${userId}:*`);

  return { actionItem: updated };
}

export async function getOverdue(userId: string) {
  logger.info('Fetching overdue action items', { userId });

  const now = new Date();

  const overdueItems = await prisma.actionItem.findMany({
    where: {
      session: { userId },
      status: { not: 'COMPLETED' },
      dueDate: { lt: now },
    },
    include: {
      session: { select: { title: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  logger.info('Overdue action items found', { userId, count: overdueItems.length });

  return overdueItems;
}
