import { Request, Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice';
import { Quotation } from '../models/Quotation';
import { Payment } from '../models/Payment';
import { Customer } from '../models/Customer';
import { getInvoiceFinancials } from '../services/invoiceService';
import { calculateDocumentTotals } from '../services/mathService';

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isDemo = Boolean(req.user?.email === 'demo@account.com' || req.user?.id?.startsWith('usr_'));
    const realToday = new Date().toISOString().slice(0, 10);
    const todayStr = isDemo ? '2026-10-31' : realToday;
    const currentMonthKey = todayStr.slice(0, 7);

    // Generate last 12 rolling months
    const months: string[] = [];
    const dateObj = new Date(todayStr + 'T00:00:00Z');
    dateObj.setUTCDate(1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(dateObj);
      d.setUTCMonth(d.getUTCMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }

    const tenantCompanyId = req.user?.companyId;
    let companyFilter: Record<string, unknown> = {
      isDeleted: { $ne: true },
    };
    if (tenantCompanyId) {
      companyFilter.companyId = tenantCompanyId;
    } else {
      if (isDemo) {
        companyFilter.companyId = null;
      } else {
        res.status(200).json({
          success: true,
          summary: {
            kpis: {
              totalCustomers: 0,
              totalQuotes: 0,
              winRate: 0,
              issuedInvoices: 0,
              draftCount: 0,
              cancelledCount: 0,
              received: 0,
              thisMonth: 0,
              outstanding: 0,
              openInvoicesCount: 0,
              overdueAmt: 0,
              overdueCount: 0,
            },
            revenueData: {
              months,
              invoiced: months.map(() => 0),
              received: months.map(() => 0),
            },
            statusDist: {
              paid: { count: 0, total_milli: 0 },
              partial: { count: 0, total_milli: 0 },
              sent: { count: 0, total_milli: 0 },
              unpaid: { count: 0, total_milli: 0 },
              overdue: { count: 0, total_milli: 0 },
            },
            recentTransactions: [],
          },
        });
        return;
      }
    }

    const [invoices, quotations, payments, customers] = await Promise.all([
      Invoice.find(companyFilter).populate('customer_id', 'name code'),
      Quotation.find(companyFilter).populate('customer_id', 'name code'),
      Payment.find(companyFilter).populate({
        path: 'invoice_id',
        populate: { path: 'customer_id', select: 'name code' },
      }),
      Customer.find(companyFilter),
    ]);

    // Customer lookup map
    const customerMap = new Map<string, any>();
    customers.forEach((c) => customerMap.set(c._id.toString(), c));

    // Calculate Invoices financials & status
    const issuedInvoices = invoices.filter(
      (i) => i.state !== 'draft' && i.state !== 'cancelled'
    );
    const draftCount = invoices.filter((i) => i.state === 'draft').length;
    const cancelledCount = invoices.filter((i) => i.state === 'cancelled').length;

    // Financials calculation for all issued invoices
    let totalOutstandingMilli = 0;
    let openInvoicesCount = 0;
    let totalOverdueMilli = 0;
    let overdueCount = 0;

    const invoiceStatusCounts: Record<string, { count: number; total_milli: number }> = {
      paid: { count: 0, total_milli: 0 },
      partial: { count: 0, total_milli: 0 },
      sent: { count: 0, total_milli: 0 },
      unpaid: { count: 0, total_milli: 0 },
      overdue: { count: 0, total_milli: 0 },
    };

    const invoiceFinList = await Promise.all(
      issuedInvoices.map(async (inv) => {
        const fin = await getInvoiceFinancials(inv._id);
        const status = fin.status;

        if (fin.balance_milli > 0) {
          totalOutstandingMilli += fin.balance_milli;
          openInvoicesCount += 1;
        }

        if (status === 'overdue') {
          totalOverdueMilli += fin.balance_milli;
          overdueCount += 1;
        }

        if (invoiceStatusCounts[status]) {
          invoiceStatusCounts[status].count += 1;
          invoiceStatusCounts[status].total_milli += fin.total_milli;
        }

        return {
          invoice: inv,
          fin,
          status,
        };
      })
    );

    // Payments totals
    const totalReceivedMilli = payments.reduce((sum, p) => sum + p.amount_milli, 0);
    const thisMonthReceivedMilli = payments
      .filter((p) => (p.date || '').slice(0, 7) === currentMonthKey)
      .reduce((sum, p) => sum + p.amount_milli, 0);

    // Quotations metrics
    const totalQuotes = quotations.length;
    const acceptedQuotes = quotations.filter((q) => q.state === 'accepted').length;
    const decidedQuotes = quotations.filter((q) =>
      ['accepted', 'rejected', 'expired'].includes(q.state)
    ).length;
    const winRate = decidedQuotes ? Math.round((acceptedQuotes / decidedQuotes) * 100) : 0;

    // Monthly rolling series
    const invoicedPerMonth = months.map((m) => {
      return issuedInvoices
        .filter((inv) => (inv.date || '').slice(0, 7) === m)
        .reduce((sum, inv) => {
          const t = calculateDocumentTotals(inv.items);
          return sum + t.total_milli;
        }, 0);
    });

    const receivedPerMonth = months.map((m) => {
      return payments
        .filter((p) => (p.date || '').slice(0, 7) === m)
        .reduce((sum, p) => sum + p.amount_milli, 0);
    });

    // Proportional status distribution
    const totalIssuedN = issuedInvoices.length || 1;
    const statusDist = ['paid', 'partial', 'sent', 'unpaid', 'overdue'].map((s) => ({
      status: s,
      count: invoiceStatusCounts[s]?.count || 0,
      total_milli: invoiceStatusCounts[s]?.total_milli || 0,
      pct: Math.round(((invoiceStatusCounts[s]?.count || 0) / totalIssuedN) * 100),
    }));

    // Combined top 8 recent transactions feed matching prototype line 576
    const paymentTx = payments.map((p: any) => {
      const inv = p.invoice_id;
      const cust = inv?.customer_id;
      return {
        date: p.date,
        kind: 'Payment' as const,
        ref: inv?.number || 'Invoice',
        customerName: cust?.name || 'Customer',
        customerId: cust?._id?.toString() || '',
        amt: p.amount_milli,
        cur: inv?.currency || 'USD',
        href: `#receipt-${p.receipt_id || p._id}`,
        sub: p.method || 'cash',
      };
    });

    const invoiceTx = invoiceFinList.map(({ invoice: inv, fin, status }) => {
      const cust: any = inv.customer_id;
      return {
        date: inv.date,
        kind: 'Invoice' as const,
        ref: inv.number || 'Draft',
        customerName: cust?.name || 'Customer',
        customerId: cust?._id?.toString() || '',
        amt: fin.total_milli,
        cur: inv.currency || 'USD',
        href: `#invoice-${inv._id}`,
        sub: status,
      };
    });

    const quoteTx = quotations
      .filter((q) => q.state !== 'draft')
      .map((q: any) => {
        const cust: any = q.customer_id;
        const totals = calculateDocumentTotals(q.items);
        return {
          date: q.date,
          kind: 'Quotation' as const,
          ref: q.number,
          customerName: cust?.name || 'Customer',
          customerId: cust?._id?.toString() || '',
          amt: totals.total_milli,
          cur: q.currency || 'USD',
          href: `#quote-${q._id}`,
          sub: q.state,
        };
      });

    const recentTransactions = [...paymentTx, ...invoiceTx, ...quoteTx]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    res.status(200).json({
      success: true,
      summary: {
        kpis: {
          totalQuotes,
          winRate,
          issuedInvoices: issuedInvoices.length,
          draftCount,
          cancelledCount,
          received: totalReceivedMilli,
          thisMonth: thisMonthReceivedMilli,
          outstanding: totalOutstandingMilli,
          openInvoicesCount,
          overdueAmt: totalOverdueMilli,
          overdueCount,
        },
        revenueData: {
          months,
          invoiced: invoicedPerMonth,
          received: receivedPerMonth,
        },
        statusDist,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};

