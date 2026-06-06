import { Router } from 'express';
import { RoomsController } from './rooms.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { createRoomSchema, updateRoomSchema } from './rooms.validation';

const router = Router();
const controller = new RoomsController();

router.use(authMiddleware);

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requirePermission('rooms:manage'), controller.getAll);

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get details of a single room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requirePermission('rooms:manage'), controller.getById);

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requirePermission('rooms:manage'),
  validate({ body: createRoomSchema }),
  controller.create
);

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Update room details
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requirePermission('rooms:manage'),
  validate({ body: updateRoomSchema }),
  controller.update
);

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requirePermission('rooms:manage'), controller.delete);

/**
 * @swagger
 * /rooms/{id}/maintenance:
 *   patch:
 *     summary: Update room maintenance status
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/maintenance',
  requirePermission('rooms:manage'),
  controller.updateMaintenance
);

export default router;
