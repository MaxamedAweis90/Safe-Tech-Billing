import { Types } from 'mongoose';
import { Quotation, IQuotation } from '../models/Quotation';
import { Invoice, IInvoice } from '../models/Invoice';
import { Customer, ICustomer } from '../models/Customer';
import { Payment, IPayment } from '../models/Payment';
import { Receipt, IReceipt } from '../models/Receipt';

export type TrashEntityType = 'quotation' | 'invoice' | 'receipt' | 'customer';

export interface TrashedItem {
  id: string;
  type: TrashEntityType;
  numberOrCode: string;
  nameOrTitle: string;
  deletedAt: Date;
  deletedBy?: {
    id: string;
    name?: string;
  } | null;
  amount_milli?: number;
  currency?: string;
  statusOrState?: string;
}

export interface TrashListResult {
  items: TrashedItem[];
  counts: {
    all: number;
    quotation: number;
    invoice: number;
    receipt: number;
    customer: number;
  };
  total: number;
}

/**
 * Lists soft-deleted items strictly scoped to the tenant company.
 */
export const listTrash = async (
  companyId: string | Types.ObjectId | null,
  options: {
    type?: string;
    q?: string;
    limit?: number;
    skip?: number;
  } = {}
): Promise<TrashListResult> => {
  const baseFilter: Record<string, unknown> = {
    companyId: companyId ? new Types.ObjectId(companyId) : null,
    isDeleted: true,
  };

  const [quotes, invoices, receipts, customers] = await Promise.all([
    Quotation.find(baseFilter).populate('customer_id', 'name code').populate('deletedBy', 'name fullName email').sort({ deletedAt: -1 }),
    Invoice.find(baseFilter).populate('customer_id', 'name code').populate('deletedBy', 'name fullName email').sort({ deletedAt: -1 }),
    Receipt.find(baseFilter).populate('customer_id', 'name code').populate('deletedBy', 'name fullName email').sort({ deletedAt: -1 }),
    Customer.find(baseFilter).populate('deletedBy', 'name fullName email').sort({ deletedAt: -1 }),
  ]);

  const items: TrashedItem[] = [];

  for (const q of quotes) {
    const cust: any = q.customer_id;
    const custName = cust?.name || 'Unknown Customer';
    const deletedByUser: any = q.deletedBy;
    items.push({
      id: q._id.toString(),
      type: 'quotation',
      numberOrCode: q.number,
      nameOrTitle: custName,
      deletedAt: q.deletedAt || (q as any).updatedAt || new Date(),
      deletedBy: deletedByUser ? { id: deletedByUser._id?.toString(), name: deletedByUser.fullName || deletedByUser.name } : null,
      currency: q.currency,
      statusOrState: q.state,
    });
  }

  for (const inv of invoices) {
    const cust: any = inv.customer_id;
    const custName = cust?.name || 'Unknown Customer';
    const deletedByUser: any = inv.deletedBy;
    items.push({
      id: inv._id.toString(),
      type: 'invoice',
      numberOrCode: inv.number || 'Draft Invoice',
      nameOrTitle: custName,
      deletedAt: inv.deletedAt || (inv as any).updatedAt || new Date(),
      deletedBy: deletedByUser ? { id: deletedByUser._id?.toString(), name: deletedByUser.fullName || deletedByUser.name } : null,
      currency: inv.currency,
      statusOrState: inv.state,
    });
  }

  for (const rec of receipts) {
    const cust: any = rec.customer_id;
    const custName = cust?.name || 'Customer';
    const deletedByUser: any = rec.deletedBy;
    items.push({
      id: rec._id.toString(),
      type: 'receipt',
      numberOrCode: rec.number,
      nameOrTitle: `${custName} - ${rec.method.toUpperCase()}`,
      deletedAt: rec.deletedAt || (rec as any).updatedAt || new Date(),
      deletedBy: deletedByUser ? { id: deletedByUser._id?.toString(), name: deletedByUser.fullName || deletedByUser.name } : null,
      amount_milli: rec.amount_milli,
      currency: rec.currency,
      statusOrState: rec.method,
    });
  }

  for (const c of customers) {
    const deletedByUser: any = c.deletedBy;
    items.push({
      id: c._id.toString(),
      type: 'customer',
      numberOrCode: String(c.code),
      nameOrTitle: c.name,
      deletedAt: c.deletedAt || (c as any).updatedAt || new Date(),
      deletedBy: deletedByUser ? { id: deletedByUser._id?.toString(), name: deletedByUser.fullName || deletedByUser.name } : null,
      statusOrState: c.phone,
    });
  }

  const counts = {
    all: items.length,
    quotation: quotes.length,
    invoice: invoices.length,
    receipt: receipts.length,
    customer: customers.length,
  };

  // Filter by requested type if specified
  let filtered = items;
  if (options.type && options.type !== 'all') {
    filtered = filtered.filter((i) => i.type === options.type);
  }

  // Filter by search query if specified
  if (options.q && options.q.trim()) {
    const query = options.q.trim().toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.numberOrCode.toLowerCase().includes(query) ||
        i.nameOrTitle.toLowerCase().includes(query)
    );
  }

  // Sort by deletedAt desc
  filtered.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  const limit = options.limit || 50;
  const skip = options.skip || 0;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    items: paginated,
    counts,
    total: filtered.length,
  };
};

/**
 * Restores a soft-deleted item back to active status.
 */
export const restoreItem = async (
  type: TrashEntityType,
  id: string | Types.ObjectId,
  companyId: string | Types.ObjectId | null
): Promise<{ success: boolean; ref: string; detail: string }> => {
  const filter = {
    _id: id,
    companyId: companyId ? new Types.ObjectId(companyId) : null,
    isDeleted: true,
  };

  if (type === 'quotation') {
    const doc = await Quotation.findOne(filter);
    if (!doc) throw new Error('Quotation not found in trash');
    doc.isDeleted = false;
    doc.deletedAt = null;
    doc.deletedBy = null;
    await doc.save();
    return {
      success: true,
      ref: doc.number,
      detail: `Restored quotation ${doc.number} to active records`,
    };
  }

  if (type === 'invoice') {
    const doc = await Invoice.findOne(filter);
    if (!doc) throw new Error('Invoice not found in trash');
    doc.isDeleted = false;
    doc.deletedAt = null;
    doc.deletedBy = null;
    await doc.save();
    return {
      success: true,
      ref: doc.number || doc._id.toString(),
      detail: `Restored invoice ${doc.number || doc._id} to active records`,
    };
  }

  if (type === 'customer') {
    const doc = await Customer.findOne(filter);
    if (!doc) throw new Error('Customer not found in trash');
    doc.isDeleted = false;
    doc.deletedAt = null;
    doc.deletedBy = null;
    await doc.save();
    return {
      success: true,
      ref: String(doc.code),
      detail: `Restored customer ${doc.name} (Code: ${doc.code}) to active records`,
    };
  }

  if (type === 'receipt') {
    const rec = await Receipt.findOne(filter);
    if (!rec) throw new Error('Receipt not found in trash');
    rec.isDeleted = false;
    rec.deletedAt = null;
    rec.deletedBy = null;
    await rec.save();

    // Also un-delete the associated Payment
    if (rec.payment_id) {
      await Payment.updateOne(
        { _id: rec.payment_id },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
      );
    }

    return {
      success: true,
      ref: rec.number,
      detail: `Restored receipt ${rec.number} (${rec.amount_milli} milli) and re-applied payment`,
    };
  }

  throw new Error(`Unsupported entity type: ${type}`);
};

/**
 * Permanently removes a trashed item from the database.
 */
export const purgeItem = async (
  type: TrashEntityType,
  id: string | Types.ObjectId,
  companyId: string | Types.ObjectId | null
): Promise<{ success: boolean; ref: string; detail: string }> => {
  const filter = {
    _id: id,
    companyId: companyId ? new Types.ObjectId(companyId) : null,
    isDeleted: true,
  };

  if (type === 'quotation') {
    const doc = await Quotation.findOne(filter);
    if (!doc) throw new Error('Quotation not found in trash');
    await Quotation.deleteOne({ _id: id });
    return {
      success: true,
      ref: doc.number,
      detail: `Permanently deleted quotation ${doc.number}`,
    };
  }

  if (type === 'invoice') {
    const doc = await Invoice.findOne(filter);
    if (!doc) throw new Error('Invoice not found in trash');
    await Invoice.deleteOne({ _id: id });
    return {
      success: true,
      ref: doc.number || doc._id.toString(),
      detail: `Permanently deleted invoice ${doc.number || doc._id}`,
    };
  }

  if (type === 'customer') {
    const doc = await Customer.findOne(filter);
    if (!doc) throw new Error('Customer not found in trash');
    
    // Check if non-deleted invoices/quotations remain
    const activeInvoices = await Invoice.exists({ customer_id: id, isDeleted: { $ne: true } });
    if (activeInvoices) {
      throw new Error('Cannot permanently purge customer with active invoices. Purge or restore the invoices first.');
    }
    const activeQuotes = await Quotation.exists({ customer_id: id, isDeleted: { $ne: true } });
    if (activeQuotes) {
      throw new Error('Cannot permanently purge customer with active quotations. Purge or restore the quotations first.');
    }

    await Customer.deleteOne({ _id: id });
    return {
      success: true,
      ref: String(doc.code),
      detail: `Permanently deleted customer ${doc.name} (Code: ${doc.code})`,
    };
  }

  if (type === 'receipt') {
    const rec = await Receipt.findOne(filter);
    if (!rec) throw new Error('Receipt not found in trash');
    await Receipt.deleteOne({ _id: id });
    if (rec.payment_id) {
      await Payment.deleteOne({ _id: rec.payment_id });
    }
    return {
      success: true,
      ref: rec.number,
      detail: `Permanently deleted receipt ${rec.number}`,
    };
  }

  throw new Error(`Unsupported entity type: ${type}`);
};

/**
 * Empties all soft-deleted items belonging strictly to the company.
 */
export const emptyTrash = async (
  companyId: string | Types.ObjectId | null
): Promise<{ count: number }> => {
  const filter = {
    companyId: companyId ? new Types.ObjectId(companyId) : null,
    isDeleted: true,
  };

  const [quotesRes, invRes, recRes, payRes, custRes] = await Promise.all([
    Quotation.deleteMany(filter),
    Invoice.deleteMany(filter),
    Receipt.deleteMany(filter),
    Payment.deleteMany(filter),
    Customer.deleteMany(filter),
  ]);

  const count =
    quotesRes.deletedCount +
    invRes.deletedCount +
    recRes.deletedCount +
    custRes.deletedCount;

  return { count };
};

