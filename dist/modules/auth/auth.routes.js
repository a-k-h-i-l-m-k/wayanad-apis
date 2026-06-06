"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in to user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', (0, validation_middleware_1.validate)({ body: auth_validation_1.loginSchema }), controller.login);
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh JWT access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 */
router.post('/refresh-token', (0, validation_middleware_1.validate)({ body: auth_validation_1.refreshTokenSchema }), controller.refreshToken);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 */
router.post('/forgot-password', (0, validation_middleware_1.validate)({ body: auth_validation_1.forgotPasswordSchema }), controller.forgotPassword);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with verification token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 */
router.post('/reset-password', (0, validation_middleware_1.validate)({ body: auth_validation_1.resetPasswordSchema }), controller.resetPassword);
/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change current password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
router.post('/change-password', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)({ body: auth_validation_1.changePasswordSchema }), controller.changePassword);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out user and clear refresh token
 *     tags: [Authentication]
 */
router.post('/logout', controller.logout);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get details of authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', auth_middleware_1.authMiddleware, controller.getMe);
exports.default = router;
