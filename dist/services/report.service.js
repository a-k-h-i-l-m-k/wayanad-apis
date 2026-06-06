"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const prisma_1 = require("../configs/prisma");
const errors_1 = require("../utils/errors");
class ReportService {
    /**
     * Get Revenue Report by Date Range
     */
    async getRevenueReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            throw new errors_1.BadRequestError('Start date must be before end date');
        }
        // 1. Booking Room Revenue (Sum of booking rooms total)
        const bookings = await prisma_1.prisma.booking.findMany({
            where: {
                bookingStatus: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
                createdAt: { gte: start, lte: end },
            },
            select: {
                totalAmount: true,
                taxAmount: true,
                grandTotal: true,
            },
        });
        const roomSubtotal = bookings.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
        const roomTax = bookings.reduce((acc, curr) => acc + Number(curr.taxAmount), 0);
        const roomGrandTotal = bookings.reduce((acc, curr) => acc + Number(curr.grandTotal), 0);
        // 2. Experience Revenue
        const experienceBookings = await prisma_1.prisma.experienceBooking.findMany({
            where: {
                bookingDate: { gte: start, lte: end },
            },
            select: {
                amount: true,
            },
        });
        const experienceTotal = experienceBookings.reduce((acc, curr) => acc + Number(curr.amount), 0);
        // 3. Completed Payments
        const payments = await prisma_1.prisma.payment.findMany({
            where: {
                status: 'COMPLETED',
                paidAt: { gte: start, lte: end },
            },
            select: {
                amount: true,
            },
        });
        const collectionsTotal = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
        // 4. Refunds
        const refunds = await prisma_1.prisma.refund.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: start, lte: end },
            },
            select: {
                amount: true,
            },
        });
        const refundsTotal = refunds.reduce((acc, curr) => acc + Number(curr.amount), 0);
        return {
            period: { startDate, endDate },
            roomRevenue: {
                subtotal: roomSubtotal,
                tax: roomTax,
                grandTotal: roomGrandTotal,
            },
            experienceRevenue: experienceTotal,
            diningRevenue: Math.round(roomSubtotal * 0.12 * 100) / 100, // Estimated dining sales (12% of room rev as model fallback)
            collections: collectionsTotal,
            refunds: refundsTotal,
            netRevenue: roomGrandTotal + experienceTotal + (roomSubtotal * 0.12) - refundsTotal,
        };
    }
    /**
     * Get Occupancy Report
     */
    async getOccupancyReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (nights <= 0) {
            throw new errors_1.BadRequestError('End date must be at least 1 day after start date');
        }
        // Total operational rooms
        const totalRoomsCount = await prisma_1.prisma.room.count({
            where: { maintenanceStatus: 'OPERATIONAL' },
        });
        const totalAvailableRoomNights = totalRoomsCount * nights;
        // Find all room-nights booked
        const bookingRooms = await prisma_1.prisma.bookingRoom.findMany({
            where: {
                booking: {
                    bookingStatus: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
                    checkIn: { lt: end },
                    checkOut: { gt: start },
                },
            },
            include: {
                booking: {
                    select: {
                        checkIn: true,
                        checkOut: true,
                    },
                },
            },
        });
        let occupiedRoomNights = 0;
        bookingRooms.forEach((br) => {
            // Calculate intersection days
            const bStart = new Date(br.booking.checkIn);
            const bEnd = new Date(br.booking.checkOut);
            const overlapStart = bStart < start ? start : bStart;
            const overlapEnd = bEnd > end ? end : bEnd;
            const overlapNights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
            if (overlapNights > 0) {
                occupiedRoomNights += overlapNights;
            }
        });
        const occupancyRate = totalAvailableRoomNights > 0
            ? Math.round((occupiedRoomNights / totalAvailableRoomNights) * 10000) / 100
            : 0;
        return {
            period: { startDate, endDate, totalNights: nights },
            totalRooms: totalRoomsCount,
            totalAvailableRoomNights,
            occupiedRoomNights,
            occupancyPercentage: occupancyRate,
        };
    }
    /**
     * Get ADR (Average Daily Rate) and RevPAR (Revenue Per Available Room)
     */
    async getKpisReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const revenueData = await this.getRevenueReport(startDate, endDate);
        const occupancyData = await this.getOccupancyReport(startDate, endDate);
        const roomRevenue = revenueData.roomRevenue.subtotal;
        const occupiedRoomNights = occupancyData.occupiedRoomNights;
        const totalAvailableRoomNights = occupancyData.totalAvailableRoomNights;
        const adr = occupiedRoomNights > 0 ? Math.round((roomRevenue / occupiedRoomNights) * 100) / 100 : 0;
        const revPar = totalAvailableRoomNights > 0 ? Math.round((roomRevenue / totalAvailableRoomNights) * 100) / 100 : 0;
        return {
            period: { startDate, endDate },
            roomRevenue,
            occupiedRoomNights,
            totalAvailableRoomNights,
            adr,
            revPar,
            occupancyPercentage: occupancyData.occupancyPercentage,
        };
    }
    /**
     * Get Bookings Analytics (volume, source, status counts)
     */
    async getBookingsReport(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const bookings = await prisma_1.prisma.booking.findMany({
            where: {
                createdAt: { gte: start, lte: end },
            },
        });
        const totalBookings = bookings.length;
        // Group by source
        const sourceCounts = {};
        // Group by status
        const statusCounts = {};
        bookings.forEach((b) => {
            sourceCounts[b.bookingSource] = (sourceCounts[b.bookingSource] || 0) + 1;
            statusCounts[b.bookingStatus] = (statusCounts[b.bookingStatus] || 0) + 1;
        });
        return {
            period: { startDate, endDate },
            totalBookings,
            bySource: sourceCounts,
            byStatus: statusCounts,
        };
    }
    /**
     * Get Dashboard Summary Metrics
     */
    async getDashboardMetrics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        // 1. Total rooms
        const totalRooms = await prisma_1.prisma.room.count({
            where: { maintenanceStatus: 'OPERATIONAL' },
        });
        // 2. Today's bookings counts (occupied or arriving)
        const occupiedTodayCount = await prisma_1.prisma.bookingRoom.count({
            where: {
                booking: {
                    bookingStatus: { in: ['CONFIRMED', 'CHECKED_IN'] },
                    checkIn: { lte: today },
                    checkOut: { gt: today },
                },
            },
        });
        const checkInsTodayCount = await prisma_1.prisma.booking.count({
            where: {
                bookingStatus: 'CONFIRMED',
                checkIn: { gte: today, lt: tomorrow },
            },
        });
        const checkOutsTodayCount = await prisma_1.prisma.booking.count({
            where: {
                bookingStatus: 'CHECKED_IN',
                checkOut: { gte: today, lt: tomorrow },
            },
        });
        // 3. Current month financial totals
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const confirmedMonthBookings = await prisma_1.prisma.booking.findMany({
            where: {
                bookingStatus: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
                createdAt: { gte: currentMonthStart },
            },
            select: {
                grandTotal: true,
            },
        });
        const currentMonthRevenue = confirmedMonthBookings.reduce((acc, curr) => acc + Number(curr.grandTotal), 0);
        // 4. Pending items
        const pendingEnquiriesCount = await prisma_1.prisma.contactEnquiry.count({
            where: { status: 'PENDING' },
        });
        const unreadNotificationsCount = await prisma_1.prisma.notification.count({
            where: { read: false },
        });
        return {
            today: {
                date: today.toISOString().split('T')[0],
                occupancyPercentage: totalRooms > 0 ? Math.round((occupiedTodayCount / totalRooms) * 10000) / 100 : 0,
                occupiedRooms: occupiedTodayCount,
                availableRooms: Math.max(0, totalRooms - occupiedTodayCount),
                pendingCheckIns: checkInsTodayCount,
                pendingCheckOuts: checkOutsTodayCount,
            },
            financials: {
                currentMonthStart: currentMonthStart.toISOString().split('T')[0],
                currentMonthRevenue,
            },
            operational: {
                pendingEnquiries: pendingEnquiriesCount,
                unreadNotifications: unreadNotificationsCount,
            },
        };
    }
}
exports.ReportService = ReportService;
