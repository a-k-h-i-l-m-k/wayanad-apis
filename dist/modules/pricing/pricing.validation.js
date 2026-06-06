"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSpecialRateSchema = exports.createSpecialRateSchema = exports.updateSeasonalRateSchema = exports.createSeasonalRateSchema = void 0;
const zod_1 = require("zod");
exports.createSeasonalRateSchema = zod_1.z.object({
    roomTypeId: zod_1.z.string().uuid('Invalid Room Type ID'),
    seasonName: zod_1.z.string().min(1, 'Season name is required'),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekdayPrice: zod_1.z.number().positive(),
    weekendPrice: zod_1.z.number().positive(),
});
exports.updateSeasonalRateSchema = exports.createSeasonalRateSchema.partial();
exports.createSpecialRateSchema = zod_1.z.object({
    roomTypeId: zod_1.z.string().uuid('Invalid Room Type ID'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    price: zod_1.z.number().positive(),
    reason: zod_1.z.string().optional(),
});
exports.updateSpecialRateSchema = exports.createSpecialRateSchema.partial();
