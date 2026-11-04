import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Payment } from "../models/Payment";
import { Receipt } from "../models/Receipt";
import { recordPayment } from "../services/paymentService";
import { logAction } from "../services/auditService";

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

    const result = await recordPayment(id, req.body);

    if (req.user) {
      await logAction({
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

    const filter: Record<string, unknown> = {};
    if (invoice_id && typeof invoice_id === "string")
      filter.invoice_id = invoice_id;
    if (method && typeof method === "string") filter.method = method;

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

    const filter: Record<string, unknown> = {};
    if (method && typeof method === "string" && method !== "all")
      filter.method = method;
    if (customer_id && typeof customer_id === "string" && customer_id !== "all")
      filter.customer_id = customer_id;
    if (q && typeof q === "string" && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [{ number: regex }, { reference: regex }];
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
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, error: "Receipt not found" });
      return;
    }

    const receipt = await Receipt.findById(id)
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
