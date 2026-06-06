"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const prisma_1 = require("../configs/prisma");
const logAudit = async (params) => {
    try {
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: params.userId || null,
                action: params.action,
                module: params.module,
                recordId: params.recordId || null,
                oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : null,
                newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : null,
            },
        });
    }
    catch (error) {
        console.error('❌ Failed to write audit log:', error);
    }
};
exports.logAudit = logAudit;
