import { Router } from 'express';
import { GuestsController } from './guests.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { createGuestSchema, updateGuestSchema } from './guests.validation';

const router = Router();
const controller = new GuestsController();

router.use(authMiddleware);

/**
 * @swagger
 * /guests:
 *   get:
 *     summary: Get all guests
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  requirePermission('guests:manage'),
  controller.getAll
);

/**
 * @swagger
 * /guests/{id}:
 *   get:
 *     summary: Get guest details by ID
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  requirePermission('guests:manage'),
  controller.getById
);

/**
 * @swagger
 * /guests:
 *   post:
 *     summary: Create a new guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requirePermission('guests:manage'),
  validate({ body: createGuestSchema }),
  controller.create
);

/**
 * @swagger
 * /guests/{id}:
 *   put:
 *     summary: Update guest details
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requirePermission('guests:manage'),
  validate({ body: updateGuestSchema }),
  controller.update
);

/**
 * @swagger
 * /guests/{id}:
 *   delete:
 *     summary: Delete a guest profile
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requirePermission('guests:manage'),
  controller.delete
);

export default router;
