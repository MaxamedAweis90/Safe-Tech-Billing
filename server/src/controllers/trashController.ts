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

const getCompanyTenantId = (req: Request): string | Types.ObjectId | null => {
  if (req.user?.companyId) {
    return req.user.companyId;
  }
  const isDemo = Boolean(req.user?.email === 'demo@account.com' || req.user?.id?.startsWith('usr_'));
  return isDemo ? null : null;
};

export const getTrash = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, q, limit, skip } = req.query;
    const tenantCompanyId = getCompanyTenantId(req);

    const parsedLimit = limit
      ? Math.min(100, Math.max(1, parseInt(limit as string, 10)))
      : 50;
    const parsedSkip = skip ? Math.max(0, parseInt(skip as string, 10)) : 0;

    const result = await listTrash(tenantCompanyId, {
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

    const tenantCompanyId = getCompanyTenantId(req);
    const result = await restoreItem(type as TrashEntityType, id, tenantCompanyId);

    if (req.user) {
      await logAction({
        companyId: tenantCompanyId,
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

    const tenantCompanyId = getCompanyTenantId(req);
    const result = await purgeItem(type as TrashEntityType, id, tenantCompanyId);

    if (req.user) {
      await logAction({
        companyId: tenantCompanyId,
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
    if (err.message && err.message.includes('Cannot permanently purge')) {
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
    const tenantCompanyId = getCompanyTenantId(req);
    const { count } = await emptyTrash(tenantCompanyId);

    if (req.user) {
      await logAction({
        companyId: tenantCompanyId,
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
