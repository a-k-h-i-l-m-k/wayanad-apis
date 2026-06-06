"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const availability_service_1 = require("../../services/availability.service");
const errors_1 = require("../../utils/errors");
class AvailabilityController {
    availabilityService = new availability_service_1.AvailabilityService();
    search = async (req, res, next) => {
        try {
            const { checkIn, checkOut, adults, children } = req.body;
            if (!checkIn || !checkOut) {
                throw new errors_1.BadRequestError('checkIn and checkOut dates are required');
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
        }
        catch (error) {
            next(error);
        }
    };
    check = async (req, res, next) => {
        try {
            const { roomIds, checkIn, checkOut } = req.body;
            if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
                throw new errors_1.BadRequestError('roomIds array is required');
            }
            if (!checkIn || !checkOut) {
                throw new errors_1.BadRequestError('checkIn and checkOut dates are required');
            }
            const isAvailable = await this.availabilityService.checkSpecificRoomsAvailability(roomIds, checkIn, checkOut);
            res.status(200).json({
                status: 'success',
                data: {
                    isAvailable,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AvailabilityController = AvailabilityController;
