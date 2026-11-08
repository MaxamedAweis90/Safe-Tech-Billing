import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  listTrash,
  restoreItem,
  purgeItem,
  emptyTrash,
  TrashEntityType,
} from '../services/trashService';
import { logAction } from '../services/auditService';

export const resolveTenantId = (req: Request): { tenantId: string | Types.ObjectId | null; isAllowed: boolean } => {
  if (req.user?.companyId) {
    return { tenantId: req.user.companyId, isAllowed: true };
  }
  const isDemo = Boolean(req.user?.isDemo || req.user?.email === 'demo@account.com' || req.user?.id?.startsWith('usr_'));
  if (isDemo) {
    return { tenantId: null, isAllowed: true };
  }
  return { tenantId: null, isAllowed: false };
};

export const getTrash = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, q, limit, skip } = req.query;
    const { tenantId, isAllowed } = resolveTenantId(req);

    const parsedLimit = limit
      ? Math.min(100, Math.max(1, parseInt(limit as string, 10)))
      : 50;
    const parsedSkip = skip ? Math.max(0, parseInt(skip as string, 10)) : 0;

    if (!isAllowed) {
      res.status(200).json({
        success: true,
        items: [],
        counts: { all: 0, quotation: 0, invoice: 0, receipt: 0, customer: 0 },
        total: 0,
        limit: parsedLimit,
        skip: parsedSkip,
      });
      return;
    }

    const result = await listTrash(tenantId, {
      type: typeof type === 'string' ? type : undefined,
      q: typeof q === 'string' ? q : undefined,
      limit: parsedLimit,
      skip: parsedSkip,
    });

    res.status(200).json({
      success: true,
      items: result.items,
      counts: result.counts,
      total: result.total,
      limit: parsedLimit,
      skip: parsedSkip,
    });
  } catch (err) {
    next(err);
  }
};

export const restoreTrashItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = req.params.type as string;
    const id = req.params.id as string;
    if (!['quotation', 'invoice', 'receipt', 'customer'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid entity type' });
      return;
    }
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Record not found' });
      return;
    }

    const { tenantId, isAllowed } = resolveTenantId(req);
    if (!isAllowed) {
      res.status(403).json({ success: false, error: 'Unauthorized: missing company context' });
      return;
    }

    const result = await restoreItem(type as TrashEntityType, id, tenantId);

    if (req.user) {
      await logAction({
        companyId: tenantId,
        user_name: req.user.name,
        role: req.user.role,
        action: `Restored ${type} from trash`,
        ref: result.ref,
        detail: result.detail,
      });
    }

    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} restored successfully`,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('not found in trash')) {
      res.status(404).json({ success: false, error: err.message });
      return;
    }
    if (err.message && (err.message.includes('Cannot restore') || err.message.includes('exceeds invoice remaining balance'))) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const purgeTrashItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = req.params.type as string;
    const id = req.params.id as string;
    if (!['quotation', 'invoice', 'receipt', 'customer'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid entity type' });
      return;
    }
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Record not found' });
      return;
    }

    const { tenantId, isAllowed } = resolveTenantId(req);
    if (!isAllowed) {
      res.status(403).json({ success: false, error: 'Unauthorized: missing company context' });
      return;
    }

    const result = await purgeItem(type as TrashEntityType, id, tenantId);

    if (req.user) {
      await logAction({
        companyId: tenantId,
        user_name: req.user.name,
        role: req.user.role,
        action: `Permanently purged ${type}`,
        ref: result.ref,
        detail: result.detail,
      });
    }

    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} permanently deleted`,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('not found in trash')) {
      res.status(404).json({ success: false, error: err.message });
      return;
    }
    if (err.message && (err.message.includes('Cannot permanently purge') || err.message.includes('active invoices'))) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const emptyAllTrash = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tenantId, isAllowed } = resolveTenantId(req);
    if (!isAllowed) {
      res.status(403).json({ success: false, error: 'Unauthorized: missing company context' });
      return;
    }

    const { count } = await emptyTrash(tenantId);

    if (req.user) {
      await logAction({
        companyId: tenantId,
        user_name: req.user.name,
        role: req.user.role,
        action: 'Emptied trash',
        ref: `${count} items`,
        detail: `Permanently purged ${count} items from trash`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Trash emptied successfully (${count} items removed)`,
      count,
    });
  } catch (err) {
    next(err);
  }
};
