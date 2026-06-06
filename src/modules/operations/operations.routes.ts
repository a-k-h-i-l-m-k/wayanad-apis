import { Router } from 'express';
import { OperationsController } from './operations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';

const router = Router();
const controller = new OperationsController();

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// Dining menu
/**
 * @swagger
 * /operations/dining/categories:
 *   get:
 *     summary: Get all dining categories with items
 *     tags: [Dining]
 */
router.get('/dining/categories', controller.getMenuCategories);
/**
 * @swagger
 * /operations/dining/items:
 *   get:
 *     summary: Get all dining items
 *     tags: [Dining]
 */
router.get('/dining/items', controller.getMenuItems);

// Experiences
/**
 * @swagger
 * /operations/experiences:
 *   get:
 *     summary: Get all experiences
 *     tags: [Experiences]
 */
router.get('/experiences', controller.getExperiences);
/**
 * @swagger
 * /operations/experiences/{id}:
 *   get:
 *     summary: Get single experience details
 *     tags: [Experiences]
 */
router.get('/experiences/:id', controller.getExperienceById);
/**
 * @swagger
 * /operations/experiences/book:
 *   post:
 *     summary: Reserve an experience for an existing resort booking
 *     tags: [Experiences]
 */
router.post('/experiences/book', controller.bookExperience);

// Blogs
/**
 * @swagger
 * /operations/blogs:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blogs]
 */
router.get('/blogs', controller.getBlogs);
/**
 * @swagger
 * /operations/blogs/{id}:
 *   get:
 *     summary: Get blog article by ID
 *     tags: [Blogs]
 */
router.get('/blogs/:id', controller.getBlogById);

// Reviews
/**
 * @swagger
 * /operations/reviews:
 *   get:
 *     summary: Get approved/featured reviews
 *     tags: [Reviews]
 */
router.get('/reviews', controller.getReviews);
/**
 * @swagger
 * /operations/reviews:
 *   post:
 *     summary: Submit a review
 *     tags: [Reviews]
 */
router.post('/reviews', controller.createReview);

// Offers
/**
 * @swagger
 * /operations/offers:
 *   get:
 *     summary: List active discount offers
 *     tags: [Offers]
 */
router.get('/offers', controller.getOffers);

// CMS
/**
 * @swagger
 * /operations/cms/sections:
 *   get:
 *     summary: Get CMS page content sections
 *     tags: [CMS]
 */
router.get('/cms/sections', controller.getCmsSections);
/**
 * @swagger
 * /operations/cms/sections/{key}:
 *   get:
 *     summary: Get CMS section by section key
 *     tags: [CMS]
 */
router.get('/cms/sections/:key', controller.getCmsSectionByKey);

// Settings
/**
 * @swagger
 * /operations/settings:
 *   get:
 *     summary: Get resort profile settings
 *     tags: [Settings]
 */
router.get('/settings', controller.getSettings);

// Contact Enquiry Submission
/**
 * @swagger
 * /operations/enquiries:
 *   post:
 *     summary: Submit contact enquiry form
 *     tags: [Enquiries]
 */
router.post('/enquiries', controller.createEnquiry);

// ==========================================
// RESTRICTED STAFF PATHS
// ==========================================
router.use(authMiddleware);

// Dining Write
router.post('/dining/categories', requirePermission('dining:manage'), controller.createMenuCategory);
router.post('/dining/items', requirePermission('dining:manage'), controller.createMenuItem);
router.put('/dining/items/:id', requirePermission('dining:manage'), controller.updateMenuItem);
router.delete('/dining/items/:id', requirePermission('dining:manage'), controller.deleteMenuItem);

// Experiences Write
router.post('/experiences', requirePermission('experiences:manage'), controller.createExperience);
router.put('/experiences/:id', requirePermission('experiences:manage'), controller.updateExperience);
router.delete('/experiences/:id', requirePermission('experiences:manage'), controller.deleteExperience);

// Blogs Write
router.post('/blogs', requirePermission('blogs:manage'), controller.createBlog);
router.put('/blogs/:id', requirePermission('blogs:manage'), controller.updateBlog);
router.delete('/blogs/:id', requirePermission('blogs:manage'), controller.deleteBlog);

// Reviews Moderation
router.patch('/reviews/:id/approve', requirePermission('reviews:manage'), controller.approveReview);
router.patch('/reviews/:id/feature', requirePermission('reviews:manage'), controller.featureReview);

// Offers Write
router.post('/offers', requirePermission('offers:manage'), controller.createOffer);
router.put('/offers/:id', requirePermission('offers:manage'), controller.updateOffer);
router.delete('/offers/:id', requirePermission('offers:manage'), controller.deleteOffer);

// CMS Write
router.put('/cms/sections/:id', requirePermission('cms:manage'), controller.updateCmsSection);

// Settings Write
router.put('/settings', requirePermission('settings:manage'), controller.updateSettings);

// Enquiries Write
router.get('/enquiries', requirePermission('enquiries:manage'), controller.getEnquiries);
router.put('/enquiries/:id', requirePermission('enquiries:manage'), controller.updateEnquiry);

// Notifications
router.get('/notifications', controller.getNotifications);
router.patch('/notifications/:id/read', controller.markNotificationAsRead);

// Audit Logs
router.get('/audit-logs', requirePermission('audit-logs:read'), controller.getAuditLogs);

export default router;
