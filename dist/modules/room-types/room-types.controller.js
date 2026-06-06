"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomTypesController = void 0;
const prisma_1 = require("../../configs/prisma");
const errors_1 = require("../../utils/errors");
class RoomTypesController {
    getAll = async (req, res, next) => {
        try {
            // Return all room types (typically needed by both public web booking engine and admin panel)
            const roomTypes = await prisma_1.prisma.roomType.findMany({
                include: {
                    rooms: true,
                },
                orderBy: { name: 'asc' },
            });
            res.status(200).json({
                status: 'success',
                data: roomTypes.map((rt) => ({
                    ...rt,
                    basePrice: Number(rt.basePrice),
                })),
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const roomType = await prisma_1.prisma.roomType.findUnique({
                where: { id },
                include: {
                    rooms: true,
                    seasonalRates: true,
                    specialRates: true,
                },
            });
            if (!roomType) {
                throw new errors_1.NotFoundError('Room Type not found');
            }
            res.status(200).json({
                status: 'success',
                data: {
                    ...roomType,
                    basePrice: Number(roomType.basePrice),
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const roomTypeData = req.body;
            const roomType = await prisma_1.prisma.roomType.create({
                data: roomTypeData,
            });
            res.status(201).json({
                status: 'success',
                data: {
                    ...roomType,
                    basePrice: Number(roomType.basePrice),
                },
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
            const roomType = await prisma_1.prisma.roomType.update({
                where: { id },
                data: updateData,
            });
            res.status(200).json({
                status: 'success',
                data: {
                    ...roomType,
                    basePrice: Number(roomType.basePrice),
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            // Check if room type has any rooms associated
            const roomCount = await prisma_1.prisma.room.count({
                where: { roomTypeId: id },
            });
            if (roomCount > 0) {
                res.status(400).json({
                    status: 'fail',
                    message: 'Cannot delete a room type with active rooms. Please delete or migrate the rooms first.',
                });
                return;
            }
            await prisma_1.prisma.roomType.delete({
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
}
exports.RoomTypesController = RoomTypesController;
