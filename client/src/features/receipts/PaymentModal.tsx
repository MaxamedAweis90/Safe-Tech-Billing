import React, { useState } from 'react';
import {
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  TODAY,
  invFin,
  getCustomerById,
  recordPayment,
  MockReceipt,
} from '../../lib/mockData';
import { formatMoney, toMilli } from '../../lib/formatters';
import { IconCash } from '../../components/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { openModal, closeModal, toast } from '../../store/useUIStore';

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
  const openInvoices = MOCK_INVOICES.filter(
    (i) => i.state === 'issued' && invFin(i).balance > 0
  ).sort((a, b) => (a.due || a.due_date || '').localeCompare(b.due || b.due_date || ''));

  const [selectedInvId, setSelectedInvId] = useState<string>(() => {
    if (initialInvoiceId && openInvoices.some((i) => i.id === initialInvoiceId)) {
      return initialInvoiceId;
    }
    return openInvoices[0]?.id ?? '';
  });

  const selectedInvoice = MOCK_INVOICES.find((i) => i.id === selectedInvId);
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

  // Handle switching invoice
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvId(invId);
    const inv = MOCK_INVOICES.find((i) => i.id === invId);
    if (inv) {
      const f = invFin(inv);
      setAmountStr((f.balance / 1000).toFixed(inv.currency === 'SOS' ? 0 : 2));
      setErrorMsg('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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

  const openInvoices = MOCK_INVOICES.filter(
    (i) => i.state === 'issued' && invFin(i).balance > 0
  );
  if (!openInvoices.length) {
    toast('There are no invoices with an outstanding balance.');
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

