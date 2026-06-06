"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const media_controller_1 = require("./media.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
const controller = new media_controller_1.MediaController();
// Configure multer memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /media/upload:
 *   post:
 *     summary: Upload file to storage
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.post('/upload', (0, role_middleware_1.requirePermission)('gallery:manage'), upload.single('file'), controller.upload);
/**
 * @swagger
 * /media/{id}:
 *   delete:
 *     summary: Delete a media asset
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (0, role_middleware_1.requirePermission)('gallery:manage'), controller.delete);
exports.default = router;
