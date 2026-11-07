import React from 'react';
import { SkeletonBox } from 'skullet/react';
import { Icon } from '../../components/icons';
import { DocumentSheet, DocumentScaleWrapper, downloadPdf } from '../documents';
import { openShareModal } from '../documents/ShareModal';
import {
  MockReceipt,
  getInvoiceById,
  getCustomerById,
  MOCK_RECEIPTS,
} from '../../lib/mockData';
import { formatMoney } from '../../lib/formatters';
import { useNavStore } from '../../store/useNavStore';
import { useAuthStore } from '../../store/useAuthStore';
import { confirmBox } from '../../store/useUIStore';
import { useReceiptDetail, useDeleteReceipt } from '../../hooks/useReceipts';

export interface ReceiptDetailViewProps {
  receiptId?: string;
  receipt?: MockReceipt;
  onBack: () => void;
  onNavigateInvoice?: (invoiceId: string) => void;
  onNavigateCustomer?: (customerId: string) => void;
}

export const ReceiptDetailView: React.FC<ReceiptDetailViewProps> = ({
  receiptId,
  receipt: propReceipt,
  onBack,
  onNavigateInvoice,
  onNavigateCustomer,
}) => {
  const { setSelectedRecord } = useNavStore();
  const { role } = useAuthStore();
  const deleteReceiptMutation = useDeleteReceipt();

  const targetId = receiptId || propReceipt?.id;
  const { data: detailData, isLoading } = useReceiptDetail(targetId);

  const liveReceipt = detailData?.receipt;
  const mockReceipt = propReceipt || (targetId ? MOCK_RECEIPTS.find((r) => r.id === targetId) : undefined);

  if (isLoading && !mockReceipt) {
    return (
      <div className="panel" style={{ padding: 32 }}>
        <SkeletonBox width="50%" height={28} />
        <div style={{ marginTop: 16 }}>
          <SkeletonBox width="100%" height={320} />
        </div>
      </div>
    );
  }

  if (!liveReceipt && !mockReceipt) {
    return (
      <div className="panel">
        <div className="empty">
          Receipt not found.{' '}
          <a
            href="#receipts"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            Back to receipts
          </a>
        </div>
      </div>
    );
  }

  const custObj: any = liveReceipt?.customer_id;
  const custId = typeof custObj === 'object' ? custObj?._id || custObj?.id : custObj;
  const custName = (liveReceipt as any)?.customerName || (typeof custObj === 'object' ? custObj?.name : undefined);
  const custCode = typeof custObj === 'object' ? custObj?.code : undefined;
  const invObj: any = liveReceipt?.invoice_id;
  const invId = typeof invObj === 'object' ? invObj?._id || invObj?.id : invObj;
  const invNumber = typeof invObj === 'object' ? invObj?.number : (liveReceipt as any)?.invoiceNumber;
  const invDate = typeof invObj === 'object' ? invObj?.date : undefined;

  const r: MockReceipt = liveReceipt
    ? {
        id: liveReceipt._id || liveReceipt.id || targetId || '',
        number: liveReceipt.number,
        date: liveReceipt.date,
        customerId: custId || mockReceipt?.customerId || '',
        customerName: custName || mockReceipt?.customerName || 'Customer',
        customerCode: custCode || (mockReceipt as any)?.customerCode,
        invoiceId: invId || mockReceipt?.invoiceId,
        invoiceNumber: invNumber || mockReceipt?.invoiceNumber,
        invoiceDate: invDate || (mockReceipt as any)?.invoiceDate,
        amount_milli: liveReceipt.amount_milli ?? mockReceipt?.amount_milli ?? 0,
        amount: liveReceipt.amount_milli ?? mockReceipt?.amount ?? 0,
        currency: liveReceipt.currency || mockReceipt?.currency || 'USD',
        method: liveReceipt.method || mockReceipt?.method || 'mobile',
        reference: liveReceipt.reference || mockReceipt?.reference || '',
        balanceAfter_milli: liveReceipt.balance_after_milli ?? mockReceipt?.balanceAfter_milli ?? 0,
        balanceAfter: liveReceipt.balance_after_milli ?? mockReceipt?.balanceAfter ?? 0,
        prevPaid: liveReceipt.prev_paid_milli ?? mockReceipt?.prevPaid ?? 0,
        invoiceTotal: liveReceipt.invoice_total_milli ?? mockReceipt?.invoiceTotal ?? 0,
      } as any
    : mockReceipt!;

  const linkedInvoice = r.invoiceId ? getInvoiceById(r.invoiceId) : undefined;
  const customer = getCustomerById(r.customerId);
  const cur = r.currency || 'USD';

  // Share Modal matching prototype lines 881-893
  const handleShareReceipt = () => {
    openShareModal('receipt', r);
  };

  const handleOpenInvoice = () => {
    const navId = linkedInvoice?.id || r.invoiceId;
    if (navId) {
      if (onNavigateInvoice) {
        onNavigateInvoice(navId);
      } else {
        setSelectedRecord('invoices', navId);
      }
    }
  };

  const handleOpenCustomer = () => {
    const navId = customer?.id || r.customerId;
    if (navId) {
      if (onNavigateCustomer) {
        onNavigateCustomer(navId);
      } else {
        setSelectedRecord('customers', navId);
      }
    }
  };

  const handleDeleteReceipt = async () => {
    const confirmed = await confirmBox({
      title: `Move receipt ${r.number} to trash?`,
      text: 'Moving this receipt to trash will void the recorded payment and restore the outstanding balance on the linked invoice. This action is recorded in the company audit trail.',
      ok: 'Void & Move to Trash',
      danger: true,
    });

    if (confirmed && targetId) {
      try {
        await deleteReceiptMutation.mutateAsync(targetId);
        onBack();
      } catch {
        // error handled in mutation
      }
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="crumb">
            <a
              href="#receipts"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Receipts
            </a>{' '}
            / {r.number}
          </div>
          <h1>Receipt {r.number}</h1>
          <p>
            {formatMoney(r.amount_milli ?? r.amount ?? 0, cur)} from{' '}
            <a
              href={`#customer-${r.customerId || customer?.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleOpenCustomer();
              }}
            >
              {r.customerName || customer?.name}
            </a>{' '}
            against invoice{' '}
            <a
              href={`#invoice-${r.invoiceId || linkedInvoice?.id}`}
              className="mono font-semibold"
              style={{ color: 'var(--accent)' }}
              onClick={(e) => {
                e.preventDefault();
                handleOpenInvoice();
              }}
            >
              {r.invoiceNumber || linkedInvoice?.number}
            </a>
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn dl-btn primary"
            onClick={(e) => downloadPdf('receipt', r, e.currentTarget)}
          >
            <Icon name="down" />
            Download PDF
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleShareReceipt}
          >
            <Icon name="send" />
            Share
          </button>
          {role === 'admin' && (
            <button
              type="button"
              className="btn danger"
              onClick={handleDeleteReceipt}
              disabled={deleteReceiptMutation.isPending}
            >
              <Icon name="trash" size={14} />
              <span>{deleteReceiptMutation.isPending ? 'Voiding…' : 'Move to trash'}</span>
            </button>
          )}
          {linkedInvoice && (
            <button
              type="button"
              className="btn"
              onClick={handleOpenInvoice}
            >
              Open invoice
            </button>
          )}
        </div>
      </div>

      {/* Scaled A4 Sheet Canvas */}
      <div style={{ maxWidth: 860 }}>
        <DocumentScaleWrapper>
          <DocumentSheet kind="receipt" document={r} />
        </DocumentScaleWrapper>
      </div>
    </>
  );
};

