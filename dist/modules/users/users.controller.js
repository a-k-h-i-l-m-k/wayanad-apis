"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../configs/prisma");
const query_1 = require("../../utils/query");
const errors_1 = require("../../utils/errors");
const audit_1 = require("../../utils/audit");
class UsersController {
    getAll = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['roleId', 'status']);
            const where = { ...parsed.filters };
            if (parsed.search) {
                where.OR = [
                    { firstName: { contains: parsed.search, mode: 'insensitive' } },
                    { lastName: { contains: parsed.search, mode: 'insensitive' } },
                    { email: { contains: parsed.search, mode: 'insensitive' } },
                ];
            }
            const [items, total] = await Promise.all([
                prisma_1.prisma.user.findMany({
                    where,
                    include: {
                        role: true,
                    },
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { [parsed.sortBy]: parsed.sortOrder },
                }),
                prisma_1.prisma.user.count({ where }),
            ]);
            const formatted = items.map((u) => {
                const { passwordHash, ...rest } = u;
                return rest;
            });
            res.status(200).json({
                status: 'success',
                data: (0, query_1.formatPaginatedResponse)(formatted, total, parsed),
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const user = await prisma_1.prisma.user.findUnique({
                where: { id },
                include: { role: true },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            const { passwordHash, ...rest } = user;
            res.status(200).json({
                status: 'success',
                data: rest,
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const { password, ...userData } = req.body;
            const actingUserId = req.user?.id;
            // Check if user email already exists
            const existing = await prisma_1.prisma.user.findUnique({
                where: { email: userData.email },
            });
            if (existing) {
                throw new errors_1.BadRequestError('Email address is already in use');
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const user = await prisma_1.prisma.$transaction(async (tx) => {
                const dbUser = await tx.user.create({
                    data: {
                        ...userData,
                        passwordHash,
                    },
                    include: { role: true },
                });
                // Insert into join table user_roles
                await tx.userRole.create({
                    data: {
                        userId: dbUser.id,
                        roleId: userData.roleId,
                    },
                });
                return dbUser;
            });
            const { passwordHash: _, ...rest } = user;
            await (0, audit_1.logAudit)({
                userId: actingUserId,
                action: 'CREATE_USER',
                module: 'USERS',
                recordId: user.id,
                newData: rest,
            });
            res.status(201).json({
                status: 'success',
                data: rest,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const actingUserId = req.user?.id;
            const oldUser = await prisma_1.prisma.user.findUnique({ where: { id } });
            if (!oldUser)
                throw new errors_1.NotFoundError('User not found');
            const user = await prisma_1.prisma.$transaction(async (tx) => {
                const updated = await tx.user.update({
                    where: { id },
                    data: {
                        firstName: updateData.firstName,
                        lastName: updateData.lastName,
                        email: updateData.email,
                        phone: updateData.phone,
                        avatar: updateData.avatar,
                        roleId: updateData.roleId,
                        status: updateData.status,
                    },
                    include: { role: true },
                });
                // If roleId changed, sync user_roles
                if (updateData.roleId && updateData.roleId !== oldUser.roleId) {
                    await tx.userRole.deleteMany({ where: { userId: id } });
                    await tx.userRole.create({
                        data: {
                            userId: id,
                            roleId: updateData.roleId,
                        },
                    });
                }
                return updated;
            });
            const { passwordHash: _, ...rest } = user;
            await (0, audit_1.logAudit)({
                userId: actingUserId,
                action: 'UPDATE_USER',
                module: 'USERS',
                recordId: id,
                oldData: oldUser,
                newData: rest,
            });
            res.status(200).json({
                status: 'success',
                data: rest,
            });
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const actingUserId = req.user?.id;
            if (id === actingUserId) {
                throw new errors_1.BadRequestError('You cannot delete your own user account.');
            }
            const user = await prisma_1.prisma.user.findUnique({ where: { id } });
            if (!user)
                throw new errors_1.NotFoundError('User not found');
            await prisma_1.prisma.user.delete({ where: { id } });
            await (0, audit_1.logAudit)({
                userId: actingUserId,
                action: 'DELETE_USER',
                module: 'USERS',
                recordId: id,
                oldData: user,
            });
            res.status(204).json({
                status: 'success',
                data: null,
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const updateData = req.body;
            const user = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: updateData,
            });
            const { passwordHash, ...rest } = user;
            res.status(200).json({
                status: 'success',
                data: rest,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UsersController = UsersController;
