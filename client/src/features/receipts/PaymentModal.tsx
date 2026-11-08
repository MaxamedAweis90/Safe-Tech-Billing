import React, { useState, useEffect, useRef } from 'react';
import {
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  TODAY,
  invFin,
  getCustomerById,
  recordPayment,
  MockReceipt,
  MockInvoice,
} from '../../lib/mockData';
import { formatMoney, toMilli } from '../../lib/formatters';
import { IconCash } from '../../components/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { openModal, closeModal, toast } from '../../store/useUIStore';
import { useInvoices } from '../../hooks/useInvoices';
import { useRecordPayment } from '../../hooks/useReceipts';

export const PAYMENT_METHODS: Record<string, string> = {
  mobile: 'Mobile money',
  cash: 'Cash',
  bank: 'Bank transfer',
  card: 'Card',
};

export interface PaymentModalContentProps {
  initialInvoiceId?: string | null;
  onSuccess: (receipt: MockReceipt) => void;
  onCancel: () => void;
}

export const PaymentModalContent: React.FC<PaymentModalContentProps> = ({
  initialInvoiceId,
  onSuccess,
  onCancel,
}) => {
  const { data: invoicesData } = useInvoices();
  const paymentMutation = useRecordPayment();

  const liveOpen = (invoicesData?.invoices || [])
    .filter((inv) => inv.state === 'issued' && (inv.balance_milli ?? 0) > 0)
    .map((inv) => {
      const custObj: any = inv.customer_id;
      return {
        id: inv._id || inv.id || '',
        number: inv.number,
        customerId: typeof custObj === 'object' ? custObj?._id || custObj?.id : custObj || '',
        customerName: inv.customerName || (typeof custObj === 'object' ? custObj?.name : 'Customer'),
        date: inv.date,
        due: inv.due || '',
        due_date: inv.due || '',
        termsDays: inv.terms_days ?? 30,
        state: inv.state,
        status: (inv.status as any) || 'unpaid',
        currency: inv.currency || 'USD',
        items: (inv.items || []).map((it: any) => ({
          desc: it.desc,
          qty: it.qty,
          price: it.price_milli ?? 0,
          disc: it.disc_pct ?? 0,
          taxRate: it.tax_rate ?? 0,
          taxName: it.tax_name ?? '',
        })),
        terms: inv.terms || '',
        notes: inv.notes || '',
        total_milli: inv.total_milli || 0,
        paid_milli: inv.paid_milli || 0,
        credited_milli: inv.credited_milli || 0,
        balance_milli: inv.balance_milli ?? 0,
      } as MockInvoice;
    });

  const isDemo = Boolean(useAuthStore.getState().user?.isDemo);
  const openInvoices = (liveOpen.length > 0
    ? liveOpen
    : isDemo
    ? MOCK_INVOICES.filter((i) => i.state === 'issued' && invFin(i).balance > 0)
    : []
  ).sort((a, b) => (a.due || a.due_date || '').localeCompare(b.due || b.due_date || ''));

  const [selectedInvId, setSelectedInvId] = useState<string>(() => {
    if (initialInvoiceId && openInvoices.some((i) => i.id === initialInvoiceId)) {
      return initialInvoiceId;
    }
    return openInvoices[0]?.id ?? '';
  });

  useEffect(() => {
    if (initialInvoiceId && openInvoices.some((i) => i.id === initialInvoiceId)) {
      setSelectedInvId(initialInvoiceId);
      const inv = openInvoices.find((i) => i.id === initialInvoiceId);
      if (inv) {
        const f = invFin(inv);
        setAmountStr((f.balance / 1000).toFixed(inv.currency === 'SOS' ? 0 : 2));
      }
    }
  }, [initialInvoiceId, openInvoices]);

  const selectedInvoice = openInvoices.find((i) => i.id === selectedInvId) || openInvoices[0];
  const fin = selectedInvoice ? invFin(selectedInvoice) : null;

  const initialAmountStr = fin
    ? (fin.balance / 1000).toFixed(selectedInvoice?.currency === 'SOS' ? 0 : 2)
    : '';

  const [amountStr, setAmountStr] = useState<string>(initialAmountStr);
  const [date, setDate] = useState<string>(TODAY);
  const [method, setMethod] = useState<string>('mobile');
  const [reference, setReference] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const idempotencyKeyRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`
  );

  // Handle switching invoice
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvId(invId);
    const inv = openInvoices.find((i) => i.id === invId);
    if (inv) {
      const f = invFin(inv);
      setAmountStr((f.balance / 1000).toFixed(inv.currency === 'SOS' ? 0 : 2));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedInvoice) {
      setErrorMsg('Please select a valid open invoice.');
      return;
    }

    const currentFin = invFin(selectedInvoice);
    const amtMilli = toMilli(amountStr);
    const ref = reference.trim();

    if (!(amtMilli > 0)) {
      setErrorMsg('Enter an amount greater than zero.');
      return;
    }

    if (amtMilli > currentFin.balance) {
      setErrorMsg(
        `That's more than the outstanding ${formatMoney(
          currentFin.balance,
          selectedInvoice.currency
        )}. Overpayments need a credit-handling process, so record the balance only.`
      );
      return;
    }

    if (!date || date > TODAY) {
      setErrorMsg("The payment date can't be in the future.");
      return;
    }

    if (date < selectedInvoice.date) {
      setErrorMsg("The payment date can't be before the invoice date.");
      return;
    }

    if (method !== 'cash' && !ref) {
      setErrorMsg('Add the transaction reference for this payment method.');
      return;
    }

    if (
      ref &&
      MOCK_PAYMENTS.some(
        (p) => p.reference && p.reference.toLowerCase() === ref.toLowerCase()
      )
    ) {
      setErrorMsg(
        `Reference ${ref} is already recorded. Each payment gets exactly one receipt.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        amount_milli: amtMilli,
        method: method as any,
        reference: ref,
        date,
        idempotencyKey: idempotencyKeyRef.current,
      });

      let localReceipt: any;
      try {
        localReceipt = recordPayment({
          invoiceId: selectedInvoice.id,
          amount_milli: amtMilli,
          date,
          method,
          reference: ref,
        });
      } catch {
        localReceipt = {
          id: res.receipt._id || res.receipt.id,
          number: res.receipt.number,
          date,
          amount_milli: amtMilli,
        };
      }

      onSuccess(res?.receipt ? ({
        id: res.receipt._id || res.receipt.id || localReceipt.id,
        number: res.receipt.number || localReceipt.number,
        invoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customerId,
        amount_milli: amtMilli,
        date,
        method,
        reference: ref,
        balance_after: res.receipt.balance_after_milli ?? 0,
        prev_paid: res.receipt.prev_paid_milli ?? 0,
        invoice_total: res.receipt.invoice_total_milli ?? selectedInvoice.total_milli,
        currency: selectedInvoice.currency,
      } as any) : localReceipt);
    } catch {
      try {
        const receipt = recordPayment({
          invoiceId: selectedInvoice.id,
          amount_milli: amtMilli,
          date,
          method,
          reference: ref,
        });
        onSuccess(receipt);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to record payment');
        setIsSubmitting(false);
      }
    }
  };

  if (!openInvoices.length) {
    return (
      <div style={{ padding: '16px 0', color: 'var(--muted)' }}>
        There are no invoices with an outstanding balance.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        {/* Invoice Picker */}
        <div className="field wide">
          <label htmlFor="pInv">Invoice</label>
          <select
            id="pInv"
            className="sel"
            disabled={Boolean(initialInvoiceId)}
            value={selectedInvId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
          >
            {openInvoices.map((inv) => {
              const f = invFin(inv);
              const cust = getCustomerById(inv.customerId);
              return (
                <option key={inv.id} value={inv.id}>
                  {inv.number} · {cust?.name || inv.customerName} · balance{' '}
                  {formatMoney(f.balance, inv.currency)}
                </option>
              );
            })}
          </select>
        </div>

        {/* Amount Input */}
        <div className="field">
          <label htmlFor="pAmt">Amount received</label>
          <input
            id="pAmt"
            className="inp"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => {
              setAmountStr(e.target.value);
              setErrorMsg('');
            }}
          />
          {selectedInvoice && fin && (
            <span className="hint" id="pHint">
              Outstanding: {formatMoney(fin.balance, selectedInvoice.currency)}.
              Enter less for a partial payment.
            </span>
          )}
        </div>

        {/* Payment Date Input */}
        <div className="field">
          <label htmlFor="pDate">Payment date</label>
          <input
            id="pDate"
            type="date"
            className="inp"
            value={date}
            max={TODAY}
            onChange={(e) => {
              setDate(e.target.value);
              setErrorMsg('');
            }}
          />
        </div>

        {/* Payment Method Selector */}
        <div className="field">
          <label htmlFor="pMethod">Method</label>
          <select
            id="pMethod"
            className="sel"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setErrorMsg('');
            }}
          >
            {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Reference Input */}
        <div className="field">
          <label htmlFor="pRef">Reference number</label>
          <input
            id="pRef"
            className="inp"
            placeholder="e.g. EVC-77219005"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              setErrorMsg('');
            }}
          />
          <span className="hint">Required for bank, mobile money and card</span>
        </div>
      </div>

      {/* Validation Error Message matching prototype `#pErr` */}
      {errorMsg && (
        <span
          className="err-msg"
          id="pErr"
          style={{ display: 'block', marginTop: 12 }}
        >
          {errorMsg}
        </span>
      )}

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid var(--line)',
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary"
          id="pSave"
          disabled={isSubmitting}
        >
          <IconCash size={15} />
          {isSubmitting ? 'Recording...' : 'Record & issue receipt'}
        </button>
      </div>
    </form>
  );
};

/**
 * Universal payment modal trigger matching prototype `paymentModal(invId)`.
 */
export function openPaymentModal(
  initialInvoiceId?: string | null,
  onPaymentSuccess?: (receipt: MockReceipt) => void
) {
  const { can } = useAuthStore.getState();
  if (!can('payments')) {
    toast('Accountant or Administrator role required to record payments.', true);
    return;
  }

  openModal({
    title: 'Record payment',
    wide: true,
    body: (
      <PaymentModalContent
        initialInvoiceId={initialInvoiceId}
        onSuccess={(receipt) => {
          closeModal();
          toast(`Receipt ${receipt.number} issued`);
          useNavStore.getState().setSelectedRecord('receipts', receipt.id);
          if (onPaymentSuccess) onPaymentSuccess(receipt);
        }}
        onCancel={closeModal}
      />
    ),
  });
}

