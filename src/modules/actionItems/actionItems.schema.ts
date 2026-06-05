import { z } from 'zod';

const CitationSchema = z.object({
  timestamp: z.string().min(1),
});

export const CreateActionItemSchema = z.object({
  task: z.string().min(1, 'Task is required'),
  assignee: z.string().email('Assignee must be a valid email'),
  meetingId: z.string().uuid('meetingId must be a valid UUID'),
  dueDate: z.string().datetime({ message: 'dueDate must be a valid ISO 8601 datetime' }).optional(),
  citations: z.array(CitationSchema).optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' }),
  }),
});

export const ListActionItemsQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  assignee: z.string().email().optional(),
  meetingId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateActionItemInput = z.infer<typeof CreateActionItemSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type ListActionItemsQuery = z.infer<typeof ListActionItemsQuerySchema>;
