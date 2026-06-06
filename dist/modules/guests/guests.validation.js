"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGuestSchema = exports.createGuestSchema = void 0;
const zod_1 = require("zod");
exports.createGuestSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Please provide a valid email address'),
    phone: zod_1.z.string().optional(),
    nationality: zod_1.z.string().optional(),
    passportNumber: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().datetime().optional().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateGuestSchema = exports.createGuestSchema.partial();
