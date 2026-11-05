import React, { useState } from "react";
import { SkeletonBox } from "skullet/react";
import { Icon } from "../../components/icons";
import { ReceiptDetailView } from "./ReceiptDetailView";
import { openPaymentModal, PAYMENT_METHODS } from "./PaymentModal";
import {
  MOCK_RECEIPTS,
  getInvoiceById,
  getCustomerById,
  MockReceipt,
} from "../../lib/mockData";
import { fmtD, formatMoney } from "../../lib/formatters";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavStore } from "../../store/useNavStore";
import { useReceipts } from "../../hooks/useReceipts";

const FILTER_METHODS = ["all", "cash", "bank", "mobile", "card"];

export const ReceiptsView: React.FC = () => {
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { can, user } = useAuthStore();
  const { selectedRecordId, setSelectedRecord } = useNavStore();

  const isDemo = user?.isDemo === true;

  const { data: apiData, isLoading } = useReceipts({
    method: methodFilter === "all" ? undefined : methodFilter,
    q: searchTerm.trim() || undefined,
  });

  // If a receipt is selected, render the dedicated A4 Receipt Detail View
  if (selectedRecordId) {
    return (
      <ReceiptDetailView
        receiptId={selectedRecordId}
        onBack={() => setSelectedRecord("receipts", null)}
        onNavigateInvoice={(invId) => setSelectedRecord("invoices", invId)}
        onNavigateCustomer={(custId) => setSelectedRecord("customers", custId)}
      />
    );
  }

  const hasLiveReceipts = Boolean(
    apiData?.receipts && apiData.receipts.length > 0,
  );

  const liveReceipts: MockReceipt[] =
    hasLiveReceipts && apiData
      ? apiData.receipts.map((r: any) => {
          const custObj = r.customer_id;
          const custId =
            typeof custObj === "object" ? custObj?._id || custObj?.id : custObj;
          const custName =
            r.customerName ||
            (typeof custObj === "object" ? custObj?.name : "Customer");
          const invObj = r.invoice_id;
          const invId =
            typeof invObj === "object" ? invObj?._id || invObj?.id : invObj;
          const invNum =
            r.invoiceNumber ||
            (typeof invObj === "object" ? invObj?.number : undefined);

          return {
            id: r._id || r.id,
            number: r.number,
            date: r.date,
            customerId: custId,
            customerName: custName,
            invoiceId: invId,
            invoiceNumber: invNum,
            amount_milli: r.amount_milli,
            amount: r.amount_milli,
            currency: r.currency || "USD",
            method: r.method,
            reference: r.reference || "",
            balanceAfter_milli: r.balance_after_milli ?? r.balance_after,
            balanceAfter: r.balance_after_milli ?? r.balance_after,
            prevPaid: r.prev_paid_milli ?? r.prev_paid,
            invoiceTotal: r.invoice_total_milli ?? r.invoice_total,
          } as MockReceipt;
        })
      : isDemo
      ? MOCK_RECEIPTS
      : [];

  // Filter and sort receipts matching prototype line 631
  const filteredReceipts = liveReceipts
    .filter((r) => {
      return (
        methodFilter === "all" ||
        r.method.toLowerCase() === methodFilter.toLowerCase()
      );
    })
    .filter((r) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const linkedInv = getInvoiceById(r.invoiceId);
      const invNum = linkedInv?.number || r.invoiceNumber || "";
      const cust = getCustomerById(r.customerId);
      const custName = cust?.name || r.customerName || "";
      const ref = r.reference || "";
      return `${r.number} ${invNum} ${custName} ${ref}`
        .toLowerCase()
        .includes(q);
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.number.localeCompare(a.number),
    );

  const totalAmount = filteredReceipts.reduce(
    (sum, r) => sum + (r.amount_milli ?? r.amount ?? 0),
    0,
  );

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Receipts</h1>
          <p>
            A receipt is issued automatically for every recorded payment, one
            per payment.
          </p>
        </div>
        <div className="actions">
          {can("payments") && (
            <button
              type="button"
              className="btn primary"
              onClick={() => openPaymentModal(null)}
            >
              <Icon name="cash" size={15} />
              Record payment
            </button>
          )}
        </div>
      </div>

      {/* Main Panel with Filter Bar & Table */}
      <section className="panel">
        <div className="filters">
          {/* Method Filter Segmented Control matching prototype `.seg` */}
          <div className="seg" data-seg="receipts">
            {FILTER_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                className={methodFilter === m ? "on" : ""}
                onClick={() => setMethodFilter(m)}
              >
                {m === "all" ? "All methods" : PAYMENT_METHODS[m] || m}
              </button>
            ))}
          </div>

          {/* Interactive Search Box */}
          <input
            className="inp"
            style={{ flex: 1, minWidth: 160, maxWidth: 280 }}
            placeholder="Receipt, invoice, customer or reference"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Real-time Summary Count and Amount */}
          <span
            className="num"
            style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13 }}
          >
            {filteredReceipts.length} receipts ·{" "}
            {formatMoney(totalAmount, "USD")}
          </span>
        </div>

        {/* Ledger Table */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="r">Amount</th>
                <th className="r">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !hasLiveReceipts ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <SkeletonBox height={14} width={80} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={75} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={130} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={65} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={80} />
                    </td>
                    <td>
                      <SkeletonBox height={14} width={90} />
                    </td>
                    <td className="r">
                      <SkeletonBox
                        height={14}
                        width={70}
                        style={{ marginLeft: "auto" }}
                      />
                    </td>
                    <td className="r">
                      <SkeletonBox
                        height={14}
                        width={60}
                        style={{ marginLeft: "auto" }}
                      />
                    </td>
                  </tr>
                ))
              ) : filteredReceipts.length > 0 ? (
                filteredReceipts.map((r) => {
                  const linkedInv = getInvoiceById(r.invoiceId);
                  const invNum = linkedInv?.number || r.invoiceNumber;
                  const cust = getCustomerById(r.customerId);
                  const custName = cust?.name || r.customerName;
                  const amt = r.amount_milli ?? r.amount ?? 0;
                  const balAfter = r.balanceAfter_milli ?? r.balanceAfter ?? 0;

                  return (
                    <tr
                      key={r.id}
                      className="link"
                      onClick={() => setSelectedRecord("receipts", r.id)}
                    >
                      <td
                        className="mono strong"
                        style={{ color: "var(--accent)" }}
                      >
                        {r.number}
                      </td>
                      <td className="muted">{fmtD(r.date)}</td>
                      <td>{custName}</td>
                      <td
                        className="mono font-semibold"
                        style={{ color: "var(--accent)" }}
                      >
                        {invNum}
                      </td>
                      <td>{PAYMENT_METHODS[r.method] || r.method}</td>
                      <td className="mono muted">{r.reference || "—"}</td>
                      <td
                        className="r strong font-mono"
                        style={{ color: "var(--ok)" }}
                      >
                        {formatMoney(amt, r.currency)}
                      </td>
                      <td className="r muted font-mono">
                        {formatMoney(balAfter, r.currency)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      No receipts yet. Record a payment against an invoice to
                      issue one.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
