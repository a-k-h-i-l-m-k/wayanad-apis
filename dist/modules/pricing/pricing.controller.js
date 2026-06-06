"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const prisma_1 = require("../../configs/prisma");
const errors_1 = require("../../utils/errors");
const audit_1 = require("../../utils/audit");
class PricingController {
    // --- Seasonal Rates CRUD ---
    getSeasonalRates = async (req, res, next) => {
        try {
            const rates = await prisma_1.prisma.seasonalRate.findMany({
                include: { roomType: true },
                orderBy: { startDate: 'asc' },
            });
            res.status(200).json({
                status: 'success',
                data: rates.map((r) => ({
                    ...r,
                    weekdayPrice: Number(r.weekdayPrice),
                    weekendPrice: Number(r.weekendPrice),
                })),
            });
        }
        catch (error) {
            next(error);
        }
    };
    createSeasonalRate = async (req, res, next) => {
        try {
            const data = req.body;
            const rate = await prisma_1.prisma.seasonalRate.create({
                data: {
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                },
            });
            await (0, audit_1.logAudit)({
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
        }
        catch (error) {
            next(error);
        }
    };
    updateSeasonalRate = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (updateData.startDate)
                updateData.startDate = new Date(updateData.startDate);
            if (updateData.endDate)
                updateData.endDate = new Date(updateData.endDate);
            const oldRate = await prisma_1.prisma.seasonalRate.findUnique({ where: { id } });
            if (!oldRate)
                throw new errors_1.NotFoundError('Seasonal Rate record not found');
            const rate = await prisma_1.prisma.seasonalRate.update({
                where: { id },
                data: updateData,
            });
            await (0, audit_1.logAudit)({
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
        }
        catch (error) {
            next(error);
        }
    };
    deleteSeasonalRate = async (req, res, next) => {
        try {
            const { id } = req.params;
            const rate = await prisma_1.prisma.seasonalRate.findUnique({ where: { id } });
            if (!rate)
                throw new errors_1.NotFoundError('Seasonal Rate record not found');
            await prisma_1.prisma.seasonalRate.delete({ where: { id } });
            await (0, audit_1.logAudit)({
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
        }
        catch (error) {
            next(error);
        }
    };
    // --- Special Rates CRUD ---
    getSpecialRates = async (req, res, next) => {
        try {
            const rates = await prisma_1.prisma.specialRate.findMany({
                include: { roomType: true },
                orderBy: { date: 'asc' },
            });
            res.status(200).json({
                status: 'success',
                data: rates.map((r) => ({
                    ...r,
                    price: Number(r.price),
                })),
            });
        }
        catch (error) {
            next(error);
        }
    };
    createSpecialRate = async (req, res, next) => {
        try {
            const data = req.body;
            const rate = await prisma_1.prisma.specialRate.create({
                data: {
                    ...data,
                    date: new Date(data.date),
                },
            });
            await (0, audit_1.logAudit)({
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
        }
        catch (error) {
            next(error);
        }
    };
    updateSpecialRate = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (updateData.date)
                updateData.date = new Date(updateData.date);
            const oldRate = await prisma_1.prisma.specialRate.findUnique({ where: { id } });
            if (!oldRate)
                throw new errors_1.NotFoundError('Special Rate record not found');
            const rate = await prisma_1.prisma.specialRate.update({
                where: { id },
                data: updateData,
            });
            await (0, audit_1.logAudit)({
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
        }
        catch (error) {
            next(error);
        }
    };
    deleteSpecialRate = async (req, res, next) => {
        try {
            const { id } = req.params;
            const rate = await prisma_1.prisma.specialRate.findUnique({ where: { id } });
            if (!rate)
                throw new errors_1.NotFoundError('Special Rate record not found');
            await prisma_1.prisma.specialRate.delete({ where: { id } });
            await (0, audit_1.logAudit)({
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
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PricingController = PricingController;
