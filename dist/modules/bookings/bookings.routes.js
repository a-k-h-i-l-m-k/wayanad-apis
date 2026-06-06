"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookings_controller_1 = require("./bookings.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const bookings_validation_1 = require("./bookings.validation");
const router = (0, express_1.Router)();
const controller = new bookings_controller_1.BookingsController();
// 1. Public endpoints (Website booking engine integrations)
/**
 * @swagger
 * /bookings/check-availability:
 *   post:
 *     summary: Check room availability for a stay range
 *     tags: [Bookings]
 */
router.post('/check-availability', (0, validation_middleware_1.validate)({ body: bookings_validation_1.checkAvailabilitySchema }), controller.checkAvailability);
/**
 * @swagger
 * /bookings/calculate-price:
 *   post:
 *     summary: Calculate booking cost breakdown
 *     tags: [Bookings]
 */
router.post('/calculate-price', (0, validation_middleware_1.validate)({ body: bookings_validation_1.calculatePriceSchema }), controller.calculatePrice);
/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a booking reservation (Public Website or Walk-in)
 *     tags: [Bookings]
 */
router.post('/', (0, validation_middleware_1.validate)({ body: bookings_validation_1.createBookingSchema }), controller.create);
// 2. Private staff operations
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (paginated, filtered, searchable)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', (0, role_middleware_1.requirePermission)('bookings:read'), controller.getAll);
/**
 * @swagger
 * /bookings/calendar:
 *   get:
 *     summary: Get visual room grid status by date range
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/calendar', (0, role_middleware_1.requirePermission)('bookings:read'), controller.getCalendar);
/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get detailed booking profile
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', (0, role_middleware_1.requirePermission)('bookings:read'), controller.getById);
/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update booking status flags
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', (0, role_middleware_1.requirePermission)('bookings:update'), (0, validation_middleware_1.validate)({ body: bookings_validation_1.updateBookingStatusSchema }), controller.update);
/**
 * @swagger
 * /bookings/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/cancel', (0, role_middleware_1.requirePermission)('bookings:update'), controller.cancel);
/**
 * @swagger
 * /bookings/assign-room:
 *   post:
 *     summary: Manually assign physical room
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/assign-room', (0, role_middleware_1.requirePermission)('bookings:update'), (0, validation_middleware_1.validate)({ body: bookings_validation_1.assignRoomSchema }), controller.assignRoom);
/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete cancelled booking record
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (0, role_middleware_1.requirePermission)('bookings:delete'), controller.delete);
exports.default = router;
