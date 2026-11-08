import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonBox } from 'skullet/react';
import { useAuthStore, ROLES } from '../../store/useAuthStore';
import { useTrash, useRestoreTrash, usePurgeTrash, useEmptyTrash } from '../../hooks/useTrash';
import { fmtTs, formatMoney } from '../../lib/formatters';
import { confirmBox } from '../../store/useUIStore';
import { TrashedItem } from '../../types';
import { Icon } from '../../components/icons';

type TrashTab = 'all' | 'quotation' | 'invoice' | 'receipt' | 'customer';

export interface TrashViewProps {
  onClose?: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTabFilter] = useState<TrashTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { can, role } = useAuthStore();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  // Keyboard Escape listener to close full screen popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data, isLoading } = useTrash({
    type: activeTab,
    q: searchQuery.trim() || undefined,
  });

  const restoreMutation = useRestoreTrash();
  const purgeMutation = usePurgeTrash();
  const emptyMutation = useEmptyTrash();

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

  if (!can('trash')) {
    const roleLabel = ROLES[role]?.label || role;
    return (
      <div
        className="trash-fullscreen-popup"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#0B0F19',
          color: '#F8FAFC',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div className="panel" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ color: '#EF4444', marginBottom: 12 }}>
            <Icon name="trash" size={36} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--muted, #94A3B8)', fontSize: '13.5px', marginBottom: 20 }}>
            The Trash &amp; Recycle Bin is only accessible to company administrators. Your current role is {roleLabel}.
          </p>
          <button type="button" className="btn primary" onClick={handleClose} style={{ margin: '0 auto' }}>
            Return to application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="trash-fullscreen-popup"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0B0F19',
        color: '#F8FAFC',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid #1E293B',
          backgroundColor: '#0F172A',
          flexShrink: 0,
        }}
      >
        {/* Top Left: X ESC Button */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#293548')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
            title="Close trash view (Esc)"
          >
            <Icon name="x" size={16} />
            <span>Close</span>
            <kbd
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#0F172A',
                border: '1px solid #475569',
                color: '#94A3B8',
                fontFamily: 'monospace',
                marginLeft: '4px',
              }}
            >
              ESC
            </kbd>
          </button>
        </div>

        {/* Top Right: Trash Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'right' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94A3B8',
                }}
              >
                Safe Tech System
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  fontWeight: 600,
                }}
              >
                {counts.all} in trash
              </span>
            </div>
            <h1
              style={{
                margin: '2px 0 0 0',
                fontSize: '20px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              Trash &amp; Recycle Bin
            </h1>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
            }}
          >
            <Icon name="trash" size={20} />
          </div>
        </div>
      </header>

      {/* Main Body (Scrollable) */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Controls Bar: Filter Tabs & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTabFilter('all')}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '6px',
                border: activeTab === 'all' ? '1px solid #3B82F6' : '1px solid #243042',
                backgroundColor: activeTab === 'all' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'all' ? '#FFFFFF' : '#94A3B8',
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
                border: activeTab === 'quotation' ? '1px solid #3B82F6' : '1px solid #243042',
                backgroundColor: activeTab === 'quotation' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'quotation' ? '#FFFFFF' : '#94A3B8',
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
                border: activeTab === 'invoice' ? '1px solid #3B82F6' : '1px solid #243042',
                backgroundColor: activeTab === 'invoice' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'invoice' ? '#FFFFFF' : '#94A3B8',
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
                border: activeTab === 'receipt' ? '1px solid #3B82F6' : '1px solid #243042',
                backgroundColor: activeTab === 'receipt' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'receipt' ? '#FFFFFF' : '#94A3B8',
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
                border: activeTab === 'customer' ? '1px solid #3B82F6' : '1px solid #243042',
                backgroundColor: activeTab === 'customer' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'customer' ? '#FFFFFF' : '#94A3B8',
                cursor: 'pointer',
              }}
            >
              Customers ({counts.customer})
            </button>
          </div>

          {/* Action: Empty Trash */}
          <div>
            <button
              type="button"
              className="btn danger"
              onClick={handleEmptyTrash}
              disabled={counts.all === 0 || emptyMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                fontSize: '13px',
              }}
            >
              <Icon name="trash" size={14} />
              <span>{emptyMutation.isPending ? 'Emptying…' : 'Empty trash'}</span>
            </button>
          </div>
        </div>

        {/* Search Panel & Records Table */}
        <section className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#131B2A' }}>
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

          <div className="tbl-wrap" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Type</th>
                  <th style={{ width: 140 }}>Reference</th>
                  <th>Item / Details</th>
                  <th style={{ width: 170 }}>Deleted When</th>
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
                    <td colSpan={6} className="empty" style={{ padding: '48px 16px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--muted, #94A3B8)', fontSize: '14px' }}>
                        {searchQuery.trim()
                          ? 'No deleted items matching your filter.'
                          : 'Trash is empty. No deleted records found.'}
                      </div>
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
                        <div style={{ fontWeight: 500, color: '#F8FAFC' }}>{item.nameOrTitle}</div>
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
      </main>
    </div>
  );
};

export default TrashView;
