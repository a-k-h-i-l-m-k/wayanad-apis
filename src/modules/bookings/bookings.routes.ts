import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  assignRoomSchema,
  checkAvailabilitySchema,
  calculatePriceSchema,
} from './bookings.validation';

const router = Router();
const controller = new BookingsController();

// 1. Public endpoints (Website booking engine integrations)
/**
 * @swagger
 * /bookings/check-availability:
 *   post:
 *     summary: Check room availability for a stay range
 *     tags: [Bookings]
 */
router.post(
  '/check-availability',
  validate({ body: checkAvailabilitySchema }),
  controller.checkAvailability
);

/**
 * @swagger
 * /bookings/calculate-price:
 *   post:
 *     summary: Calculate booking cost breakdown
 *     tags: [Bookings]
 */
router.post(
  '/calculate-price',
  validate({ body: calculatePriceSchema }),
  controller.calculatePrice
);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a booking reservation (Public Website or Walk-in)
 *     tags: [Bookings]
 */
router.post(
  '/',
  validate({ body: createBookingSchema }),
  controller.create
);

// 2. Private staff operations
router.use(authMiddleware);

/**
 * @swagger
 * /bookings/my:
 *   get:
 *     summary: Get current user's own bookings (by email match to guest record)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', controller.getMine);



/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (paginated, filtered, searchable)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  requirePermission('bookings:read'),
  controller.getAll
);

/**
 * @swagger
 * /bookings/calendar:
 *   get:
 *     summary: Get visual room grid status by date range
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/calendar',
  requirePermission('bookings:read'),
  controller.getCalendar
);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get detailed booking profile
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  requirePermission('bookings:read'),
  controller.getById
);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update booking status flags
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requirePermission('bookings:update'),
  validate({ body: updateBookingStatusSchema }),
  controller.update
);

/**
 * @swagger
 * /bookings/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/cancel',
  requirePermission('bookings:update'),
  controller.cancel
);

/**
 * @swagger
 * /bookings/assign-room:
 *   post:
 *     summary: Manually assign physical room
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/assign-room',
  requirePermission('bookings:update'),
  validate({ body: assignRoomSchema }),
  controller.assignRoom
);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete cancelled booking record
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requirePermission('bookings:delete'),
  controller.delete
);

export default router;
