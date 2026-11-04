import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  listCustomers,
  getCustomerStatement,
} from '../services/customerService';
import { logAction } from '../services/auditService';

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, limit, skip, sort } = req.query;

    const filter: Record<string, unknown> = {};
    if (q && typeof q === 'string' && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      const numCode = parseInt(q.trim(), 10);
      if (!isNaN(numCode)) {
        filter.$or = [{ code: numCode }, { name: regex }, { phone: regex }];
      } else {
        filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
      }
    }

    const sortOption: Record<string, 1 | -1> = sort === 'code' ? { code: 1 } : { name: 1 };
    const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit as string, 10))) : 50;
    const parsedSkip = skip ? Math.max(0, parseInt(skip as string, 10)) : 0;

    const result = await listCustomers(filter, {
      sort: sortOption,
      limit: parsedLimit,
      skip: parsedSkip,
    });

    const populated = await Promise.all(
      result.customers.map(async (c) => {
        try {
          const stmt = await getCustomerStatement(c._id);
          return {
            ...c.toObject(),
            id: c._id.toString(),
            invoiced_milli: stmt.total_invoiced_milli,
            paid_milli: stmt.total_paid_milli,
            credited_milli: stmt.total_credited_milli,
            balance_milli: stmt.outstanding_balance_milli,
            is_overdue: stmt.overdue_invoices_count > 0,
          };
        } catch {
          return {
            ...c.toObject(),
            id: c._id.toString(),
            invoiced_milli: 0,
            paid_milli: 0,
            credited_milli: 0,
            balance_milli: 0,
            is_overdue: false,
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      customers: populated,
      total: result.total,
      limit: parsedLimit,
      skip: parsedSkip,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    const statement = await getCustomerStatement(id);

    res.status(200).json({
      success: true,
      data: statement,
      customer: statement.customer,
    });
  } catch (err) {
    next(err);
  }
};

export const postCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await createCustomer(req.body);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Created customer',
        ref: String(customer.code),
        detail: `Customer ${customer.name} created`,
      });
    }

    res.status(201).json({
      success: true,
      customer,
    });
  } catch (err: any) {
    if (err.code === 11000 || (err.message && err.message.includes('already exists'))) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const putCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    const customer = await updateCustomer(id, req.body);

    if (req.user && customer) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Updated customer',
        ref: String(customer.code),
        detail: `Customer ${customer.name} updated`,
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (err: any) {
    if (err.code === 11000 || (err.message && err.message.includes('already exists'))) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const removeCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await getCustomerById(id);
    await deleteCustomer(id);

    if (req.user && existing) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Deleted customer',
        ref: String(existing.code),
        detail: `Customer ${existing.name} deleted`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

