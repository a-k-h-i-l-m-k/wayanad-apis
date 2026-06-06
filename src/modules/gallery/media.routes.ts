import { Router } from 'express';
import multer from 'multer';
import { MediaController } from './media.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';

const router = Router();
const controller = new MediaController();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size
  },
});

// GET /media is open to public websites (for gallery rendering)
/**
 * @swagger
 * /media:
 *   get:
 *     summary: Retrieve media assets list
 *     tags: [Media]
 */
router.get('/', controller.getAll);

// Write actions require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /media/upload:
 *   post:
 *     summary: Upload file to storage
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/upload',
  requirePermission('gallery:manage'),
  upload.single('file'),
  controller.upload
);

/**
 * @swagger
 * /media/{id}:
 *   delete:
 *     summary: Delete a media asset
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requirePermission('gallery:manage'),
  controller.delete
);

export default router;
