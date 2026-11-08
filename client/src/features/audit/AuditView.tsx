import React from 'react';
import { SkeletonBox } from 'skullet/react';
import { MOCK_AUDIT } from '../../lib/mockData';
import { fmtTs } from '../../lib/formatters';
import { useAuthStore, ROLES } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { useAuditLog } from '../../hooks/useAudit';

export const AuditView: React.FC = () => {
  const { can, role } = useAuthStore();
  const { setActiveTab } = useNavStore();

  const { data: apiData, isLoading } = useAuditLog();

  if (!can('audit')) {
    const roleLabel = ROLES[role]?.label || role;
    return (
      <div className="panel">
        <div className="empty">
          That page isn't available for the {roleLabel} role.{' '}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
          >
            Go to the dashboard
          </a>.
        </div>
      </div>
    );
  }

  const isDemo = Boolean(useAuthStore.getState().user?.isDemo);
  const hasLogs = Boolean(apiData?.logs && apiData.logs.length > 0);
  const entries = hasLogs && apiData
    ? apiData.logs.map((a) => ({
        ts: a.ts || (a as any).createdAt,
        user: a.user_name || (a as any).user || 'System',
        role: a.role || 'admin',
        action: a.action,
        ref: a.ref || '',
        detail: a.detail || '',
      }))
    : isDemo
    ? MOCK_AUDIT.slice(0, 200)
    : [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit trail</h1>
          <p>Every financial action, who did it and when. Entries can't be edited or removed.</p>
        </div>
      </div>

      <section className="panel">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Reference</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !hasLogs ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td><SkeletonBox width={110} height={18} /></td>
                    <td>
                      <SkeletonBox width={90} height={16} />
                      <SkeletonBox width={50} height={12} style={{ marginTop: 4 }} />
                    </td>
                    <td><SkeletonBox width={140} height={18} /></td>
                    <td><SkeletonBox width={80} height={18} /></td>
                    <td><SkeletonBox width={160} height={18} /></td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    No audit events recorded yet.
                  </td>
                </tr>
              ) : (
                entries.map((a, idx) => (
                  <tr key={`${a.ts}-${idx}`}>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {fmtTs(a.ts)}
                    </td>
                    <td>
                      {a.user}
                      <div style={{ fontSize: '11.5px', color: 'var(--faint)' }}>{a.role}</div>
                    </td>
                    <td>{a.action}</td>
                    <td className="mono">{a.ref}</td>
                    <td className="muted">{a.detail || ''}</td>
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
