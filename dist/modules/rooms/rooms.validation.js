"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoomSchema = exports.createRoomSchema = void 0;
const zod_1 = require("zod");
exports.createRoomSchema = zod_1.z.object({
    roomNumber: zod_1.z.string().min(1, 'Room number is required'),
    roomTypeId: zod_1.z.string().uuid('Invalid Room Type ID'),
    floor: zod_1.z.string().optional(),
    status: zod_1.z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED']).default('AVAILABLE'),
    maintenanceStatus: zod_1.z.enum(['OPERATIONAL', 'UNDER_MAINTENANCE', 'OUT_OF_ORDER']).default('OPERATIONAL'),
    remarks: zod_1.z.string().optional(),
});
exports.updateRoomSchema = exports.createRoomSchema.partial();
