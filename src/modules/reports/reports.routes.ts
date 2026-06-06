import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';

const router = Router();
const controller = new ReportsController();

router.use(authMiddleware);
router.use(requirePermission('reports:read'));

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

export default router;
