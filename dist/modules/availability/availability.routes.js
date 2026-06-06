"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availability_controller_1 = require("./availability.controller");
const router = (0, express_1.Router)();
const controller = new availability_controller_1.AvailabilityController();
/**
 * @swagger
 * /availability/search:
 *   post:
 *     summary: Search room types available for specified dates
 *     tags: [Availability]
 */
router.post('/search', controller.search);
/**
 * @swagger
 * /availability/check:
 *   post:
 *     summary: Verify specific rooms availability
 *     tags: [Availability]
 */
router.post('/check', controller.check);
exports.default = router;
