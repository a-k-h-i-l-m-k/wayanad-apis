"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../configs/env");
const prisma_1 = require("../configs/prisma");
const errors_1 = require("../utils/errors");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Access token is missing or invalid');
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch (err) {
            throw new errors_1.UnauthorizedError('Token is expired or invalid');
        }
        // Fetch user and permissions from database
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
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
            throw new errors_1.UnauthorizedError('User associated with this token no longer exists');
        }
        if (user.status !== 'ACTIVE') {
            throw new errors_1.UnauthorizedError('This user account is no longer active');
        }
        // Flatten permissions list
        const permissionNames = user.role
            ? user.role.permissions.map((rp) => rp.permission.name)
            : [];
        req.user = {
            id: user.id,
            email: user.email,
            role: {
                id: user.role?.id || '',
                name: user.role?.name || '',
                permissions: permissionNames,
            },
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
