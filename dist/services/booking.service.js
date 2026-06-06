"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const prisma_1 = require("../configs/prisma");
const errors_1 = require("../utils/errors");
const availability_service_1 = require("./availability.service");
const pricing_service_1 = require("./pricing.service");
const audit_1 = require("../utils/audit");
class BookingService {
    availabilityService = new availability_service_1.AvailabilityService();
    pricingService = new pricing_service_1.PricingService();
    /**
     * Generates a unique booking reference code: WR-YYYYMMDD-XXXX
     */
    generateBookingReference() {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `WR-${today}-${random}`;
    }
    /**
     * Generates a unique guest code: GUEST-XXXXX
     */
    generateGuestCode() {
        return `GUEST-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    /**
     * Create a complete reservation
     */
    async createBooking(params, actingUserId) {
        const { guest, checkIn, checkOut, rooms, bookingSource = 'WEBSITE', offerId, paymentMethod, paymentAmount, transactionReference } = params;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (start >= end) {
            throw new errors_1.BadRequestError('Check-out date must be after check-in date');
        }
        // 1. Process Guest (Find existing or create new)
        let dbGuest = await prisma_1.prisma.guest.findUnique({
            where: { email: guest.email },
        });
        if (!dbGuest) {
            dbGuest = await prisma_1.prisma.guest.create({
                data: {
                    guestCode: this.generateGuestCode(),
                    firstName: guest.firstName,
                    lastName: guest.lastName,
                    email: guest.email,
                    phone: guest.phone,
                    nationality: guest.nationality,
                    passportNumber: guest.passportNumber,
                    dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth) : null,
                    address: guest.address,
                    notes: guest.notes,
                },
            });
        }
        // 2. Pricing and Availability calculations
        let totalBaseAmount = 0;
        let totalTaxAmount = 0;
        let totalDiscountAmount = 0;
        let totalGrandTotal = 0;
        const roomDetailsWithRates = [];
        // Check each room request sequentially
        for (const roomReq of rooms) {
            const priceDetails = await this.pricingService.calculatePrice({
                roomTypeId: roomReq.roomTypeId,
                checkIn,
                checkOut,
                adults: roomReq.adults,
                children: roomReq.children,
                childrenAges: roomReq.childrenAges,
                extraBeds: roomReq.extraBeds,
                offerId,
            });
            // Track the pricing details for saving
            roomDetailsWithRates.push({
                roomReq,
                priceDetails,
            });
            totalBaseAmount += priceDetails.subTotal;
            totalTaxAmount += priceDetails.taxAmount;
            totalDiscountAmount += priceDetails.discountAmount;
            totalGrandTotal += priceDetails.grandTotal;
        }
        // Verify rooms are actually available in inventory
        const availability = await this.availabilityService.searchAvailability({
            checkIn,
            checkOut,
            adults: rooms.reduce((acc, curr) => acc + curr.adults, 0),
            children: rooms.reduce((acc, curr) => acc + curr.children, 0),
        });
        // Check availability counts
        const requestedCountsByRoomType = {};
        rooms.forEach((r) => {
            requestedCountsByRoomType[r.roomTypeId] = (requestedCountsByRoomType[r.roomTypeId] || 0) + 1;
        });
        for (const [rtId, reqCount] of Object.entries(requestedCountsByRoomType)) {
            const avail = availability.find((a) => a.roomTypeId === rtId);
            if (!avail || avail.availableCount < reqCount) {
                throw new errors_1.BadRequestError(`Requested room type is not available or has insufficient inventory for these dates`);
            }
        }
        // 3. Allocate physical rooms automatically where possible
        const allocatedRoomsList = [];
        const usedRoomIds = new Set();
        for (let idx = 0; idx < rooms.length; idx++) {
            const roomReq = rooms[idx];
            // If admin panel requested specific room, verify it's available
            if (roomReq.roomId) {
                const isAvail = await this.availabilityService.checkSpecificRoomsAvailability([roomReq.roomId], checkIn, checkOut);
                if (!isAvail) {
                    throw new errors_1.BadRequestError(`Requested room ID ${roomReq.roomId} is not available for these dates.`);
                }
                allocatedRoomsList.push({ roomReqIndex: idx, roomId: roomReq.roomId });
                usedRoomIds.add(roomReq.roomId);
            }
            else {
                // Auto-allocate
                const availableRooms = await this.availabilityService.getAvailableRoomsForAllocation(roomReq.roomTypeId, start, end);
                const freeRoom = availableRooms.find((r) => !usedRoomIds.has(r.id));
                if (freeRoom) {
                    allocatedRoomsList.push({ roomReqIndex: idx, roomId: freeRoom.id });
                    usedRoomIds.add(freeRoom.id);
                }
                else {
                    // Leave unallocated (front desk can assign room on check-in or later)
                    allocatedRoomsList.push({ roomReqIndex: idx, roomId: null });
                }
            }
        }
        // 4. Create Transaction
        const booking = await prisma_1.prisma.$transaction(async (tx) => {
            const ref = this.generateBookingReference();
            // Create Booking
            const dbBooking = await tx.booking.create({
                data: {
                    bookingReference: ref,
                    guestId: dbGuest.id,
                    checkIn: start,
                    checkOut: end,
                    bookingStatus: 'PENDING',
                    paymentStatus: 'UNPAID',
                    totalAmount: totalBaseAmount,
                    taxAmount: totalTaxAmount,
                    discountAmount: totalDiscountAmount,
                    grandTotal: totalGrandTotal,
                    bookingSource,
                },
            });
            // Create Booking Rooms and Children details
            for (let idx = 0; idx < roomDetailsWithRates.length; idx++) {
                const { roomReq, priceDetails } = roomDetailsWithRates[idx];
                const allocation = allocatedRoomsList.find((a) => a.roomReqIndex === idx);
                const dbBookingRoom = await tx.bookingRoom.create({
                    data: {
                        bookingId: dbBooking.id,
                        roomTypeId: roomReq.roomTypeId,
                        roomId: allocation?.roomId || null,
                        adults: roomReq.adults,
                        children: roomReq.children,
                        extraBeds: roomReq.extraBeds,
                        roomRate: priceDetails.subTotal / priceDetails.nights, // avg rate per night
                    },
                });
                // Seed children ages
                if (roomReq.children > 0 && roomReq.childrenAges.length > 0) {
                    await tx.bookingChild.createMany({
                        data: roomReq.childrenAges.map((age) => ({
                            bookingRoomId: dbBookingRoom.id,
                            age,
                        })),
                    });
                }
            }
            // 5. Handle initial payment if provided
            if (paymentMethod && paymentAmount && paymentAmount > 0) {
                const pStatus = paymentAmount >= totalGrandTotal ? 'COMPLETED' : 'PENDING';
                const payment = await tx.payment.create({
                    data: {
                        bookingId: dbBooking.id,
                        paymentMethod,
                        amount: paymentAmount,
                        status: pStatus,
                        transactionReference: transactionReference || null,
                        paidAt: pStatus === 'COMPLETED' ? new Date() : null,
                    },
                });
                // Update booking flags
                const payStatus = paymentAmount >= totalGrandTotal ? 'PAID' : 'PARTIALLY_PAID';
                const bookStatus = paymentAmount >= totalGrandTotal ? 'CONFIRMED' : 'PENDING';
                await tx.booking.update({
                    where: { id: dbBooking.id },
                    data: {
                        paymentStatus: payStatus,
                        bookingStatus: bookStatus,
                    },
                });
            }
            // Create notification
            await tx.notification.create({
                data: {
                    type: 'BOOKING_CREATED',
                    title: 'New Reservation Created',
                    message: `Booking ref: ${ref} created for ${dbGuest.firstName} ${dbGuest.lastName}. Total: INR ${totalGrandTotal}.`,
                },
            });
            return dbBooking;
        });
        // Write audit log
        await (0, audit_1.logAudit)({
            userId: actingUserId,
            action: 'CREATE_BOOKING',
            module: 'BOOKINGS',
            recordId: booking.id,
            newData: booking,
        });
        // Load full booking details to return
        return this.getBookingById(booking.id);
    }
    /**
     * Retrieve booking by ID with all relations
     */
    async getBookingById(id) {
        const booking = await prisma_1.prisma.booking.findUnique({
            where: { id },
            include: {
                guest: true,
                bookingRooms: {
                    include: {
                        room: true,
                        roomType: true,
                        childrenAges: true,
                    },
                },
                payments: {
                    include: {
                        refunds: true,
                    },
                },
                experienceBookings: {
                    include: {
                        experience: true,
                    },
                },
            },
        });
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        return booking;
    }
    /**
     * Cancel booking
     */
    async cancelBooking(id, reason, actingUserId) {
        const booking = await this.getBookingById(id);
        if (booking.bookingStatus === 'CANCELLED') {
            throw new errors_1.BadRequestError('Booking is already cancelled');
        }
        const updatedBooking = await prisma_1.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id },
                data: {
                    bookingStatus: 'CANCELLED',
                },
            });
            // Create Notification
            await tx.notification.create({
                data: {
                    type: 'BOOKING_CANCELLED',
                    title: 'Booking Cancelled',
                    message: `Booking ref: ${booking.bookingReference} has been cancelled. Reason: ${reason}`,
                },
            });
            return updated;
        });
        await (0, audit_1.logAudit)({
            userId: actingUserId,
            action: 'CANCEL_BOOKING',
            module: 'BOOKINGS',
            recordId: id,
            oldData: booking,
            newData: updatedBooking,
        });
        return updatedBooking;
    }
    /**
     * Assign a room to a booking room
     */
    async assignRoom(bookingRoomId, roomId, actingUserId) {
        const bookingRoom = await prisma_1.prisma.bookingRoom.findUnique({
            where: { id: bookingRoomId },
            include: { booking: true },
        });
        if (!bookingRoom) {
            throw new errors_1.NotFoundError('Booking Room record not found');
        }
        const room = await prisma_1.prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            throw new errors_1.NotFoundError('Physical Room not found');
        }
        if (room.roomTypeId !== bookingRoom.roomTypeId) {
            throw new errors_1.BadRequestError('Room type of selected room does not match booking room type');
        }
        // Check if the physical room is free for the booking dates
        const isAvailable = await this.availabilityService.checkSpecificRoomsAvailability([roomId], bookingRoom.booking.checkIn.toISOString().split('T')[0], bookingRoom.booking.checkOut.toISOString().split('T')[0]);
        if (!isAvailable) {
            throw new errors_1.BadRequestError('This room is already occupied or reserved for these dates');
        }
        const oldBookingRoom = { ...bookingRoom };
        const updated = await prisma_1.prisma.bookingRoom.update({
            where: { id: bookingRoomId },
            data: { roomId },
            include: { room: true },
        });
        await (0, audit_1.logAudit)({
            userId: actingUserId,
            action: 'ASSIGN_ROOM',
            module: 'BOOKINGS',
            recordId: bookingRoom.bookingId,
            oldData: oldBookingRoom,
            newData: updated,
        });
        return updated;
    }
}
exports.BookingService = BookingService;
