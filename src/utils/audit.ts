import { prisma } from '../configs/prisma';

export interface AuditLogParams {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  oldData?: any;
  newData?: any;
}

export const logAudit = async (params: AuditLogParams) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        module: params.module,
        recordId: params.recordId || null,
        oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : null,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : null,
      },
    });
  } catch (error) {
    console.error('❌ Failed to write audit log:', error);
  }
};
