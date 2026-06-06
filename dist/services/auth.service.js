"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../configs/prisma");
const env_1 = require("../configs/env");
const errors_1 = require("../utils/errors");
class AuthService {
    /**
     * Login user and generate JWT tokens
     */
    async login(email, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        if (user.status !== 'ACTIVE') {
            throw new errors_1.UnauthorizedError('Your account has been deactivated');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Generate JWT access & refresh tokens
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role?.name || '' }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN });
        // Update last login
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        return {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role?.name || '',
            },
            accessToken,
            refreshToken,
        };
    }
    /**
     * Refresh the access token using a valid refresh token
     */
    async refreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                include: { role: true },
            });
            if (!user || user.status !== 'ACTIVE') {
                throw new errors_1.UnauthorizedError('User account is invalid or suspended');
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role?.name || '' }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
            return { accessToken };
        }
        catch (error) {
            throw new errors_1.UnauthorizedError('Refresh token is expired or invalid');
        }
    }
    /**
     * Initiates forgot-password by sending a signed stateless recovery token
     */
    async forgotPassword(email) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errors_1.NotFoundError('No account with that email address exists');
        }
        // Generate brief reset token (15 mins validity)
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, purpose: 'reset-password' }, env_1.env.JWT_SECRET, { expiresIn: '15m' });
        // In a real application, you would email this link.
        // E.g. mailService.sendResetEmail(user.email, resetToken);
        return { resetToken };
    }
    /**
     * Resets password using a validated recovery token
     */
    async resetPassword(token, newPassword) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            if (decoded.purpose !== 'reset-password') {
                throw new errors_1.BadRequestError('Invalid reset token purpose');
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash },
            });
        }
        catch (error) {
            throw new errors_1.BadRequestError('Password reset token is invalid or has expired');
        }
    }
    /**
     * Changes password for an already logged-in user
     */
    async changePassword(userId, currentPass, newPass) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const isMatch = await bcryptjs_1.default.compare(currentPass, user.passwordHash);
        if (!isMatch) {
            throw new errors_1.BadRequestError('Current password is incorrect');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPass, 10);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }
}
exports.AuthService = AuthService;
