import mongoose, { Types } from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export interface LogActionParams {
  companyId?: string | Types.ObjectId | null;
  user_name: string;
  role: string;
  action: string;
  ref?: string;
  detail?: string;
}

/**
 * Appends an immutable audit log record scoped to a specific company.
 * Audit records cannot be modified or deleted.
 */
export const logAction = async (params: LogActionParams): Promise<IAuditLog> => {
  let resolvedCompanyId: Types.ObjectId | null = null;
  if (params.companyId) {
    if (params.companyId instanceof Types.ObjectId) {
      resolvedCompanyId = params.companyId;
    } else if (typeof params.companyId === 'string' && Types.ObjectId.isValid(params.companyId)) {
      resolvedCompanyId = new Types.ObjectId(params.companyId);
    }
  }

  const log = new AuditLog({
    companyId: resolvedCompanyId,
    ts: new Date(),
    user_name: params.user_name,
    role: params.role,
    action: params.action,
    ref: params.ref || '',
    detail: params.detail || '',
  });

  if (mongoose.connection.readyState !== 1) {
    return log;
  }

  return await log.save();
};
