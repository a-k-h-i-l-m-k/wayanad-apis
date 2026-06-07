import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../configs/prisma';
import { parseQueryParams, formatPaginatedResponse } from '../../utils/query';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { logAudit } from '../../utils/audit';
import { invalidateAuthCache } from '../../middleware/auth.middleware';

export class UsersController {
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['roleId', 'status']);
      
      const where: any = { ...parsed.filters };

      if (parsed.search) {
        where.OR = [
          { firstName: { contains: parsed.search, mode: 'insensitive' } },
          { lastName: { contains: parsed.search, mode: 'insensitive' } },
          { email: { contains: parsed.search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            role: true,
          },
          skip: parsed.skip,
          take: parsed.limit,
          orderBy: { [parsed.sortBy]: parsed.sortOrder },
        }),
        prisma.user.count({ where }),
      ]);

      const formatted = items.map((u: any) => {
        const { passwordHash, ...rest } = u;
        return rest;
      });

      res.status(200).json({
        status: 'success',
        data: formatPaginatedResponse(formatted, total, parsed),
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: { role: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { passwordHash, ...rest } = user;

      res.status(200).json({
        status: 'success',
        data: rest,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password, ...userData } = req.body;
      const actingUserId = req.user?.id;

      // Check if user email already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        throw new BadRequestError('Email address is already in use');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.$transaction(async (tx: any) => {
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

      await logAudit({
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
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const actingUserId = req.user?.id;

      const oldUser = await prisma.user.findUnique({ where: { id } });
      if (!oldUser) throw new NotFoundError('User not found');

      const user = await prisma.$transaction(async (tx: any) => {
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

      // Role/status may have changed — drop the cached auth entry so the next
      // request for this user re-reads fresh permissions.
      invalidateAuthCache(id);

      await logAudit({
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
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const actingUserId = req.user?.id;

      if (id === actingUserId) {
        throw new BadRequestError('You cannot delete your own user account.');
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundError('User not found');

      await prisma.user.delete({ where: { id } });
      invalidateAuthCache(id);

      await logAudit({
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
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      const { passwordHash, ...rest } = user;

      res.status(200).json({
        status: 'success',
        data: rest,
      });
    } catch (error) {
      next(error);
    }
  };
}
