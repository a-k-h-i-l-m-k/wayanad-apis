"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional().or(zod_1.z.string().optional()),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    roleId: zod_1.z.string().uuid('Invalid Role ID'),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});
exports.updateUserSchema = exports.createUserSchema.omit({ password: true }).partial();
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
});
