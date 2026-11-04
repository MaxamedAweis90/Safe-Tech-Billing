import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export interface LogActionParams {
  user_name: string;
  role: string;
  action: string;
  ref?: string;
  detail?: string;
}

/**
 * Appends an immutable audit log record.
 * Audit records cannot be modified or deleted.
 */
export const logAction = async (params: LogActionParams): Promise<IAuditLog> => {
  const log = new AuditLog({
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

