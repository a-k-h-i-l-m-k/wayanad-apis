import { z } from 'zod';

export const guestInputSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const roomBookingInputSchema = z.object({
  roomTypeId: z.string().uuid('Invalid Room Type ID'),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  childrenAges: z.array(z.number().int()).default([]),
  extraBeds: z.number().int().min(0).default(0),
  roomId: z.string().uuid().optional(),
});

export const createBookingSchema = z.object({
  guest: guestInputSchema,
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be in format YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be in format YYYY-MM-DD'),
  rooms: z.array(roomBookingInputSchema).min(1, 'At least one room is required for booking'),
  bookingSource: z.enum(['WEBSITE', 'ADMIN', 'BOOKING_AGENT', 'WAL_IN']).default('WEBSITE'),
  offerId: z.string().uuid().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH', 'BANK_TRANSFER']).optional(),
  paymentAmount: z.number().nonnegative().optional(),
  transactionReference: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  bookingStatus: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED']).optional(),
});

export const assignRoomSchema = z.object({
  bookingRoomId: z.string().uuid(),
  roomId: z.string().uuid(),
});

export const checkAvailabilitySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().default(1),
  children: z.number().int().default(0),
});

export const calculatePriceSchema = z.object({
  roomTypeId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1),
  children: z.number().int().default(0),
  childrenAges: z.array(z.number().int()).default([]),
  extraBeds: z.number().int().default(0),
  offerId: z.string().uuid().optional(),
});
