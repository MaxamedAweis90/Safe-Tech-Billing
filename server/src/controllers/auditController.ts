import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

export const listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, user_name, ref, limit, skip } = req.query;

    const filter: Record<string, unknown> = {};
    if (user_name && typeof user_name === 'string') {
      filter.user_name = user_name;
    }
    if (ref && typeof ref === 'string' && ref.trim()) {
      filter.ref = new RegExp(ref.trim(), 'i');
    }
    if (q && typeof q === 'string' && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ action: regex }, { ref: regex }, { detail: regex }, { user_name: regex }];
    }

    const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit as string, 10))) : 50;
    const parsedSkip = skip ? Math.max(0, parseInt(skip as string, 10)) : 0;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ ts: -1 }).skip(parsedSkip).limit(parsedLimit),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      logs,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
    });
  } catch (err) {
    next(err);
  }
};

