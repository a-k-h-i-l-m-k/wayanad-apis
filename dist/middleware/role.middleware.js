"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = void 0;
const errors_1 = require("../utils/errors");
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError());
        }
        const hasRole = allowedRoles.includes(req.user.role.name);
        if (!hasRole) {
            return next(new errors_1.ForbiddenError('You do not have permission to perform this action'));
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError());
        }
        // SUPER_ADMIN has override access to everything
        if (req.user.role.name === 'SUPER_ADMIN') {
            return next();
        }
        const hasPermission = req.user.role.permissions.includes(permission);
        if (!hasPermission) {
            return next(new errors_1.ForbiddenError('You do not have the required permission to perform this action'));
        }
        next();
    };
};
exports.requirePermission = requirePermission;
