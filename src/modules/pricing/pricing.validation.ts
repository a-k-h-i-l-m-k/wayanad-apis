import { z } from 'zod';

export const createSeasonalRateSchema = z.object({
  roomTypeId: z.string().uuid('Invalid Room Type ID'),
  seasonName: z.string().min(1, 'Season name is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekdayPrice: z.number().positive(),
  weekendPrice: z.number().positive(),
});

export const updateSeasonalRateSchema = createSeasonalRateSchema.partial();

export const createSpecialRateSchema = z.object({
  roomTypeId: z.string().uuid('Invalid Room Type ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().positive(),
  reason: z.string().optional(),
});

export const updateSpecialRateSchema = createSpecialRateSchema.partial();
