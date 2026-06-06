import { z } from 'zod';

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  roomTypeId: z.string().uuid('Invalid Room Type ID'),
  floor: z.string().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED']).default('AVAILABLE'),
  maintenanceStatus: z.enum(['OPERATIONAL', 'UNDER_MAINTENANCE', 'OUT_OF_ORDER']).default('OPERATIONAL'),
  remarks: z.string().optional(),
});

export const updateRoomSchema = createRoomSchema.partial();
