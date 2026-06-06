import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  basePrice: z.number().positive('Base price must be a positive number'),
  maxAdults: z.number().int().min(1),
  maxChildren: z.number().int().min(0),
  maxOccupancy: z.number().int().min(1),
  sizeSqft: z.number().int().positive(),
  viewType: z.string().min(1),
  extraBedAllowed: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();
