import { Router } from 'express';
import { UsersController } from './users.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { createUserSchema, updateUserSchema, updateProfileSchema } from './users.validation';

const router = Router();
const controller = new UsersController();

router.use(authMiddleware);

// Self profile update
/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update profile of currently logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', validate({ body: updateProfileSchema }), controller.updateProfile);

// Staff management (requires specific permissions)
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all staff users (paginated, filtered)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requirePermission('users:read'), controller.getAll);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get staff user profile by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requirePermission('users:read'), controller.getById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create new staff user and assign role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requirePermission('users:create'), validate({ body: createUserSchema }), controller.create);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update staff user properties
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requirePermission('users:update'), validate({ body: updateUserSchema }), controller.update);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete staff user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requirePermission('users:delete'), controller.delete);

export default router;
