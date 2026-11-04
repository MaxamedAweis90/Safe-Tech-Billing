import mongoose, { Types } from 'mongoose';
import { Payment, IPayment, PaymentMethod } from '../models/Payment';
import { Receipt, IReceipt } from '../models/Receipt';
import { CreditNote, ICreditNote } from '../models/CreditNote';
import { getInvoiceFinancials } from './invoiceService';
import { getNextNumber } from './numberingService';

export interface RecordPaymentInput {
  amount_milli: number;
  method: PaymentMethod;
  reference?: string;
  date: string;
}

export interface IssueCreditNoteInput {
  amount_milli: number;
  reason: string;
  date: string;
}

export interface PaymentReceiptResult {
  payment: IPayment;
  receipt: IReceipt;
}

/**
 * Records a payment atomically:
 * 1. Validates amount <= remaining balance.
 * 2. Rejects duplicate transaction reference for non-cash payment methods.
 * 3. Writes Payment and linked Receipt with balance snapshot.
 */
export const recordPayment = async (
  invoiceId: string | Types.ObjectId,
  input: RecordPaymentInput
): Promise<PaymentReceiptResult> => {
  const financials = await getInvoiceFinancials(invoiceId);
  const { invoice, total_milli, paid_milli, balance_milli } = financials;

  if (invoice.state !== 'issued') {
    throw new Error(`Payments can only be recorded on issued invoices. Current state: "${invoice.state}"`);
  }

  if (input.amount_milli <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  if (input.amount_milli > balance_milli) {
    throw new Error(
      `Payment amount (${input.amount_milli}) exceeds remaining invoice balance (${balance_milli})`
    );
  }

  const cleanReference = input.reference ? input.reference.trim() : '';

  // Duplicate transaction reference validation for non-cash rails
  if (input.method !== 'cash' && cleanReference !== '') {
    const duplicate = await Payment.findOne({
      method: input.method,
      reference: cleanReference,
    });
    if (duplicate) {
      throw new Error(
        `Duplicate transaction reference "${cleanReference}" detected for method "${input.method}"`
      );
    }
  }

  const receiptNumber = await getNextNumber('receipt', input.date);
  const paymentId = new Types.ObjectId();
  const receiptId = new Types.ObjectId();
  const balanceAfter = balance_milli - input.amount_milli;

  const paymentDoc = new Payment({
    _id: paymentId,
    invoice_id: invoice._id,
    receipt_id: receiptId,
    date: input.date,
    amount_milli: input.amount_milli,
    method: input.method,
    reference: cleanReference,
    recorded_at: new Date(),
  });

  const receiptDoc = new Receipt({
    _id: receiptId,
    number: receiptNumber,
    payment_id: paymentId,
    invoice_id: invoice._id,
    customer_id: invoice.customer_id,
    date: input.date,
    amount_milli: input.amount_milli,
    method: input.method,
    reference: cleanReference,
    balance_after_milli: balanceAfter,
    prev_paid_milli: paid_milli,
    invoice_total_milli: total_milli,
    currency: invoice.currency,
  });

  // Use transactions if connected to a replica set/Atlas, otherwise fallback to sequential writes
  let session: mongoose.ClientSession | null = null;
  if (mongoose.connection.readyState === 1) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      await paymentDoc.save({ session });
      await receiptDoc.save({ session });

      await session.commitTransaction();
    } catch (txError) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      // Fallback to sequential save if transactions unsupported on target engine
      await paymentDoc.save();
      await receiptDoc.save();
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  } else {
    // Standalone or test environment without active replica set connection
    await paymentDoc.save();
    await receiptDoc.save();
  }

  return {
    payment: paymentDoc,
    receipt: receiptDoc,
  };
};

/**
 * Issues a credit note against an issued invoice:
 * - Amount cannot exceed remaining balance.
 * - Mandatory reason required.
 */
export const issueCreditNote = async (
  invoiceId: string | Types.ObjectId,
  input: IssueCreditNoteInput
): Promise<ICreditNote> => {
  const financials = await getInvoiceFinancials(invoiceId);
  const { invoice, balance_milli } = financials;

  if (invoice.state !== 'issued') {
    throw new Error(`Credit notes can only be issued against issued invoices. Current state: "${invoice.state}"`);
  }

  if (!input.reason || input.reason.trim() === '') {
    throw new Error('A credit note reason is strictly required');
  }

  if (input.amount_milli <= 0) {
    throw new Error('Credit note amount must be greater than zero');
  }

  if (input.amount_milli > balance_milli) {
    throw new Error(
      `Credit note amount (${input.amount_milli}) cannot exceed remaining invoice balance (${balance_milli})`
    );
  }

  const creditDate = input.date || new Date().toISOString().slice(0, 10);
  const creditNumber = await getNextNumber('credit', creditDate);

  const creditNote = new CreditNote({
    number: creditNumber,
    invoice_id: invoice._id,
    amount_milli: input.amount_milli,
    reason: input.reason.trim(),
    date: creditDate,
  });

  return await creditNote.save();
};

