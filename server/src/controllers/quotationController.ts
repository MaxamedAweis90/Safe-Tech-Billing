import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Quotation, QuotationState } from '../models/Quotation';
import * as quotationService from '../services/quotationService';
import { calculateDocumentTotals } from '../services/mathService';
import { logAction } from '../services/auditService';

export const listQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { state, customer_id, q, limit, skip } = req.query;

    const filter: Record<string, unknown> = {};
    if (req.user?.companyId) {
      filter.companyId = req.user.companyId;
    }
    if (state && typeof state === 'string') {
      filter.state = state as QuotationState;
    }
    if (customer_id && typeof customer_id === 'string') {
      filter.customer_id = customer_id;
    }
    if (q && typeof q === 'string' && q.trim()) {
      filter.number = new RegExp(q.trim(), 'i');
    }

    const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit as string, 10))) : 50;
    const parsedSkip = skip ? Math.max(0, parseInt(skip as string, 10)) : 0;

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('customer_id', 'code name phone email')
        .sort({ createdAt: -1 })
        .skip(parsedSkip)
        .limit(parsedLimit),
      Quotation.countDocuments(filter),
    ]);

    const formatted = quotations.map((q) => {
      const totals = calculateDocumentTotals(q.items);
      return {
        ...q.toObject(),
        totals,
      };
    });

    res.status(200).json({
      success: true,
      quotations: formatted,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
    });
  } catch (err) {
    next(err);
  }
};

export const getQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const quotation = await Quotation.findById(id).populate('customer_id');

    if (!quotation) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }

    const totals = calculateDocumentTotals(quotation.items);

    res.status(200).json({
      success: true,
      quotation: {
        ...quotation.toObject(),
        totals,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = {
      ...req.body,
      companyId: req.user?.companyId || undefined,
    };
    const quote = await quotationService.createDraft(payload);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Created draft quotation',
        ref: quote.number,
      });
    }

    res.status(201).json({
      success: true,
      quotation: quote,
    });
  } catch (err) {
    next(err);
  }
};

export const updateQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const quote = await quotationService.updateDraft(id, req.body);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Updated draft quotation',
        ref: quote.number,
      });
    }

    res.status(200).json({
      success: true,
      quotation: quote,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Only drafts are editable')) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const sendQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const quote = await quotationService.markSent(id);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Marked quotation as sent',
        ref: quote.number,
      });
    }

    res.status(200).json({
      success: true,
      quotation: quote,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Only drafts are editable')) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const acceptQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const quote = await quotationService.markAccepted(id);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Accepted quotation',
        ref: quote.number,
      });
    }

    res.status(200).json({
      success: true,
      quotation: quote,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Only drafts are editable')) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const rejectQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const { reason } = req.body;
    const quote = await quotationService.markRejected(id, reason);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Rejected quotation',
        ref: quote.number,
        detail: reason,
      });
    }

    res.status(200).json({
      success: true,
      quotation: quote,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Only drafts are editable')) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const convertQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const invoice = await quotationService.convertToInvoice(id);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Converted quotation to draft invoice',
        ref: invoice._id.toString(),
        detail: `Linked to quotation ID: ${id}`,
      });
    }

    res.status(201).json({
      success: true,
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

export const duplicateQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const quote = await quotationService.duplicateQuote(id);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Duplicated quotation',
        ref: quote.number,
        detail: `Cloned from quotation ID: ${id}`,
      });
    }

    res.status(201).json({
      success: true,
      quotation: quote,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    const existing = await Quotation.findById(id);
    await quotationService.deleteDraft(id);

    if (req.user && existing) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Deleted draft quotation',
        ref: existing.number,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Draft quotation deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

