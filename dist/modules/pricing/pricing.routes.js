"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pricing_controller_1 = require("./pricing.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const pricing_validation_1 = require("./pricing.validation");
const router = (0, express_1.Router)();
const controller = new pricing_controller_1.PricingController();
router.use(auth_middleware_1.authMiddleware);
router.use((0, role_middleware_1.requirePermission)('pricing:manage'));
/**
 * @swagger
 * /pricing/seasonal:
 *   get:
 *     summary: Get all seasonal pricing rates
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/seasonal', controller.getSeasonalRates);
/**
 * @swagger
 * /pricing/seasonal:
 *   post:
 *     summary: Create a seasonal pricing rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.post('/seasonal', (0, validation_middleware_1.validate)({ body: pricing_validation_1.createSeasonalRateSchema }), controller.createSeasonalRate);
/**
 * @swagger
 * /pricing/seasonal/{id}:
 *   put:
 *     summary: Update seasonal rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.put('/seasonal/:id', (0, validation_middleware_1.validate)({ body: pricing_validation_1.updateSeasonalRateSchema }), controller.updateSeasonalRate);
/**
 * @swagger
 * /pricing/seasonal/{id}:
 *   delete:
 *     summary: Delete seasonal rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/seasonal/:id', controller.deleteSeasonalRate);
/**
 * @swagger
 * /pricing/special:
 *   get:
 *     summary: Get all special event pricing rates
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/special', controller.getSpecialRates);
/**
 * @swagger
 * /pricing/special:
 *   post:
 *     summary: Create a special pricing rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.post('/special', (0, validation_middleware_1.validate)({ body: pricing_validation_1.createSpecialRateSchema }), controller.createSpecialRate);
/**
 * @swagger
 * /pricing/special/{id}:
 *   put:
 *     summary: Update special rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.put('/special/:id', (0, validation_middleware_1.validate)({ body: pricing_validation_1.updateSpecialRateSchema }), controller.updateSpecialRate);
/**
 * @swagger
 * /pricing/special/{id}:
 *   delete:
 *     summary: Delete special rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/special/:id', controller.deleteSpecialRate);
exports.default = router;
