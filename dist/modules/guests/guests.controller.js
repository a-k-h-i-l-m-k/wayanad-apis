"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestsController = void 0;
const prisma_1 = require("../../configs/prisma");
const query_1 = require("../../utils/query");
const errors_1 = require("../../utils/errors");
class GuestsController {
    generateGuestCode() {
        return `GUEST-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    getAll = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['nationality']);
            const where = { ...parsed.filters };
            if (parsed.search) {
                where.OR = [
                    { firstName: { contains: parsed.search, mode: 'insensitive' } },
                    { lastName: { contains: parsed.search, mode: 'insensitive' } },
                    { email: { contains: parsed.search, mode: 'insensitive' } },
                    { phone: { contains: parsed.search, mode: 'insensitive' } },
                    { guestCode: { contains: parsed.search, mode: 'insensitive' } },
                ];
            }
            const [items, total] = await Promise.all([
                prisma_1.prisma.guest.findMany({
                    where,
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { [parsed.sortBy]: parsed.sortOrder },
                }),
                prisma_1.prisma.guest.count({ where }),
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
            const guest = await prisma_1.prisma.guest.findUnique({
                where: { id },
                include: {
                    bookings: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            if (!guest) {
                throw new errors_1.NotFoundError('Guest not found');
            }
            res.status(200).json({
                status: 'success',
                data: guest,
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const guestData = req.body;
            // Auto-generate guestCode if not provided
            const guestCode = this.generateGuestCode();
            const guest = await prisma_1.prisma.guest.create({
                data: {
                    ...guestData,
                    guestCode,
                    dateOfBirth: guestData.dateOfBirth ? new Date(guestData.dateOfBirth) : null,
                },
            });
            res.status(201).json({
                status: 'success',
                data: guest,
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
            if (updateData.dateOfBirth) {
                updateData.dateOfBirth = new Date(updateData.dateOfBirth);
            }
            const guest = await prisma_1.prisma.guest.update({
                where: { id },
                data: updateData,
            });
            res.status(200).json({
                status: 'success',
                data: guest,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            // Check if guest has bookings
            const bookingCount = await prisma_1.prisma.booking.count({
                where: { guestId: id },
            });
            if (bookingCount > 0) {
                res.status(400).json({
                    status: 'fail',
                    message: 'Cannot delete guest with active booking history. Archive or deactivate instead.',
                });
                return;
            }
            await prisma_1.prisma.guest.delete({
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
exports.GuestsController = GuestsController;
