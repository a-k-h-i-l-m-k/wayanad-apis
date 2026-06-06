"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const room_types_controller_1 = require("./room-types.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const room_types_validation_1 = require("./room-types.validation");
const router = (0, express_1.Router)();
const controller = new room_types_controller_1.RoomTypesController();
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
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /room-types:
 *   post:
 *     summary: Create a room type
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', (0, role_middleware_1.requirePermission)('rooms:manage'), (0, validation_middleware_1.validate)({ body: room_types_validation_1.createRoomTypeSchema }), controller.create);
/**
 * @swagger
 * /room-types/{id}:
 *   put:
 *     summary: Update room type properties
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', (0, role_middleware_1.requirePermission)('rooms:manage'), (0, validation_middleware_1.validate)({ body: room_types_validation_1.updateRoomTypeSchema }), controller.update);
/**
 * @swagger
 * /room-types/{id}:
 *   delete:
 *     summary: Delete a room type definition
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (0, role_middleware_1.requirePermission)('rooms:manage'), controller.delete);
exports.default = router;
