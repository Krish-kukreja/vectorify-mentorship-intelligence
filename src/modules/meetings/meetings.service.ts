import { prisma } from '../../utils/prisma';
import logger from '../../utils/logger';
import { CreateMeetingInput, ListMeetingsQuery } from './meetings.schema';

export interface MeetingWithRelations {
  id: string;
  userId: string;
  title: string;
  participants: string[];
  meetingDate: Date;
  transcript: unknown;
  createdAt: Date;
  updatedAt: Date;
  analysis: unknown | null;
  actionItems: unknown[];
}

export interface PaginatedMeetings {
  meetings: unknown[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function createMeeting(
  userId: string,
  data: CreateMeetingInput
): Promise<unknown> {
  logger.info('Creating meeting', { userId, title: data.title });

  const meeting = await prisma.meeting.create({
    data: {
      userId,
      title: data.title,
      participants: data.participants,
      meetingDate: new Date(data.meetingDate),
      transcript: data.transcript as any,
    },
  });

  logger.info('Meeting created successfully', { meetingId: meeting.id, userId });

  return meeting;
}

export async function getMeeting(
  userId: string,
  meetingId: string
): Promise<MeetingWithRelations | null> {
  logger.info('Fetching meeting', { userId, meetingId });

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      analysis: true,
      actionItems: true,
    },
  });

  if (!meeting) {
    logger.warn('Meeting not found', { meetingId });
    return null;
  }

  if (meeting.userId !== userId) {
    logger.warn('Meeting access denied: userId mismatch', {
      meetingId,
      ownerId: meeting.userId,
      requesterId: userId,
    });
    return null;
  }

  return meeting;
}

export async function listMeetings(
  userId: string,
  query: ListMeetingsQuery
): Promise<PaginatedMeetings> {
  const { page, limit, from, to } = query;
  const skip = (page - 1) * limit;

  logger.info('Listing meetings', { userId, page, limit, from, to });

  const where: any = { userId };

  if (from || to) {
    where.meetingDate = {};
    if (from) where.meetingDate.gte = new Date(from);
    if (to) where.meetingDate.lte = new Date(to);
  }

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.meeting.count({ where }),
  ]);

  logger.info('Meetings listed', { userId, total, returned: meetings.length });

  return {
    meetings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
