import { z } from 'zod';

const TranscriptEntrySchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  speaker: z.string().min(1, 'Speaker is required'),
  text: z.string().min(1, 'Text is required'),
});

export const CreateMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  participants: z
    .array(z.string().email('Each participant must be a valid email'))
    .min(1, 'At least one participant is required'),
  meetingDate: z.string().datetime({ message: 'meetingDate must be a valid ISO 8601 datetime' }),
  transcript: z
    .array(TranscriptEntrySchema)
    .min(1, 'Transcript must have at least one entry'),
});

export const ListMeetingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  from: z.string().datetime({ message: 'from must be a valid ISO 8601 datetime' }).optional(),
  to: z.string().datetime({ message: 'to must be a valid ISO 8601 datetime' }).optional(),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
export type ListMeetingsQuery = z.infer<typeof ListMeetingsQuerySchema>;
