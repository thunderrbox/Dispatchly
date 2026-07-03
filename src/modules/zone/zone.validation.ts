import { z } from 'zod';

export const CreateZoneSchema = z.object({
  name: z.string().min(2, 'Zone name must be at least 2 characters'),
});

export const CreateAreaSchema = z.object({
  name: z.string().min(2, 'Area name must be at least 2 characters'),
});
