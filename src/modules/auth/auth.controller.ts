import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service';
import { prisma } from '../../configs/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { env } from '../../configs/env';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export class AuthController {
  private authService = new AuthService();

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
  // Set secure HTTP-only cookie for refresh token with appropriate maxAge based on env
  const refreshCookieMaxAge =
    Number(env.JWT_REFRESH_EXPIRES_IN.replace('d', '')) * 24 * 60 * 60 * 1000; // days to ms
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshCookieMaxAge,
  });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Accept refresh token from either the HttpOnly cookie (frontend) or the request body (API clients)
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        return next(new Error('Refresh token is required'));
      }
      const result = await this.authService.refreshToken(token);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };


  public forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);
      res.status(200).json({
        status: 'success',
        message: 'Password reset token generated (simulating email send).',
        data: result, // In production, don't return this; email it
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;
      await this.authService.resetPassword(token, password);
      res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstName, lastName, email, password, phone } = req.body;
      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestError('User with this email already exists');
      }
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      // Find or create the CUSTOMER role for public registrations
      let customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
      if (!customerRole) {
        customerRole = await prisma.role.create({
          data: { name: 'CUSTOMER', description: 'Public website user — can make bookings and write reviews' },
        });
      }
      // Create user
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
          roleId: customerRole.id,
          status: 'ACTIVE',
        },
      });
      // Generate tokens
      const accessToken = jwt.sign({ userId: user.id, email: user.email, role: customerRole.name }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
      const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + Number(env.JWT_REFRESH_EXPIRES_IN.replace('d', '')) * 24 * 60 * 60 * 1000),
        },
      });
      // Set cookie
      const refreshCookieMaxAge = Number(env.JWT_REFRESH_EXPIRES_IN.replace('d', '')) * 24 * 60 * 60 * 1000;
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: refreshCookieMaxAge });
      // Respond
      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: { id: customerRole.id, name: customerRole.name, permissions: [] },
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };


  public logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { revoked: true },
        });
      }
      // Clear cookie
      res.clearCookie('refreshToken');
      res.status(200).json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
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
        throw new NotFoundError('User not found');
      }

      // Flatten permissions
      const permissions = user.role?.permissions.map((rp: any) => rp.permission.name) || [];

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
    } catch (error) {
      next(error);
    }
  };
}
