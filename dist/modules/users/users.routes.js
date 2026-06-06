"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const users_validation_1 = require("./users.validation");
const router = (0, express_1.Router)();
const controller = new users_controller_1.UsersController();
router.use(auth_middleware_1.authMiddleware);
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
router.put('/profile', (0, validation_middleware_1.validate)({ body: users_validation_1.updateProfileSchema }), controller.updateProfile);
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
router.get('/', (0, role_middleware_1.requirePermission)('users:read'), controller.getAll);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get staff user profile by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', (0, role_middleware_1.requirePermission)('users:read'), controller.getById);
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create new staff user and assign role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', (0, role_middleware_1.requirePermission)('users:create'), (0, validation_middleware_1.validate)({ body: users_validation_1.createUserSchema }), controller.create);
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update staff user properties
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', (0, role_middleware_1.requirePermission)('users:update'), (0, validation_middleware_1.validate)({ body: users_validation_1.updateUserSchema }), controller.update);
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete staff user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (0, role_middleware_1.requirePermission)('users:delete'), controller.delete);
exports.default = router;
