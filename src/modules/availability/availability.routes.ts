import { Router } from 'express';
import { AvailabilityController } from './availability.controller';

const router = Router();
const controller = new AvailabilityController();

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

export default router;
