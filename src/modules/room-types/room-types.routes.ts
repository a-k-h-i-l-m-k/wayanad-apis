import { Router } from 'express';
import { RoomTypesController } from './room-types.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { createRoomTypeSchema, updateRoomTypeSchema } from './room-types.validation';

const router = Router();
const controller = new RoomTypesController();

/**
 * @swagger
 * /room-types:
 *   get:
 *     summary: Get all room types
 *     tags: [Room Types]
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /room-types/{id}:
 *   get:
 *     summary: Get details of a single room type
 *     tags: [Room Types]
 */
router.get('/:id', controller.getById);

// Staff write permissions
router.use(authMiddleware);

/**
 * @swagger
 * /room-types:
 *   post:
 *     summary: Create a room type
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requirePermission('rooms:manage'),
  validate({ body: createRoomTypeSchema }),
  controller.create
);

/**
 * @swagger
 * /room-types/{id}:
 *   put:
 *     summary: Update room type properties
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requirePermission('rooms:manage'),
  validate({ body: updateRoomTypeSchema }),
  controller.update
);

/**
 * @swagger
 * /room-types/{id}:
 *   delete:
 *     summary: Delete a room type definition
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requirePermission('rooms:manage'),
  controller.delete
);

export default router;
