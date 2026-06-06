import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { env } from '../configs/env';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Internal Server Error';
  let errors: any = undefined;

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    status = 'fail';
    message = 'Validation failed';
    errors = err.errors || err.format();
  }

  // Handle custom ValidationError
  if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
    errors = err.errors;
  }

  // Handle Prisma Database Errors
  if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    status = 'fail';
    if (err.code === 'P2002') {
      message = 'A unique constraint violation occurred on the database.';
      errors = err.meta;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'The record to update or delete was not found.';
    } else {
      message = `Database Error: ${err.message}`;
    }
  }

  // Log detailed error stack on Server Errors (500)
  if (statusCode === 500) {
    console.error('🔥 Server Error:', err);
  } else {
    console.warn(`⚠️ Warning [${statusCode}]: ${message}`);
  }

  res.status(statusCode).json({
    status,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
