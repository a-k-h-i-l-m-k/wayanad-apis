import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../../services/booking.service';
import { AvailabilityService } from '../../services/availability.service';
import { PricingService } from '../../services/pricing.service';
import { prisma } from '../../configs/prisma';
import { parseQueryParams, formatPaginatedResponse } from '../../utils/query';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { logAudit } from '../../utils/audit';

export class BookingsController {
  private bookingService = new BookingService();
  private availabilityService = new AvailabilityService();
  private pricingService = new PricingService();

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actingUserId = req.user?.id;
      const result = await this.bookingService.createBooking(req.body, actingUserId);
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['bookingStatus', 'paymentStatus', 'bookingSource']);
      
      const where: any = { ...parsed.filters };

      // Optional Date range filter
      if (req.query.checkInFrom || req.query.checkInTo) {
        where.checkIn = {};
        if (req.query.checkInFrom) {
          where.checkIn.gte = new Date(req.query.checkInFrom as string);
        }
        if (req.query.checkInTo) {
          where.checkIn.lte = new Date(req.query.checkInTo as string);
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
        prisma.booking.findMany({
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
        prisma.booking.count({ where }),
      ]);

      // Format decimals
      const formattedItems = items.map((b: any) => ({
        ...b,
        totalAmount: Number(b.totalAmount),
        taxAmount: Number(b.taxAmount),
        discountAmount: Number(b.discountAmount),
        grandTotal: Number(b.grandTotal),
      }));

      res.status(200).json({
        status: 'success',
        data: formatPaginatedResponse(formattedItems, total, parsed),
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
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
        bookingRooms: booking.bookingRooms.map((br: any) => ({
          ...br,
          roomRate: Number(br.roomRate),
        })),
        payments: booking.payments.map((p: any) => ({
          ...p,
          amount: Number(p.amount),
        })),
      };

      res.status(200).json({
        status: 'success',
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { bookingStatus, paymentStatus } = req.body;
      const actingUserId = req.user?.id;

      const oldBooking = await prisma.booking.findUnique({ where: { id } });
      if (!oldBooking) throw new NotFoundError('Booking not found');

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          bookingStatus,
          paymentStatus,
        },
      });

      await logAudit({
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
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const actingUserId = req.user?.id;

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) throw new NotFoundError('Booking not found');

      // Restrict delete if it's not cancelled
      if (booking.bookingStatus !== 'CANCELLED') {
        throw new BadRequestError('Only cancelled bookings can be permanently deleted');
      }

      await prisma.$transaction(async (tx: any) => {
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

      await logAudit({
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
    } catch (error) {
      next(error);
    }
  };

  public cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId, reason } = req.body;
      const actingUserId = req.user?.id;
      
      const result = await this.bookingService.cancelBooking(bookingId, reason, actingUserId);

      res.status(200).json({
        status: 'success',
        message: 'Booking successfully cancelled.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public checkAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.availabilityService.searchAvailability(req.body);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public calculatePrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.pricingService.calculatePrice(req.body);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public assignRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingRoomId, roomId } = req.body;
      const actingUserId = req.user?.id;
      const result = await this.bookingService.assignRoom(bookingRoomId, roomId, actingUserId);

      res.status(200).json({
        status: 'success',
        message: 'Physical room allocated successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError('startDate and endDate query parameters are required');
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError('Invalid date format');
      }

      // Fetch bookings intersecting the calendar month range
      const bookings = await prisma.booking.findMany({
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

      const formatted = bookings.map((b: any) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        guestName: `${b.guest.firstName} ${b.guest.lastName}`,
        checkIn: b.checkIn.toISOString().split('T')[0],
        checkOut: b.checkOut.toISOString().split('T')[0],
        status: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        rooms: b.bookingRooms.map((br: any) => ({
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
    } catch (error) {
      next(error);
    }
  };
}
