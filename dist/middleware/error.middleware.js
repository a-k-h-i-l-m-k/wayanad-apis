"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errors_1 = require("../utils/errors");
const env_1 = require("../configs/env");
const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let status = err.status || 'error';
    let message = err.message || 'Internal Server Error';
    let errors = undefined;
    // Handle Zod Validation Errors
    if (err.name === 'ZodError') {
        statusCode = 400;
        status = 'fail';
        message = 'Validation failed';
        errors = err.errors || err.format();
    }
    // Handle custom ValidationError
    if (err instanceof errors_1.ValidationError) {
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
        }
        else if (err.code === 'P2025') {
            statusCode = 404;
            message = 'The record to update or delete was not found.';
        }
        else {
            message = `Database Error: ${err.message}`;
        }
    }
    // Log detailed error stack on Server Errors (500)
    if (statusCode === 500) {
        console.error('🔥 Server Error:', err);
    }
    else {
        console.warn(`⚠️ Warning [${statusCode}]: ${message}`);
    }
    res.status(statusCode).json({
        status,
        message,
        ...(errors && { errors }),
        ...(env_1.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorMiddleware = errorMiddleware;
