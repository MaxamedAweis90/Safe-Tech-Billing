import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Invoice, InvoiceState } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { CreditNote } from "../models/CreditNote";
import * as invoiceService from "../services/invoiceService";
import { issueCreditNote } from "../services/paymentService";
import { logAction } from "../services/auditService";

export const listInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, customer_id, q, limit, skip } = req.query;

    const filter: Record<string, unknown> = {};
    if (customer_id && typeof customer_id === "string") {
      filter.customer_id = customer_id;
    }
    if (q && typeof q === "string" && q.trim()) {
      filter.number = new RegExp(q.trim(), "i");
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
    const financials = await invoiceService.getInvoiceFinancials(id);
    const invoice = await Invoice.findById(id)
      .populate("customer_id")
      .populate("quote_id");

    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

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
    const invoice = await invoiceService.createDraft(req.body);

    if (req.user) {
      await logAction({
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
    const invoice = await invoiceService.updateDraft(id, req.body);

    if (req.user) {
      await logAction({
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
    if (err.message && err.message.includes('Only drafts are editable')) {
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
    const invoice = await invoiceService.issueInvoice(id);

    if (req.user) {
      await logAction({
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
    if (err.message && err.message.includes('Only drafts are editable')) {
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
    const invoice = await invoiceService.markSent(id);

    if (req.user) {
      await logAction({
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
    if (err.message && err.message.includes('Only drafts are editable')) {
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
    const { reason } = req.body;
    const invoice = await invoiceService.cancelInvoice(id, reason);

    if (req.user) {
      await logAction({
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
    if (err.message && err.message.includes('Only drafts are editable')) {
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
    const creditNote = await issueCreditNote(id, req.body);

    if (req.user) {
      await logAction({
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
    const invoice = await Invoice.findById(id);
    await invoiceService.deleteDraft(id);

    if (req.user && invoice) {
      await logAction({
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
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }
    const payments = await Payment.find({ invoice_id: id }).populate("receipt_id").sort({ date: -1 });
    res.status(200).json({
      success: true,
      payments,
    });
  } catch (err) {
    next(err);
  }
};
