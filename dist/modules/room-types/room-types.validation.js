"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoomTypeSchema = exports.createRoomTypeSchema = void 0;
const zod_1 = require("zod");
exports.createRoomTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    slug: zod_1.z.string().min(1, 'Slug is required'),
    description: zod_1.z.string().optional(),
    basePrice: zod_1.z.number().positive('Base price must be a positive number'),
    maxAdults: zod_1.z.number().int().min(1),
    maxChildren: zod_1.z.number().int().min(0),
    maxOccupancy: zod_1.z.number().int().min(1),
    sizeSqft: zod_1.z.number().int().positive(),
    viewType: zod_1.z.string().min(1),
    extraBedAllowed: zod_1.z.boolean().default(false),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
exports.updateRoomTypeSchema = exports.createRoomTypeSchema.partial();
