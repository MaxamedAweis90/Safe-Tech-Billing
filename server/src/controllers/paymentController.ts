import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Payment } from "../models/Payment";
import { Receipt } from "../models/Receipt";
import { Invoice } from "../models/Invoice";
import { recordPayment } from "../services/paymentService";
import { logAction } from "../services/auditService";

const getTenantFilter = (req: Request, baseFilter: Record<string, unknown> = {}): Record<string, unknown> | null => {
  if (req.user?.companyId) {
    return { ...baseFilter, companyId: req.user.companyId };
  }
  if (req.user?.isDemo) {
    return { ...baseFilter, companyId: null };
  }
  return null;
};

export const postPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string; // invoiceId
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoiceFilter = getTenantFilter(req, { _id: id });
    if (!invoiceFilter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoice = await Invoice.findOne(invoiceFilter);
    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const tenantId = req.user?.companyId || (req.user?.isDemo ? null : undefined);
    const payload = {
      ...req.body,
      companyId: tenantId,
    };
    const result = await recordPayment(id, payload);

    if (req.user) {
      await logAction({
        companyId: tenantId,
        user_name: req.user.name,
        role: req.user.role,
        action: "Recorded payment",
        ref: result.receipt.number,
        detail: `Amount: ${result.payment.amount_milli}, Method: ${result.payment.method}, Ref: ${result.payment.reference}`,
      });
    }

    res.status(201).json({
      success: true,
      payment: result.payment,
      receipt: result.receipt,
    });
  } catch (err) {
    next(err);
  }
};

export const listPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { invoice_id, method, limit, skip } = req.query;

    const baseFilter: Record<string, unknown> = {
      isDeleted: { $ne: true },
    };
    if (invoice_id && typeof invoice_id === "string") {
      baseFilter.invoice_id = invoice_id;
    }
    if (method && typeof method === "string") {
      baseFilter.method = method;
    }

    const filter = getTenantFilter(req, baseFilter);
    if (!filter) {
      res.status(200).json({
        success: true,
        payments: [],
        total: 0,
        limit: 50,
        skip: 0,
      });
      return;
    }

    const parsedLimit = limit
      ? Math.min(100, Math.max(1, parseInt(limit as string, 10)))
      : 50;
    const parsedSkip = skip ? Math.max(0, parseInt(skip as string, 10)) : 0;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("invoice_id", "number date due")
        .populate("receipt_id", "number")
        .sort({ date: -1, createdAt: -1 })
        .skip(parsedSkip)
        .limit(parsedLimit),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      payments,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
    });
  } catch (err) {
    next(err);
  }
};

export const listReceipts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { method, customer_id, q, limit, skip } = req.query;

    const baseFilter: Record<string, unknown> = {
      isDeleted: { $ne: true },
    };
    if (method && typeof method === "string" && method !== "all") {
      baseFilter.method = method;
    }
    if (customer_id && typeof customer_id === "string" && customer_id !== "all") {
      baseFilter.customer_id = customer_id;
    }
    if (q && typeof q === "string" && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      baseFilter.$or = [{ number: regex }, { reference: regex }];
    }

    const filter = getTenantFilter(req, baseFilter);
    if (!filter) {
      res.status(200).json({
        success: true,
        receipts: [],
        total: 0,
        limit: 50,
        skip: 0,
      });
      return;
    }

    const parsedLimit = limit
      ? Math.min(100, Math.max(1, parseInt(limit as string, 10)))
      : 50;
    const parsedSkip = skip ? Math.max(0, parseInt(skip as string, 10)) : 0;

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate("customer_id", "code name phone email")
        .populate("invoice_id", "number date due")
        .sort({ date: -1, createdAt: -1 })
        .skip(parsedSkip)
        .limit(parsedLimit),
      Receipt.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      receipts,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
    });
  } catch (err) {
    next(err);
  }
};

export const getReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Receipt not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id, isDeleted: { $ne: true } });
    if (!filter) {
      res.status(404).json({ success: false, error: "Receipt not found" });
      return;
    }

    const receipt = await Receipt.findOne(filter)
      .populate("customer_id")
      .populate("invoice_id")
      .populate("payment_id");

    if (!receipt) {
      res.status(404).json({ success: false, error: "Receipt not found" });
      return;
    }

    res.status(200).json({
      success: true,
      receipt,
    });
  } catch (err) {
    next(err);
  }
};

export const removeReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Receipt not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id, isDeleted: { $ne: true } });
    if (!filter) {
      res.status(404).json({ success: false, error: "Receipt not found" });
      return;
    }

    const receipt = await Receipt.findOne(filter);
    if (!receipt) {
      res.status(404).json({ success: false, error: "Receipt not found" });
      return;
    }

    const now = new Date();
    const userId = req.user?.id ? new Types.ObjectId(req.user.id) : null;

    receipt.isDeleted = true;
    receipt.deletedAt = now;
    receipt.deletedBy = userId;
    await receipt.save();

    if (receipt.payment_id) {
      await Payment.updateOne(
        { _id: receipt.payment_id },
        { $set: { isDeleted: true, deletedAt: now, deletedBy: userId } }
      );
    }

    if (req.user) {
      const tenantCompanyId = req.user.companyId || (req.user.isDemo ? null : undefined);
      await logAction({
        companyId: tenantCompanyId,
        user_name: req.user.name,
        role: req.user.role,
        action: "Moved receipt to trash",
        ref: receipt.number,
        detail: `Voided payment ${receipt.amount_milli} milli (${receipt.method}) and moved receipt to trash`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Receipt moved to trash successfully",
    });
  } catch (err) {
    next(err);
  }
};
