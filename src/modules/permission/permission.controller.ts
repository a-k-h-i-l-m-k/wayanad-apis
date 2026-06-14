import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';

export class PermissionController {
  /** List all permissions – admin only */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await prisma.permission.findMany();
      res.status(200).json({ status: 'success', data: permissions });
    } catch (err) {
      next(err);
    }
  }
}
