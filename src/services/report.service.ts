import { prisma } from '../configs/prisma';
import { BadRequestError } from '../utils/errors';

export class ReportService {
  /**
   * Get Revenue Report by Date Range
   */
  public async getRevenueReport(startDate: string, endDate: string): Promise<any> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }

    // 1. Booking Room Revenue (Sum of booking rooms total)
    const bookings = await prisma.booking.findMany({
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

    const roomSubtotal = bookings.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0);
    const roomTax = bookings.reduce((acc: number, curr: any) => acc + Number(curr.taxAmount), 0);
    const roomGrandTotal = bookings.reduce((acc: number, curr: any) => acc + Number(curr.grandTotal), 0);

    // 2. Experience Revenue
    const experienceBookings = await prisma.experienceBooking.findMany({
      where: {
        bookingDate: { gte: start, lte: end },
      },
      select: {
        amount: true,
      },
    });

    const experienceTotal = experienceBookings.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

    // 3. Completed Payments
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
      },
    });

    const collectionsTotal = payments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

    // 4. Refunds
    const refunds = await prisma.refund.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
      },
    });

    const refundsTotal = refunds.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

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
  public async getOccupancyReport(startDate: string, endDate: string): Promise<any> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new BadRequestError('End date must be at least 1 day after start date');
    }

    // Total operational rooms
    const totalRoomsCount = await prisma.room.count({
      where: { maintenanceStatus: 'OPERATIONAL' },
    });

    const totalAvailableRoomNights = totalRoomsCount * nights;

    // Find all room-nights booked
    const bookingRooms = await prisma.bookingRoom.findMany({
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

    bookingRooms.forEach((br: any) => {
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
  public async getKpisReport(startDate: string, endDate: string): Promise<any> {
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
  public async getBookingsReport(startDate: string, endDate: string): Promise<any> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    const totalBookings = bookings.length;

    // Group by source
    const sourceCounts: Record<string, number> = {};
    // Group by status
    const statusCounts: Record<string, number> = {};

    bookings.forEach((b: any) => {
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
  public async getDashboardMetrics(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Each round-trip to the remote DB costs ~60ms, and the connection pooler
    // adds overhead under concurrency — so doing 7 queries (sequential OR
    // parallel) is slow. Instead we compute every metric in ONE round-trip via
    // a single SQL statement with scalar subqueries.
    const rows = await prisma.$queryRaw<
      Array<{
        total_rooms: bigint;
        occupied_today: bigint;
        check_ins_today: bigint;
        check_outs_today: bigint;
        current_month_revenue: number | null;
        pending_enquiries: bigint;
        unread_notifications: bigint;
      }>
    >`
      SELECT
        (SELECT COUNT(*) FROM rooms WHERE maintenance_status = 'OPERATIONAL') AS total_rooms,
        (SELECT COUNT(*) FROM booking_rooms br
           JOIN bookings b ON b.id = br.booking_id
          WHERE b.booking_status IN ('CONFIRMED','CHECKED_IN')
            AND b.check_in <= ${today} AND b.check_out > ${today}) AS occupied_today,
        (SELECT COUNT(*) FROM bookings
          WHERE booking_status = 'CONFIRMED'
            AND check_in >= ${today} AND check_in < ${tomorrow}) AS check_ins_today,
        (SELECT COUNT(*) FROM bookings
          WHERE booking_status = 'CHECKED_IN'
            AND check_out >= ${today} AND check_out < ${tomorrow}) AS check_outs_today,
        (SELECT COALESCE(SUM(grand_total), 0) FROM bookings
          WHERE booking_status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT')
            AND created_at >= ${currentMonthStart}) AS current_month_revenue,
        (SELECT COUNT(*) FROM contact_enquiries WHERE status = 'PENDING') AS pending_enquiries,
        (SELECT COUNT(*) FROM notifications WHERE read = false) AS unread_notifications
    `;

    const r = rows[0];
    const totalRooms = Number(r.total_rooms);
    const occupiedTodayCount = Number(r.occupied_today);
    const checkInsTodayCount = Number(r.check_ins_today);
    const checkOutsTodayCount = Number(r.check_outs_today);
    const currentMonthRevenue = Number(r.current_month_revenue ?? 0);
    const pendingEnquiriesCount = Number(r.pending_enquiries);
    const unreadNotificationsCount = Number(r.unread_notifications);

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
