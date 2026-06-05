import { z } from 'zod';

export const UuidParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
