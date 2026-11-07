import React, { useState } from 'react';
import { SkeletonBox } from 'skullet/react';
import { useAuthStore, ROLES } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { useTrash, useRestoreTrash, usePurgeTrash, useEmptyTrash } from '../../hooks/useTrash';
import { fmtTs, formatMoney } from '../../lib/formatters';
import { confirmBox } from '../../store/useUIStore';
import { TrashedItem } from '../../types';
import { Icon } from '../../components/icons';

type TrashTab = 'all' | 'quotation' | 'invoice' | 'receipt' | 'customer';

export const TrashView: React.FC = () => {
  const [activeTab, setActiveTabFilter] = useState<TrashTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { can, role } = useAuthStore();
  const { setActiveTab } = useNavStore();

  const { data, isLoading } = useTrash({
    type: activeTab,
    q: searchQuery.trim() || undefined,
  });

  const restoreMutation = useRestoreTrash();
  const purgeMutation = usePurgeTrash();
  const emptyMutation = useEmptyTrash();

  if (!can('trash')) {
    const roleLabel = ROLES[role]?.label || role;
    return (
      <div className="panel">
        <div className="empty">
          That page is only accessible to company administrators. Your current role is {roleLabel}.{' '}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
          >
            Go to dashboard
          </a>.
        </div>
      </div>
    );
  }

  const items = data?.items || [];
  const counts = data?.counts || { all: 0, quotation: 0, invoice: 0, receipt: 0, customer: 0 };

  const handleRestore = async (item: TrashedItem) => {
    try {
      await restoreMutation.mutateAsync({ type: item.type, id: item.id });
    } catch {
      // Error handled by mutation onError toast
    }
  };

  const handlePurge = async (item: TrashedItem) => {
    const confirmed = await confirmBox({
      title: `Permanently delete ${item.numberOrCode}?`,
      text: `Are you sure you want to permanently purge this ${item.type}? This action cannot be undone and will be permanently reported in your company's audit trail.`,
      ok: 'Delete permanently',
      danger: true,
    });

    if (confirmed) {
      try {
        await purgeMutation.mutateAsync({ type: item.type, id: item.id });
      } catch {
        // Error handled by mutation onError toast
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (counts.all === 0) return;

    const confirmed = await confirmBox({
      title: 'Empty all trash?',
      text: `Are you sure you want to permanently purge all ${counts.all} items in your company's trash? This action cannot be reversed and will be reported to your audit trail.`,
      ok: 'Empty trash',
      danger: true,
    });

    if (confirmed) {
      try {
        await emptyMutation.mutateAsync();
      } catch {
        // Error handled by mutation onError toast
      }
    }
  };

  const typeChipClass: Record<string, string> = {
    quotation: 'chip c-blue',
    invoice: 'chip c-purple',
    receipt: 'chip c-teal',
    customer: 'chip c-muted',
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Trash &amp; Recycle Bin</h1>
          <p>
            Soft-deleted records for your organization. Only administrators can review, restore, or permanently purge items.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn danger"
            onClick={handleEmptyTrash}
            disabled={counts.all === 0 || emptyMutation.isPending}
          >
            <Icon name="trash" size={14} />
            <span>{emptyMutation.isPending ? 'Emptying…' : 'Empty trash'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tab-bar" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTabFilter('all')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: activeTab === 'all' ? '1px solid var(--accent, #3B82F6)' : '1px solid var(--line, #243042)',
            backgroundColor: activeTab === 'all' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'all' ? '#FFFFFF' : 'var(--muted, #9AA6BA)',
            cursor: 'pointer',
          }}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'quotation' ? 'active' : ''}`}
          onClick={() => setActiveTabFilter('quotation')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: activeTab === 'quotation' ? '1px solid var(--accent, #3B82F6)' : '1px solid var(--line, #243042)',
            backgroundColor: activeTab === 'quotation' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'quotation' ? '#FFFFFF' : 'var(--muted, #9AA6BA)',
            cursor: 'pointer',
          }}
        >
          Quotations ({counts.quotation})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTabFilter('invoice')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: activeTab === 'invoice' ? '1px solid var(--accent, #3B82F6)' : '1px solid var(--line, #243042)',
            backgroundColor: activeTab === 'invoice' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'invoice' ? '#FFFFFF' : 'var(--muted, #9AA6BA)',
            cursor: 'pointer',
          }}
        >
          Invoices ({counts.invoice})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'receipt' ? 'active' : ''}`}
          onClick={() => setActiveTabFilter('receipt')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: activeTab === 'receipt' ? '1px solid var(--accent, #3B82F6)' : '1px solid var(--line, #243042)',
            backgroundColor: activeTab === 'receipt' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'receipt' ? '#FFFFFF' : 'var(--muted, #9AA6BA)',
            cursor: 'pointer',
          }}
        >
          Receipts ({counts.receipt})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTabFilter('customer')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: activeTab === 'customer' ? '1px solid var(--accent, #3B82F6)' : '1px solid var(--line, #243042)',
            backgroundColor: activeTab === 'customer' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'customer' ? '#FFFFFF' : 'var(--muted, #9AA6BA)',
            cursor: 'pointer',
          }}
        >
          Customers ({counts.customer})
        </button>
      </div>

      <section className="panel">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line, #243042)' }}>
          <input
            type="search"
            placeholder="Filter deleted items by reference, customer name or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '8px 12px',
              fontSize: '13px',
              backgroundColor: '#0F172A',
              border: '1px solid var(--line, #243042)',
              borderRadius: '6px',
              color: '#FFFFFF',
              outline: 'none',
            }}
          />
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Type</th>
                <th style={{ width: 130 }}>Reference</th>
                <th>Item / Details</th>
                <th style={{ width: 160 }}>Deleted When</th>
                <th style={{ width: 150 }}>Deleted By</th>
                <th style={{ width: 170, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td><SkeletonBox width={70} height={20} /></td>
                    <td><SkeletonBox width={90} height={18} /></td>
                    <td><SkeletonBox width={160} height={18} /></td>
                    <td><SkeletonBox width={110} height={18} /></td>
                    <td><SkeletonBox width={90} height={18} /></td>
                    <td style={{ textAlign: 'right' }}><SkeletonBox width={120} height={24} style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    {searchQuery.trim()
                      ? 'No deleted items matching your filter.'
                      : 'Trash is empty. No deleted records found.'}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>
                      <span className={typeChipClass[item.type] || 'chip'}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </td>
                    <td className="mono font-semibold" style={{ color: '#E2E8F0' }}>
                      {item.numberOrCode}
                    </td>
                    <td>
                      <div>{item.nameOrTitle}</div>
                      {item.amount_milli !== undefined && (
                        <div style={{ fontSize: '11.5px', color: 'var(--faint, #6F7B90)', marginTop: 2 }}>
                          Amount: {formatMoney(item.amount_milli, item.currency || 'USD')}
                        </div>
                      )}
                    </td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {fmtTs(item.deletedAt)}
                    </td>
                    <td className="muted">
                      {item.deletedBy?.name || 'Administrator'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => handleRestore(item)}
                        disabled={restoreMutation.isPending || purgeMutation.isPending}
                        style={{ marginRight: 6 }}
                        title="Restore to active records"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        className="btn sm danger"
                        onClick={() => handlePurge(item)}
                        disabled={restoreMutation.isPending || purgeMutation.isPending}
                        title="Permanently purge from database"
                      >
                        Purge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default TrashView;
