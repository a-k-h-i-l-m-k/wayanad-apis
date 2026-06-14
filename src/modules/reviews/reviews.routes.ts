import { Router } from 'express';
import { ReviewsController } from './reviews.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ReviewsController();

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: List approved reviews (public). Admins can pass ?all=true to see all.
 *     tags: [Reviews]
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /reviews/my:
 *   get:
 *     summary: Get the authenticated user's own reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', authMiddleware, controller.getMine);

/**
 * @swagger
 * /reviews/bookings-for-review:
 *   get:
 *     summary: Get checked-out bookings that don't yet have a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bookings-for-review', authMiddleware, controller.getBookingsForReview);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Submit a new review (must be authenticated)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authMiddleware, controller.create);

/**
 * @swagger
 * /reviews/{id}:
 *   patch:
 *     summary: Update a review (owner can edit text; admin can approve/feature)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authMiddleware, controller.update);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review (admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authMiddleware, controller.delete);

export default router;
