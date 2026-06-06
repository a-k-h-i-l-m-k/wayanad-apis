import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../../services/report.service';
import { BadRequestError } from '../../utils/errors';

export class ReportsController {
  private reportService = new ReportService();

  private validateDates(req: Request) {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate query parameters are required (format YYYY-MM-DD)');
    }
    return {
      startStr: String(startDate),
      endStr: String(endDate),
    };
  }

  public getRevenue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startStr, endStr } = this.validateDates(req);
      const data = await this.reportService.getRevenueReport(startStr, endStr);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  public getOccupancy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startStr, endStr } = this.validateDates(req);
      const data = await this.reportService.getOccupancyReport(startStr, endStr);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  public getAdrAndRevpar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startStr, endStr } = this.validateDates(req);
      const data = await this.reportService.getKpisReport(startStr, endStr);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  public getBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startStr, endStr } = this.validateDates(req);
      const data = await this.reportService.getBookingsReport(startStr, endStr);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  public getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.reportService.getDashboardMetrics();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };
}
