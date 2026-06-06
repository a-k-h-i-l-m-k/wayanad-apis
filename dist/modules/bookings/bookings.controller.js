"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const booking_service_1 = require("../../services/booking.service");
const availability_service_1 = require("../../services/availability.service");
const pricing_service_1 = require("../../services/pricing.service");
const prisma_1 = require("../../configs/prisma");
const query_1 = require("../../utils/query");
const errors_1 = require("../../utils/errors");
const audit_1 = require("../../utils/audit");
class BookingsController {
    bookingService = new booking_service_1.BookingService();
    availabilityService = new availability_service_1.AvailabilityService();
    pricingService = new pricing_service_1.PricingService();
    create = async (req, res, next) => {
        try {
            const actingUserId = req.user?.id;
            const result = await this.bookingService.createBooking(req.body, actingUserId);
            res.status(201).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getAll = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['bookingStatus', 'paymentStatus', 'bookingSource']);
            const where = { ...parsed.filters };
            // Optional Date range filter
            if (req.query.checkInFrom || req.query.checkInTo) {
                where.checkIn = {};
                if (req.query.checkInFrom) {
                    where.checkIn.gte = new Date(req.query.checkInFrom);
                }
                if (req.query.checkInTo) {
                    where.checkIn.lte = new Date(req.query.checkInTo);
                }
            }
            if (parsed.search) {
                where.OR = [
                    { bookingReference: { contains: parsed.search, mode: 'insensitive' } },
                    {
                        guest: {
                            OR: [
                                { firstName: { contains: parsed.search, mode: 'insensitive' } },
                                { lastName: { contains: parsed.search, mode: 'insensitive' } },
                                { email: { contains: parsed.search, mode: 'insensitive' } },
                                { phone: { contains: parsed.search, mode: 'insensitive' } },
                            ],
                        },
                    },
                ];
            }
            const [items, total] = await Promise.all([
                prisma_1.prisma.booking.findMany({
                    where,
                    include: {
                        guest: true,
                        bookingRooms: {
                            include: {
                                room: true,
                                roomType: true,
                            },
                        },
                    },
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { [parsed.sortBy]: parsed.sortOrder },
                }),
                prisma_1.prisma.booking.count({ where }),
            ]);
            // Format decimals
            const formattedItems = items.map((b) => ({
                ...b,
                totalAmount: Number(b.totalAmount),
                taxAmount: Number(b.taxAmount),
                discountAmount: Number(b.discountAmount),
                grandTotal: Number(b.grandTotal),
            }));
            res.status(200).json({
                status: 'success',
                data: (0, query_1.formatPaginatedResponse)(formattedItems, total, parsed),
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.getBookingById(id);
            // Convert Decimal to numbers
            const formatted = {
                ...booking,
                totalAmount: Number(booking.totalAmount),
                taxAmount: Number(booking.taxAmount),
                discountAmount: Number(booking.discountAmount),
                grandTotal: Number(booking.grandTotal),
                bookingRooms: booking.bookingRooms.map((br) => ({
                    ...br,
                    roomRate: Number(br.roomRate),
                })),
                payments: booking.payments.map((p) => ({
                    ...p,
                    amount: Number(p.amount),
                })),
            };
            res.status(200).json({
                status: 'success',
                data: formatted,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { bookingStatus, paymentStatus } = req.body;
            const actingUserId = req.user?.id;
            const oldBooking = await prisma_1.prisma.booking.findUnique({ where: { id } });
            if (!oldBooking)
                throw new errors_1.NotFoundError('Booking not found');
            const updated = await prisma_1.prisma.booking.update({
                where: { id },
                data: {
                    bookingStatus,
                    paymentStatus,
                },
            });
            await (0, audit_1.logAudit)({
                userId: actingUserId,
                action: 'UPDATE_BOOKING_STATUS',
                module: 'BOOKINGS',
                recordId: id,
                oldData: oldBooking,
                newData: updated,
            });
            res.status(200).json({
                status: 'success',
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const actingUserId = req.user?.id;
            const booking = await prisma_1.prisma.booking.findUnique({ where: { id } });
            if (!booking)
                throw new errors_1.NotFoundError('Booking not found');
            // Restrict delete if it's not cancelled
            if (booking.bookingStatus !== 'CANCELLED') {
                throw new errors_1.BadRequestError('Only cancelled bookings can be permanently deleted');
            }
            await prisma_1.prisma.$transaction(async (tx) => {
                // Cascade manually if constraints dictate, though prisma handles some
                await tx.bookingChild.deleteMany({
                    where: { bookingRoom: { bookingId: id } },
                });
                await tx.bookingRoom.deleteMany({
                    where: { bookingId: id },
                });
                await tx.booking.delete({
                    where: { id },
                });
            });
            await (0, audit_1.logAudit)({
                userId: actingUserId,
                action: 'DELETE_BOOKING',
                module: 'BOOKINGS',
                recordId: id,
                oldData: booking,
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
    cancel = async (req, res, next) => {
        try {
            const { bookingId, reason } = req.body;
            const actingUserId = req.user?.id;
            const result = await this.bookingService.cancelBooking(bookingId, reason, actingUserId);
            res.status(200).json({
                status: 'success',
                message: 'Booking successfully cancelled.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    checkAvailability = async (req, res, next) => {
        try {
            const result = await this.availabilityService.searchAvailability(req.body);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    calculatePrice = async (req, res, next) => {
        try {
            const result = await this.pricingService.calculatePrice(req.body);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    assignRoom = async (req, res, next) => {
        try {
            const { bookingRoomId, roomId } = req.body;
            const actingUserId = req.user?.id;
            const result = await this.bookingService.assignRoom(bookingRoomId, roomId, actingUserId);
            res.status(200).json({
                status: 'success',
                message: 'Physical room allocated successfully.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getCalendar = async (req, res, next) => {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                throw new errors_1.BadRequestError('startDate and endDate query parameters are required');
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new errors_1.BadRequestError('Invalid date format');
            }
            // Fetch bookings intersecting the calendar month range
            const bookings = await prisma_1.prisma.booking.findMany({
                where: {
                    bookingStatus: { not: 'CANCELLED' },
                    checkIn: { lt: end },
                    checkOut: { gt: start },
                },
                include: {
                    guest: true,
                    bookingRooms: {
                        include: {
                            room: true,
                            roomType: true,
                        },
                    },
                },
                orderBy: { checkIn: 'asc' },
            });
            const formatted = bookings.map((b) => ({
                id: b.id,
                bookingReference: b.bookingReference,
                guestName: `${b.guest.firstName} ${b.guest.lastName}`,
                checkIn: b.checkIn.toISOString().split('T')[0],
                checkOut: b.checkOut.toISOString().split('T')[0],
                status: b.bookingStatus,
                paymentStatus: b.paymentStatus,
                rooms: b.bookingRooms.map((br) => ({
                    roomNumber: br.room?.roomNumber || 'UNALLOCATED',
                    roomTypeName: br.roomType.name,
                    roomId: br.roomId,
                    bookingRoomId: br.id,
                })),
            }));
            res.status(200).json({
                status: 'success',
                data: formatted,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.BookingsController = BookingsController;
