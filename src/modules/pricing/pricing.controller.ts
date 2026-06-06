import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';
import { NotFoundError } from '../../utils/errors';
import { logAudit } from '../../utils/audit';

export class PricingController {
  // --- Seasonal Rates CRUD ---
  public getSeasonalRates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rates = await prisma.seasonalRate.findMany({
        include: { roomType: true },
        orderBy: { startDate: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: rates.map((r: any) => ({
          ...r,
          weekdayPrice: Number(r.weekdayPrice),
          weekendPrice: Number(r.weekendPrice),
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  public createSeasonalRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const rate = await prisma.seasonalRate.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      await logAudit({
        userId: req.user?.id,
        action: 'CREATE_SEASONAL_RATE',
        module: 'PRICING',
        recordId: rate.id,
        newData: rate,
      });

      res.status(201).json({
        status: 'success',
        data: {
          ...rate,
          weekdayPrice: Number(rate.weekdayPrice),
          weekendPrice: Number(rate.weekendPrice),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateSeasonalRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

      const oldRate = await prisma.seasonalRate.findUnique({ where: { id } });
      if (!oldRate) throw new NotFoundError('Seasonal Rate record not found');

      const rate = await prisma.seasonalRate.update({
        where: { id },
        data: updateData,
      });

      await logAudit({
        userId: req.user?.id,
        action: 'UPDATE_SEASONAL_RATE',
        module: 'PRICING',
        recordId: id,
        oldData: oldRate,
        newData: rate,
      });

      res.status(200).json({
        status: 'success',
        data: {
          ...rate,
          weekdayPrice: Number(rate.weekdayPrice),
          weekendPrice: Number(rate.weekendPrice),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteSeasonalRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const rate = await prisma.seasonalRate.findUnique({ where: { id } });
      if (!rate) throw new NotFoundError('Seasonal Rate record not found');

      await prisma.seasonalRate.delete({ where: { id } });

      await logAudit({
        userId: req.user?.id,
        action: 'DELETE_SEASONAL_RATE',
        module: 'PRICING',
        recordId: id,
        oldData: rate,
      });

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Special Rates CRUD ---
  public getSpecialRates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rates = await prisma.specialRate.findMany({
        include: { roomType: true },
        orderBy: { date: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: rates.map((r: any) => ({
          ...r,
          price: Number(r.price),
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  public createSpecialRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const rate = await prisma.specialRate.create({
        data: {
          ...data,
          date: new Date(data.date),
        },
      });

      await logAudit({
        userId: req.user?.id,
        action: 'CREATE_SPECIAL_RATE',
        module: 'PRICING',
        recordId: rate.id,
        newData: rate,
      });

      res.status(201).json({
        status: 'success',
        data: {
          ...rate,
          price: Number(rate.price),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateSpecialRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.date) updateData.date = new Date(updateData.date);

      const oldRate = await prisma.specialRate.findUnique({ where: { id } });
      if (!oldRate) throw new NotFoundError('Special Rate record not found');

      const rate = await prisma.specialRate.update({
        where: { id },
        data: updateData,
      });

      await logAudit({
        userId: req.user?.id,
        action: 'UPDATE_SPECIAL_RATE',
        module: 'PRICING',
        recordId: id,
        oldData: oldRate,
        newData: rate,
      });

      res.status(200).json({
        status: 'success',
        data: {
          ...rate,
          price: Number(rate.price),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteSpecialRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const rate = await prisma.specialRate.findUnique({ where: { id } });
      if (!rate) throw new NotFoundError('Special Rate record not found');

      await prisma.specialRate.delete({ where: { id } });

      await logAudit({
        userId: req.user?.id,
        action: 'DELETE_SPECIAL_RATE',
        module: 'PRICING',
        recordId: id,
        oldData: rate,
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
