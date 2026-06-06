"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsController = void 0;
const prisma_1 = require("../../configs/prisma");
const query_1 = require("../../utils/query");
const errors_1 = require("../../utils/errors");
class RoomsController {
    getAll = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['roomTypeId', 'status', 'maintenanceStatus']);
            const where = { ...parsed.filters };
            if (parsed.search) {
                where.OR = [
                    { roomNumber: { contains: parsed.search, mode: 'insensitive' } },
                    { floor: { contains: parsed.search, mode: 'insensitive' } },
                    { remarks: { contains: parsed.search, mode: 'insensitive' } },
                ];
            }
            const [items, total] = await Promise.all([
                prisma_1.prisma.room.findMany({
                    where,
                    include: {
                        roomType: true,
                    },
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { [parsed.sortBy]: parsed.sortOrder },
                }),
                prisma_1.prisma.room.count({ where }),
            ]);
            res.status(200).json({
                status: 'success',
                data: (0, query_1.formatPaginatedResponse)(items, total, parsed),
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const room = await prisma_1.prisma.room.findUnique({
                where: { id },
                include: {
                    roomType: true,
                },
            });
            if (!room) {
                throw new errors_1.NotFoundError('Room not found');
            }
            res.status(200).json({
                status: 'success',
                data: room,
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const roomData = req.body;
            const room = await prisma_1.prisma.room.create({
                data: roomData,
                include: {
                    roomType: true,
                },
            });
            res.status(201).json({
                status: 'success',
                data: room,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const room = await prisma_1.prisma.room.update({
                where: { id },
                data: updateData,
                include: {
                    roomType: true,
                },
            });
            res.status(200).json({
                status: 'success',
                data: room,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            // Check if room has active bookings allocated
            const activeBookingRooms = await prisma_1.prisma.bookingRoom.count({
                where: {
                    roomId: id,
                    booking: {
                        bookingStatus: { in: ['CONFIRMED', 'CHECKED_IN'] },
                    },
                },
            });
            if (activeBookingRooms > 0) {
                res.status(400).json({
                    status: 'fail',
                    message: 'Cannot delete a room with active bookings allocated. Please unallocate or relocate those bookings first.',
                });
                return;
            }
            await prisma_1.prisma.room.delete({
                where: { id },
            });
            res.status(204).json({
                status: 'success',
                data: null,
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateMaintenance = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { maintenanceStatus, remarks } = req.body;
            const room = await prisma_1.prisma.room.update({
                where: { id },
                data: {
                    maintenanceStatus,
                    remarks: remarks || undefined,
                },
            });
            res.status(200).json({
                status: 'success',
                data: room,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.RoomsController = RoomsController;
