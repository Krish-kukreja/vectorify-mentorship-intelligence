import { z } from 'zod';

const TranscriptEntrySchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  speaker: z.string().min(1, 'Speaker is required'),
  text: z.string().min(1, 'Text is required'),
});

export const CreateSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  participants: z
    .array(z.string().email('Each participant must be a valid email'))
    .min(1, 'At least one participant is required'),
  sessionDate: z.string().datetime({ message: 'sessionDate must be a valid ISO 8601 datetime' }),
  transcript: z
    .array(TranscriptEntrySchema)
    .min(1, 'Transcript must have at least one entry'),
});

export const ListSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  from: z.string().datetime({ message: 'from must be a valid ISO 8601 datetime' }).optional(),
  to: z.string().datetime({ message: 'to must be a valid ISO 8601 datetime' }).optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type ListSessionsQuery = z.infer<typeof ListSessionsQuerySchema>;
