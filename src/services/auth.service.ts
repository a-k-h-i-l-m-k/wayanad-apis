import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../configs/prisma';
import { env } from '../configs/env';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';

export interface LoginResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Login user and generate JWT tokens
   */
  public async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Your account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT access & refresh tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role?.name || '' },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    // Store refresh token in DB for revocation support
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + Number(env.JWT_REFRESH_EXPIRES_IN.replace('d', '')) * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role?.name || '',
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh the access token using a valid refresh token
   */
  public async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };

      // Verify token exists in DB, not revoked, and not expired
      const stored = await prisma.refreshToken.findUnique({
        where: { token },
      });
      if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        throw new UnauthorizedError('Refresh token is expired or invalid');
      }
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('User account is invalid or suspended');
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role?.name || '' },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedError('Refresh token is expired or invalid');
    }
  }

  /**
   * Initiates forgot-password by sending a signed stateless recovery token
   */
  public async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('No account with that email address exists');
    }

    // Generate brief reset token (15 mins validity)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset-password' },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // In a real application, you would email this link.
    // E.g. mailService.sendResetEmail(user.email, resetToken);
    
    return { resetToken };
  }

  /**
   * Resets password using a validated recovery token
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; purpose: string };

      if (decoded.purpose !== 'reset-password') {
        throw new BadRequestError('Invalid reset token purpose');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    } catch (error) {
      throw new BadRequestError('Password reset token is invalid or has expired');
    }
  }

  /**
   * Changes password for an already logged-in user
   */
  public async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
