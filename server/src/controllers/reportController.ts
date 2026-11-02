import { Request, Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice';
import { Quotation } from '../models/Quotation';
import { Payment } from '../models/Payment';
import { CreditNote } from '../models/CreditNote';
import { Customer } from '../models/Customer';
import { getInvoiceFinancials } from '../services/invoiceService';
import { calculateDocumentTotals } from '../services/mathService';

export const getSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [invoices, payments, creditNotes, quotationsCount, customersCount] = await Promise.all([
      Invoice.find({ state: { $ne: 'cancelled' } }),
      Payment.find(),
      CreditNote.find(),
      Quotation.countDocuments(),
      Customer.countDocuments(),
    ]);

    let total_invoiced_milli = 0;
    let total_overdue_milli = 0;
    let overdue_invoices_count = 0;

    for (const inv of invoices) {
      const totals = calculateDocumentTotals(inv.items);
      total_invoiced_milli += totals.total_milli;

      const invPayments = payments
        .filter((p) => p.invoice_id.toString() === inv._id.toString())
        .reduce((sum, p) => sum + p.amount_milli, 0);

      const invCredits = creditNotes
        .filter((c) => c.invoice_id.toString() === inv._id.toString())
        .reduce((sum, c) => sum + c.amount_milli, 0);

      const balance = Math.max(0, totals.total_milli - invPayments - invCredits);

      if (balance > 0 && inv.due < todayStr && inv.state === 'issued') {
        total_overdue_milli += balance;
        overdue_invoices_count += 1;
      }
    }

    const total_revenue_milli = payments.reduce((sum, p) => sum + p.amount_milli, 0);
    const total_credited_milli = creditNotes.reduce((sum, c) => sum + c.amount_milli, 0);
    const total_outstanding_milli = Math.max(
      0,
      total_invoiced_milli - total_revenue_milli - total_credited_milli
    );

    res.status(200).json({
      success: true,
      summary: {
        total_invoiced_milli,
        total_revenue_milli,
        total_credited_milli,
        total_outstanding_milli,
        total_overdue_milli,
        overdue_invoices_count,
        invoices_count: invoices.length,
        quotations_count: quotationsCount,
        customers_count: customersCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getRevenueReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoices = await Invoice.find({ state: { $ne: 'cancelled' } }).sort({ date: 1 });
    const payments = await Payment.find().sort({ date: 1 });

    // Aggregate monthly
    const monthlyMap: Record<string, { invoiced_milli: number; paid_milli: number }> = {};

    for (const inv of invoices) {
      const month = inv.date ? inv.date.substring(0, 7) : 'Unknown';
      if (!monthlyMap[month]) monthlyMap[month] = { invoiced_milli: 0, paid_milli: 0 };
      const totals = calculateDocumentTotals(inv.items);
      monthlyMap[month].invoiced_milli += totals.total_milli;
    }

    for (const p of payments) {
      const month = p.date ? p.date.substring(0, 7) : 'Unknown';
      if (!monthlyMap[month]) monthlyMap[month] = { invoiced_milli: 0, paid_milli: 0 };
      monthlyMap[month].paid_milli += p.amount_milli;
    }

    const series = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      invoiced_milli: data.invoiced_milli,
      paid_milli: data.paid_milli,
    }));

    res.status(200).json({
      success: true,
      series,
    });
  } catch (err) {
    next(err);
  }
};

export const getOutstandingReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    const invoices = await Invoice.find({ state: 'issued' }).populate('customer_id', 'code name phone');

    const outstandingItems = [];
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d60_plus: 0 };

    for (const inv of invoices) {
      const fin = await getInvoiceFinancials(inv._id);
      if (fin.balance_milli > 0) {
        const dueDate = new Date(inv.due);
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          buckets.current += fin.balance_milli;
        } else if (diffDays <= 30) {
          buckets.d1_30 += fin.balance_milli;
        } else if (diffDays <= 60) {
          buckets.d31_60 += fin.balance_milli;
        } else {
          buckets.d60_plus += fin.balance_milli;
        }

        outstandingItems.push({
          invoice_id: inv._id,
          number: inv.number,
          customer: inv.customer_id,
          due: inv.due,
          days_overdue: Math.max(0, diffDays),
          total_milli: fin.total_milli,
          balance_milli: fin.balance_milli,
        });
      }
    }

    res.status(200).json({
      success: true,
      buckets,
      invoices: outstandingItems,
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentsReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await Payment.find().populate('invoice_id', 'number');

    const byMethod: Record<string, { count: number; total_milli: number }> = {
      cash: { count: 0, total_milli: 0 },
      bank: { count: 0, total_milli: 0 },
      mobile: { count: 0, total_milli: 0 },
      card: { count: 0, total_milli: 0 },
    };

    for (const p of payments) {
      if (byMethod[p.method]) {
        byMethod[p.method].count += 1;
        byMethod[p.method].total_milli += p.amount_milli;
      }
    }

    res.status(200).json({
      success: true,
      by_method: byMethod,
      total_payments_count: payments.length,
    });
  } catch (err) {
    next(err);
  }
};

export const getConversionReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalQuotes, acceptedQuotes, convertedQuotes] = await Promise.all([
      Quotation.countDocuments(),
      Quotation.countDocuments({ state: 'accepted' }),
      Quotation.countDocuments({ invoice_id: { $ne: null } }),
    ]);

    const rate = totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0;

    res.status(200).json({
      success: true,
      conversion: {
        total_quotes: totalQuotes,
        accepted_quotes: acceptedQuotes,
        converted_to_invoices: convertedQuotes,
        conversion_rate_pct: Math.round(rate * 10) / 10,
      },
    });
  } catch (err) {
    next(err);
  }
};

