import React, { useState } from 'react';
import {
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  TODAY,
  recordPayment,
  MockReceipt,
} from '../../lib/mockData';
import { formatMoney, toMilli } from '../../lib/formatters';
import { IconCash } from '../../components/icons';

interface PaymentModalContentProps {
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
    (i) => i.state === 'issued' && i.balance_milli > 0
  ).sort((a, b) => a.due_date.localeCompare(b.due_date));

  const [selectedInvId, setSelectedInvId] = useState<string>(
    initialInvoiceId || (openInvoices[0]?.id ?? '')
  );

  const selectedInvoice = MOCK_INVOICES.find((i) => i.id === selectedInvId);

  const initialAmountStr = selectedInvoice
    ? (selectedInvoice.balance_milli / 1000).toFixed(2)
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
      setAmountStr((inv.balance_milli / 1000).toFixed(2));
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

    const amtMilli = toMilli(amountStr);
    const ref = reference.trim();

    if (!(amtMilli > 0)) {
      setErrorMsg('Enter an amount greater than zero.');
      return;
    }

    if (amtMilli > selectedInvoice.balance_milli) {
      setErrorMsg(
        `That's more than the outstanding ${formatMoney(
          selectedInvoice.balance_milli,
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        {/* Invoice Picker */}
        <div className="field wide">
          <label htmlFor="pInv">Invoice</label>
          <select
            id="pInv"
            className="sel"
            disabled={!!initialInvoiceId}
            value={selectedInvId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
          >
            {openInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.number} · {inv.customerName} · balance{' '}
                {formatMoney(inv.balance_milli, inv.currency)}
              </option>
            ))}
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
          {selectedInvoice && (
            <span className="hint" id="pHint">
              Outstanding: {formatMoney(selectedInvoice.balance_milli, selectedInvoice.currency)}.
              Enter less for a partial payment.
            </span>
          )}
        </div>

        {/* Payment Date */}
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

        {/* Payment Method */}
        <div className="field">
          <label htmlFor="pMethod">Method</label>
          <select
            id="pMethod"
            className="sel"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="mobile">Mobile money</option>
            <option value="bank">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="card">Credit / debit card</option>
          </select>
        </div>

        {/* Reference */}
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

      {/* Error Message */}
      {errorMsg && (
        <span className="err-msg" style={{ display: 'block', marginTop: 12 }}>
          {errorMsg}
        </span>
      )}

      {/* Footer Actions */}
      <div className="modal-foot" style={{ marginTop: 20, paddingBottom: 0 }}>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary"
          id="pSave"
          disabled={isSubmitting}
        >
          <IconCash size={16} />
          Record &amp; issue receipt
        </button>
      </div>
    </form>
  );
};

