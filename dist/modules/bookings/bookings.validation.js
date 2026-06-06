"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePriceSchema = exports.checkAvailabilitySchema = exports.assignRoomSchema = exports.updateBookingStatusSchema = exports.createBookingSchema = exports.roomBookingInputSchema = exports.guestInputSchema = void 0;
const zod_1 = require("zod");
exports.guestInputSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().optional(),
    nationality: zod_1.z.string().optional(),
    passportNumber: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.roomBookingInputSchema = zod_1.z.object({
    roomTypeId: zod_1.z.string().uuid('Invalid Room Type ID'),
    adults: zod_1.z.number().int().min(1),
    children: zod_1.z.number().int().min(0).default(0),
    childrenAges: zod_1.z.array(zod_1.z.number().int()).default([]),
    extraBeds: zod_1.z.number().int().min(0).default(0),
    roomId: zod_1.z.string().uuid().optional(),
});
exports.createBookingSchema = zod_1.z.object({
    guest: exports.guestInputSchema,
    checkIn: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be in format YYYY-MM-DD'),
    checkOut: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be in format YYYY-MM-DD'),
    rooms: zod_1.z.array(exports.roomBookingInputSchema).min(1, 'At least one room is required for booking'),
    bookingSource: zod_1.z.enum(['WEBSITE', 'ADMIN', 'BOOKING_AGENT', 'WAL_IN']).default('WEBSITE'),
    offerId: zod_1.z.string().uuid().optional(),
    paymentMethod: zod_1.z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH', 'BANK_TRANSFER']).optional(),
    paymentAmount: zod_1.z.number().nonnegative().optional(),
    transactionReference: zod_1.z.string().optional(),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    bookingStatus: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']),
    paymentStatus: zod_1.z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED']).optional(),
});
exports.assignRoomSchema = zod_1.z.object({
    bookingRoomId: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid(),
});
exports.checkAvailabilitySchema = zod_1.z.object({
    checkIn: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    adults: zod_1.z.number().int().default(1),
    children: zod_1.z.number().int().default(0),
});
exports.calculatePriceSchema = zod_1.z.object({
    roomTypeId: zod_1.z.string().uuid(),
    checkIn: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    adults: zod_1.z.number().int().min(1),
    children: zod_1.z.number().int().default(0),
    childrenAges: zod_1.z.array(zod_1.z.number().int()).default([]),
    extraBeds: zod_1.z.number().int().default(0),
    offerId: zod_1.z.string().uuid().optional(),
});
