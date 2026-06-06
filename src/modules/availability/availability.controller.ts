import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from '../../services/availability.service';
import { BadRequestError } from '../../utils/errors';

export class AvailabilityController {
  private availabilityService = new AvailabilityService();

  public search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { checkIn, checkOut, adults, children } = req.body;

      if (!checkIn || !checkOut) {
        throw new BadRequestError('checkIn and checkOut dates are required');
      }

      const result = await this.availabilityService.searchAvailability({
        checkIn,
        checkOut,
        adults: Number(adults || 1),
        children: Number(children || 0),
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public check = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomIds, checkIn, checkOut } = req.body;

      if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
        throw new BadRequestError('roomIds array is required');
      }
      if (!checkIn || !checkOut) {
        throw new BadRequestError('checkIn and checkOut dates are required');
      }

      const isAvailable = await this.availabilityService.checkSpecificRoomsAvailability(
        roomIds,
        checkIn,
        checkOut
      );

      res.status(200).json({
        status: 'success',
        data: {
          isAvailable,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
