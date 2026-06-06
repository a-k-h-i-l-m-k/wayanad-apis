"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
const controller = new reports_controller_1.ReportsController();
router.use(auth_middleware_1.authMiddleware);
router.use((0, role_middleware_1.requirePermission)('reports:read'));
/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     summary: Retrieve revenue aggregates for a time period
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/revenue', controller.getRevenue);
/**
 * @swagger
 * /reports/occupancy:
 *   get:
 *     summary: Retrieve occupancy statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/occupancy', controller.getOccupancy);
/**
 * @swagger
 * /reports/adr:
 *   get:
 *     summary: Get Average Daily Rate (ADR) trends
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/adr', controller.getAdrAndRevpar);
/**
 * @swagger
 * /reports/revpar:
 *   get:
 *     summary: Get Revenue Per Available Room (RevPAR) trends
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/revpar', controller.getAdrAndRevpar);
/**
 * @swagger
 * /reports/bookings:
 *   get:
 *     summary: Get booking volume metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bookings', controller.getBookings);
/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get high-level summary widgets for front-page dashboard
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', controller.getDashboard);
exports.default = router;
