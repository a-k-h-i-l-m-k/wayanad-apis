import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';
import { parseQueryParams, formatPaginatedResponse } from '../../utils/query';
import { NotFoundError } from '../../utils/errors';

export class RoomsController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['roomTypeId', 'status', 'maintenanceStatus']);
      
      const where: any = { ...parsed.filters };

      if (parsed.search) {
        where.OR = [
          { roomNumber: { contains: parsed.search, mode: 'insensitive' } },
          { floor: { contains: parsed.search, mode: 'insensitive' } },
          { remarks: { contains: parsed.search, mode: 'insensitive' } },
        ];
      }

      // The Room model has no `createdAt` column (the default sort field), so map
      // any unknown sort key to a column that actually exists on Room.
      const sortableRoomFields = ['roomNumber', 'floor', 'status', 'maintenanceStatus'];
      const sortBy = sortableRoomFields.includes(parsed.sortBy) ? parsed.sortBy : 'roomNumber';

      const [items, total] = await Promise.all([
        prisma.room.findMany({
          where,
          include: {
            roomType: true,
          },
          skip: parsed.skip,
          take: parsed.limit,
          orderBy: { [sortBy]: parsed.sortOrder },
        }),
        prisma.room.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: formatPaginatedResponse(items, total, parsed),
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const room = await prisma.room.findUnique({
        where: { id },
        include: {
          roomType: true,
        },
      });

      if (!room) {
        throw new NotFoundError('Room not found');
      }

      res.status(200).json({
        status: 'success',
        data: room,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roomData = req.body;
      const room = await prisma.room.create({
        data: roomData,
        include: {
          roomType: true,
        },
      });

      res.status(201).json({
        status: 'success',
        data: room,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const room = await prisma.room.update({
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
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if room has active bookings allocated
      const activeBookingRooms = await prisma.bookingRoom.count({
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

      await prisma.room.delete({
        where: { id },
      });

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { maintenanceStatus, remarks } = req.body;

      const room = await prisma.room.update({
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
    } catch (error) {
      next(error);
    }
  };
}
