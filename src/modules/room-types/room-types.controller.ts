import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';
import { NotFoundError } from '../../utils/errors';

export class RoomTypesController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Return all room types (typically needed by both public web booking engine and admin panel)
      const roomTypes = await prisma.roomType.findMany({
        include: {
          rooms: true,
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: roomTypes.map((rt: any) => ({
          ...rt,
          basePrice: Number(rt.basePrice),
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const roomType = await prisma.roomType.findUnique({
        where: { id },
        include: {
          rooms: true,
          seasonalRates: true,
          specialRates: true,
        },
      });

      if (!roomType) {
        throw new NotFoundError('Room Type not found');
      }

      res.status(200).json({
        status: 'success',
        data: {
          ...roomType,
          basePrice: Number(roomType.basePrice),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roomTypeData = req.body;
      const roomType = await prisma.roomType.create({
        data: roomTypeData,
      });

      res.status(201).json({
        status: 'success',
        data: {
          ...roomType,
          basePrice: Number(roomType.basePrice),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const roomType = await prisma.roomType.update({
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
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if room type has any rooms associated
      const roomCount = await prisma.room.count({
        where: { roomTypeId: id },
      });

      if (roomCount > 0) {
        res.status(400).json({
          status: 'fail',
          message: 'Cannot delete a room type with active rooms. Please delete or migrate the rooms first.',
        });
        return;
      }

      await prisma.roomType.delete({
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
}
