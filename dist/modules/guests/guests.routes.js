"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const guests_controller_1 = require("./guests.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const guests_validation_1 = require("./guests.validation");
const router = (0, express_1.Router)();
const controller = new guests_controller_1.GuestsController();
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /guests:
 *   get:
 *     summary: Get all guests
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', (0, role_middleware_1.requirePermission)('guests:manage'), controller.getAll);
/**
 * @swagger
 * /guests/{id}:
 *   get:
 *     summary: Get guest details by ID
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', (0, role_middleware_1.requirePermission)('guests:manage'), controller.getById);
/**
 * @swagger
 * /guests:
 *   post:
 *     summary: Create a new guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', (0, role_middleware_1.requirePermission)('guests:manage'), (0, validation_middleware_1.validate)({ body: guests_validation_1.createGuestSchema }), controller.create);
/**
 * @swagger
 * /guests/{id}:
 *   put:
 *     summary: Update guest details
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', (0, role_middleware_1.requirePermission)('guests:manage'), (0, validation_middleware_1.validate)({ body: guests_validation_1.updateGuestSchema }), controller.update);
/**
 * @swagger
 * /guests/{id}:
 *   delete:
 *     summary: Delete a guest profile
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (0, role_middleware_1.requirePermission)('guests:manage'), controller.delete);
exports.default = router;
