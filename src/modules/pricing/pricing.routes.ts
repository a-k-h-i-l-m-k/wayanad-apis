import { Router } from 'express';
import { PricingController } from './pricing.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import {
  createSeasonalRateSchema,
  updateSeasonalRateSchema,
  createSpecialRateSchema,
  updateSpecialRateSchema,
} from './pricing.validation';

const router = Router();
const controller = new PricingController();

router.use(authMiddleware);
router.use(requirePermission('pricing:manage'));

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
router.post('/seasonal', validate({ body: createSeasonalRateSchema }), controller.createSeasonalRate);

/**
 * @swagger
 * /pricing/seasonal/{id}:
 *   put:
 *     summary: Update seasonal rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.put('/seasonal/:id', validate({ body: updateSeasonalRateSchema }), controller.updateSeasonalRate);

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
router.post('/special', validate({ body: createSpecialRateSchema }), controller.createSpecialRate);

/**
 * @swagger
 * /pricing/special/{id}:
 *   put:
 *     summary: Update special rate
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 */
router.put('/special/:id', validate({ body: updateSpecialRateSchema }), controller.updateSpecialRate);

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

export default router;
