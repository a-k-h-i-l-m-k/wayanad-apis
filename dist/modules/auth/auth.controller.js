"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../../services/auth.service");
const prisma_1 = require("../../configs/prisma");
const errors_1 = require("../../utils/errors");
class AuthController {
    authService = new auth_service_1.AuthService();
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            // Set secure HTTP-only cookie for refresh token if desired
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const result = await this.authService.refreshToken(refreshToken);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    forgotPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            const result = await this.authService.forgotPassword(email);
            res.status(200).json({
                status: 'success',
                message: 'Password reset token generated (simulating email send).',
                data: result, // In production, don't return this; email it
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const { token, password } = req.body;
            await this.authService.resetPassword(token, password);
            res.status(200).json({
                status: 'success',
                message: 'Password has been reset successfully.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    changePassword = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            await this.authService.changePassword(userId, currentPassword, newPassword);
            res.status(200).json({
                status: 'success',
                message: 'Password changed successfully.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            res.clearCookie('refreshToken');
            res.status(200).json({
                status: 'success',
                message: 'Successfully logged out.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    getMe = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            // Flatten permissions
            const permissions = user.role?.permissions.map((rp) => rp.permission.name) || [];
            res.status(200).json({
                status: 'success',
                data: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    status: user.status,
                    role: {
                        id: user.role?.id,
                        name: user.role?.name,
                        permissions,
                    },
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
