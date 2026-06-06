"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const operations_controller_1 = require("./operations.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
const controller = new operations_controller_1.OperationsController();
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
router.use(auth_middleware_1.authMiddleware);
// Dining Write
router.post('/dining/categories', (0, role_middleware_1.requirePermission)('dining:manage'), controller.createMenuCategory);
router.post('/dining/items', (0, role_middleware_1.requirePermission)('dining:manage'), controller.createMenuItem);
router.put('/dining/items/:id', (0, role_middleware_1.requirePermission)('dining:manage'), controller.updateMenuItem);
router.delete('/dining/items/:id', (0, role_middleware_1.requirePermission)('dining:manage'), controller.deleteMenuItem);
// Experiences Write
router.post('/experiences', (0, role_middleware_1.requirePermission)('experiences:manage'), controller.createExperience);
router.put('/experiences/:id', (0, role_middleware_1.requirePermission)('experiences:manage'), controller.updateExperience);
router.delete('/experiences/:id', (0, role_middleware_1.requirePermission)('experiences:manage'), controller.deleteExperience);
// Blogs Write
router.post('/blogs', (0, role_middleware_1.requirePermission)('blogs:manage'), controller.createBlog);
router.put('/blogs/:id', (0, role_middleware_1.requirePermission)('blogs:manage'), controller.updateBlog);
router.delete('/blogs/:id', (0, role_middleware_1.requirePermission)('blogs:manage'), controller.deleteBlog);
// Reviews Moderation
router.patch('/reviews/:id/approve', (0, role_middleware_1.requirePermission)('reviews:manage'), controller.approveReview);
router.patch('/reviews/:id/feature', (0, role_middleware_1.requirePermission)('reviews:manage'), controller.featureReview);
// Offers Write
router.post('/offers', (0, role_middleware_1.requirePermission)('offers:manage'), controller.createOffer);
router.put('/offers/:id', (0, role_middleware_1.requirePermission)('offers:manage'), controller.updateOffer);
router.delete('/offers/:id', (0, role_middleware_1.requirePermission)('offers:manage'), controller.deleteOffer);
// CMS Write
router.put('/cms/sections/:id', (0, role_middleware_1.requirePermission)('cms:manage'), controller.updateCmsSection);
// Settings Write
router.put('/settings', (0, role_middleware_1.requirePermission)('settings:manage'), controller.updateSettings);
// Enquiries Write
router.get('/enquiries', (0, role_middleware_1.requirePermission)('enquiries:manage'), controller.getEnquiries);
router.put('/enquiries/:id', (0, role_middleware_1.requirePermission)('enquiries:manage'), controller.updateEnquiry);
// Notifications
router.get('/notifications', controller.getNotifications);
router.patch('/notifications/:id/read', controller.markNotificationAsRead);
// Audit Logs
router.get('/audit-logs', (0, role_middleware_1.requirePermission)('audit-logs:read'), controller.getAuditLogs);
exports.default = router;
