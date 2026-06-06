"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rooms_controller_1 = require("./rooms.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const rooms_validation_1 = require("./rooms.validation");
const router = (0, express_1.Router)();
const controller = new rooms_controller_1.RoomsController();
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', (0, role_middleware_1.requirePermission)('rooms:manage'), controller.getAll);
/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get details of a single room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', (0, role_middleware_1.requirePermission)('rooms:manage'), controller.getById);
/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', (0, role_middleware_1.requirePermission)('rooms:manage'), (0, validation_middleware_1.validate)({ body: rooms_validation_1.createRoomSchema }), controller.create);
/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Update room details
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', (0, role_middleware_1.requirePermission)('rooms:manage'), (0, validation_middleware_1.validate)({ body: rooms_validation_1.updateRoomSchema }), controller.update);
/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (0, role_middleware_1.requirePermission)('rooms:manage'), controller.delete);
/**
 * @swagger
 * /rooms/{id}/maintenance:
 *   patch:
 *     summary: Update room maintenance status
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/maintenance', (0, role_middleware_1.requirePermission)('rooms:manage'), controller.updateMaintenance);
exports.default = router;
