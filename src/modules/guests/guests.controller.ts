import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';
import { parseQueryParams, formatPaginatedResponse } from '../../utils/query';
import { NotFoundError } from '../../utils/errors';

export class GuestsController {
  private generateGuestCode(): string {
    return `GUEST-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['nationality']);
      
      const where: any = { ...parsed.filters };

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
        prisma.guest.findMany({
          where,
          skip: parsed.skip,
          take: parsed.limit,
          orderBy: { [parsed.sortBy]: parsed.sortOrder },
        }),
        prisma.guest.count({ where }),
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
      const guest = await prisma.guest.findUnique({
        where: { id },
        include: {
          bookings: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!guest) {
        throw new NotFoundError('Guest not found');
      }

      res.status(200).json({
        status: 'success',
        data: guest,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const guestData = req.body;
      
      // Auto-generate guestCode if not provided
      const guestCode = this.generateGuestCode();

      const guest = await prisma.guest.create({
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
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      const guest = await prisma.guest.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        status: 'success',
        data: guest,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if guest has bookings
      const bookingCount = await prisma.booking.count({
        where: { guestId: id },
      });

      if (bookingCount > 0) {
        res.status(400).json({
          status: 'fail',
          message: 'Cannot delete guest with active booking history. Archive or deactivate instead.',
        });
        return;
      }

      await prisma.guest.delete({
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
