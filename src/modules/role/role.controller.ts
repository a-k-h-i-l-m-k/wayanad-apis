import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';

export class RoleController {
  /** Create a new role – admin can assign any name/description */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, permissionIds } = req.body;
      if (name === 'ADMIN') {
        throw new ForbiddenError('ADMIN role cannot be created');
      }
      const role = await prisma.role.create({
        data: {
          name,
          description,
          permissions: permissionIds
            ? { create: permissionIds.map((id: string) => ({ permissionId: id })) }
            : undefined,
        },
      });
      res.status(201).json({ status: 'success', data: role });
    } catch (err) {
      next(err);
    }
  }

  /** List all roles (including the built‑in ADMIN) */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
      });
      res.status(200).json({ status: 'success', data: roles });
    } catch (err) {
      next(err);
    }
  }

  /** Update role – ADMIN role is immutable */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, permissionIds } = req.body;

      const role = await prisma.role.findUnique({ where: { id } });
      if (!role) throw new NotFoundError('Role not found');
      if (role.name === 'ADMIN') {
        throw new ForbiddenError('ADMIN role cannot be edited');
      }

      const updated = await prisma.role.update({
        where: { id },
        data: {
          name,
          description,
          permissions: permissionIds
            ? {
                set: [],
                create: permissionIds.map((pid: string) => ({ permissionId: pid })),
              }
            : undefined,
        },
        include: { permissions: { include: { permission: true } } },
      });
      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  }

  /** Delete role – ADMIN role is protected */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await prisma.role.findUnique({ where: { id } });
      if (!role) throw new NotFoundError('Role not found');
      if (role.name === 'ADMIN') {
        throw new ForbiddenError('ADMIN role cannot be deleted');
      }
      await prisma.role.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  /** Replace role permissions – ADMIN role cannot be altered */
  async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;

      const role = await prisma.role.findUnique({ where: { id } });
      if (!role) throw new NotFoundError('Role not found');
      if (role.name === 'ADMIN') {
        throw new ForbiddenError('ADMIN role permissions cannot be changed');
      }

      await prisma.role.update({
        where: { id },
        data: {
          permissions: {
            set: [],
            create: permissionIds.map((pid: string) => ({ permissionId: pid })),
          },
        },
      });
      res.status(200).json({ status: 'success' });
    } catch (err) {
      next(err);
    }
  }
}
