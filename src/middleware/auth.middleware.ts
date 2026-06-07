import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../configs/env';
import { prisma } from '../configs/prisma';
import { UnauthorizedError } from '../utils/errors';

interface JwtPayload {
  userId: string;
  email: string;
}

interface CachedUser {
  id: string;
  email: string;
  status: string;
  role: { id: string; name: string; permissions: string[] };
}

/**
 * Short-lived cache of the per-user auth/permission lookup. Without it, EVERY
 * authenticated request runs a deep user→role→permissions join against the
 * remote DB (~60–100ms each), which dominates response time. Permissions change
 * rarely, so a brief TTL is safe and removes that query from nearly all requests.
 * Use `invalidateAuthCache(userId)` after changing a user's role/status.
 */
const AUTH_CACHE_TTL_MS = 30_000;
const authCache = new Map<string, { user: CachedUser; expires: number }>();

export function invalidateAuthCache(userId?: string) {
  if (userId) authCache.delete(userId);
  else authCache.clear();
}

async function loadUser(userId: string): Promise<CachedUser | null> {
  const cached = authCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.user;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });
  if (!user) return null;

  const shaped: CachedUser = {
    id: user.id,
    email: user.email,
    status: user.status,
    role: {
      id: user.role?.id || '',
      name: user.role?.name || '',
      permissions: user.role ? user.role.permissions.map((rp: any) => rp.permission.name) : [],
    },
  };
  authCache.set(userId, { user: shaped, expires: Date.now() + AUTH_CACHE_TTL_MS });
  return shaped;
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

    const user = await loadUser(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User associated with this token no longer exists');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('This user account is no longer active');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
