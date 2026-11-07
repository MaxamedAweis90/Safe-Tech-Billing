import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Invoice, InvoiceState } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { CreditNote } from "../models/CreditNote";
import * as invoiceService from "../services/invoiceService";
import { issueCreditNote } from "../services/paymentService";
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

export const listInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, customer_id, q, limit, skip } = req.query;

    const baseFilter: Record<string, unknown> = {};
    if (customer_id && typeof customer_id === "string") {
      baseFilter.customer_id = customer_id;
    }
    if (q && typeof q === "string" && q.trim()) {
      baseFilter.number = new RegExp(q.trim(), "i");
    }

    const filter = getTenantFilter(req, baseFilter);
    if (!filter) {
      res.status(200).json({
        success: true,
        invoices: [],
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

    const invoices = await Invoice.find(filter)
      .populate("customer_id", "code name phone email")
      .sort({ createdAt: -1 });

    // Compute live financials and derived statuses
    const populated = await Promise.all(
      invoices.map(async (inv) => {
        const fin = await invoiceService.getInvoiceFinancials(inv._id);
        return {
          ...inv.toObject(),
          total_milli: fin.total_milli,
          paid_milli: fin.paid_milli,
          credited_milli: fin.credited_milli,
          balance_milli: fin.balance_milli,
          status: fin.status,
        };
      }),
    );

    // Apply derived status filter if specified
    const filtered =
      status && typeof status === "string"
        ? populated.filter((inv) => inv.status === status)
        : populated;

    const total = filtered.length;
    const paginated = filtered.slice(parsedSkip, parsedSkip + parsedLimit);

    res.status(200).json({
      success: true,
      invoices: paginated,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoice = await Invoice.findOne(filter)
      .populate("customer_id")
      .populate("quote_id");

    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const financials = await invoiceService.getInvoiceFinancials(id);

    const [payments, creditNotes] = await Promise.all([
      Payment.find({ invoice_id: id }).populate("receipt_id").sort({ date: -1 }),
      CreditNote.find({ invoice_id: id }).sort({ date: -1 }),
    ]);

    res.status(200).json({
      success: true,
      invoice: {
        ...invoice.toObject(),
        total_milli: financials.total_milli,
        paid_milli: financials.paid_milli,
        credited_milli: financials.credited_milli,
        balance_milli: financials.balance_milli,
        status: financials.status,
      },
      payments,
      credit_notes: creditNotes,
    });
  } catch (err) {
    next(err);
  }
};

export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = req.user?.companyId || (req.user?.isDemo ? null : undefined);
    const payload = {
      ...req.body,
      companyId: tenantId,
    };
    const invoice = await invoiceService.createDraft(payload);

    if (req.user) {
      await logAction({
        companyId: tenantId,
        user_name: req.user.name,
        role: req.user.role,
        action: "Created draft invoice",
        ref: invoice._id.toString(),
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

export const updateInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const existing = await Invoice.findOne(filter);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoice = await invoiceService.updateDraft(id, req.body);

    if (req.user) {
      await logAction({
        companyId: req.user?.companyId || (req.user?.isDemo ? null : undefined),
        user_name: req.user.name,
        role: req.user.role,
        action: "Updated draft invoice",
        ref: invoice.number || invoice._id.toString(),
      });
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (err: any) {
    if (err.message && err.message.includes("Only drafts are editable")) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const issueInvoiceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const existing = await Invoice.findOne(filter);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoice = await invoiceService.issueInvoice(id);

    if (req.user) {
      await logAction({
        companyId: req.user?.companyId || (req.user?.isDemo ? null : undefined),
        user_name: req.user.name,
        role: req.user.role,
        action: "Formally issued invoice",
        ref: invoice.number || "",
      });
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (err: any) {
    if (err.message && err.message.includes("Only drafts are editable")) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const markSentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const existing = await Invoice.findOne(filter);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoice = await invoiceService.markSent(id);

    if (req.user) {
      await logAction({
        companyId: req.user?.companyId || (req.user?.isDemo ? null : undefined),
        user_name: req.user.name,
        role: req.user.role,
        action: "Marked invoice as sent",
        ref: invoice.number || "",
      });
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (err: any) {
    if (err.message && err.message.includes("Only drafts are editable")) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const cancelInvoiceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const existing = await Invoice.findOne(filter);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const { reason } = req.body;
    const invoice = await invoiceService.cancelInvoice(id, reason);

    if (req.user) {
      await logAction({
        companyId: req.user?.companyId || (req.user?.isDemo ? null : undefined),
        user_name: req.user.name,
        role: req.user.role,
        action: "Cancelled invoice",
        ref: invoice.number || "",
        detail: reason,
      });
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (err: any) {
    if (err.message && err.message.includes("Only drafts are editable")) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const creditNoteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const existing = await Invoice.findOne(filter);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const tenantId = req.user?.companyId || (req.user?.isDemo ? null : undefined);
    const creditNote = await issueCreditNote(id, {
      ...req.body,
      companyId: tenantId,
    });

    if (req.user) {
      await logAction({
        companyId: tenantId,
        user_name: req.user.name,
        role: req.user.role,
        action: "Issued credit note",
        ref: creditNote.number,
        detail: `Amount: ${creditNote.amount_milli}, Reason: ${creditNote.reason}`,
      });
    }

    res.status(201).json({
      success: true,
      credit_note: creditNote,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteInvoiceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoice = await Invoice.findOne(filter);
    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    await invoiceService.deleteDraft(id);

    if (req.user) {
      await logAction({
        companyId: req.user?.companyId || (req.user?.isDemo ? null : undefined),
        user_name: req.user.name,
        role: req.user.role,
        action: "Deleted draft invoice",
        ref: invoice._id.toString(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Draft invoice deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const listInvoicePaymentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const filter = getTenantFilter(req, { _id: id });
    if (!filter) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const invoice = await Invoice.findOne(filter);
    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    const payments = await Payment.find({ invoice_id: id })
      .populate("receipt_id")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (err) {
    next(err);
  }
};
