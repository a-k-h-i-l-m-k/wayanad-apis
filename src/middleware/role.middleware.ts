import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const hasRole = allowedRoles.includes(req.user.role.name);
    if (!hasRole) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // ADMIN and SUPER_ADMIN have override access to everything
    if (req.user.role.name === 'SUPER_ADMIN' || req.user.role.name === 'ADMIN') {
      return next();
    }


    const hasPermission = req.user.role.permissions.includes(permission);
    if (!hasPermission) {
      return next(new ForbiddenError('You do not have the required permission to perform this action'));
    }

    next();
  };
};
