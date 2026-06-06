import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../configs/env';
import { prisma } from '../configs/prisma';
import { UnauthorizedError } from '../utils/errors';

interface JwtPayload {
  userId: string;
  email: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err) {
      throw new UnauthorizedError('Token is expired or invalid');
    }

    // Fetch user and permissions from database
    const user = await prisma.user.findUnique({
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
      throw new UnauthorizedError('User associated with this token no longer exists');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('This user account is no longer active');
    }

    // Flatten permissions list
    const permissionNames = user.role
      ? user.role.permissions.map((rp: any) => rp.permission.name)
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
  } catch (error) {
    next(error);
  }
};
