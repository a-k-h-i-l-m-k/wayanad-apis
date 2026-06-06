"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const report_service_1 = require("../../services/report.service");
const errors_1 = require("../../utils/errors");
class ReportsController {
    reportService = new report_service_1.ReportService();
    validateDates(req) {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            throw new errors_1.BadRequestError('startDate and endDate query parameters are required (format YYYY-MM-DD)');
        }
        return {
            startStr: String(startDate),
            endStr: String(endDate),
        };
    }
    getRevenue = async (req, res, next) => {
        try {
            const { startStr, endStr } = this.validateDates(req);
            const data = await this.reportService.getRevenueReport(startStr, endStr);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    getOccupancy = async (req, res, next) => {
        try {
            const { startStr, endStr } = this.validateDates(req);
            const data = await this.reportService.getOccupancyReport(startStr, endStr);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    getAdrAndRevpar = async (req, res, next) => {
        try {
            const { startStr, endStr } = this.validateDates(req);
            const data = await this.reportService.getKpisReport(startStr, endStr);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    getBookings = async (req, res, next) => {
        try {
            const { startStr, endStr } = this.validateDates(req);
            const data = await this.reportService.getBookingsReport(startStr, endStr);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    getDashboard = async (req, res, next) => {
        try {
            const data = await this.reportService.getDashboardMetrics();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ReportsController = ReportsController;
