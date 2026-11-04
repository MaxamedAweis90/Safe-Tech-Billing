import React, { useState } from 'react';
import { useTeamMembers, useTeamInvitations, useRevokeInvitation } from '../../hooks/useTeam';
import { InviteStaffModal } from './InviteStaffModal';
import { formatDate } from '../../lib/formatters';

export const TeamSettingsView: React.FC = () => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: members = [], isLoading: membersLoading } = useTeamMembers();
  const { data: invitations = [], isLoading: invLoading } = useTeamInvitations();
  const revokeMutation = useRevokeInvitation();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="chip c-blue">Admin</span>;
      case 'accountant':
        return <span className="chip c-teal">Accountant</span>;
      case 'sales':
        return <span className="chip c-purple">Sales Officer</span>;
      default:
        return <span className="chip c-muted">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="chip c-accepted">Active</span>;
      case 'pending_verification':
        return <span className="chip c-partial">Pending Verification</span>;
      case 'suspended':
        return <span className="chip c-rejected">Suspended</span>;
      default:
        return <span className="chip c-draft">{status}</span>;
    }
  };

  return (
    <div>
      {/* Team Header & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#E5EAF2' }}>
            Team &amp; Staff Members
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#9AA6BA' }}>
            Manage staff members, assigned roles, and workspace invitations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="btn primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>+</span>
          <span>Invite Staff</span>
        </button>
      </div>

      {/* 1. Active Team Members Section */}
      <section className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#E5EAF2' }}>
              Active Organization Members
            </h3>
            <span className="count">{members.length}</span>
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {membersLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9AA6BA' }}>
              Loading team directory...
            </div>
          ) : members.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9AA6BA' }}>
              No staff members registered.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line, #243042)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Member Name
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Email Address
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Phone
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Role
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Joined Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id || member._id}
                      style={{ borderBottom: '1px solid #1C2636' }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#E5EAF2' }}>
                        {member.fullName}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9AA6BA' }}>
                        {member.email}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: "'IBM Plex Mono', monospace", color: '#9AA6BA' }}>
                        {member.phone || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getRoleBadge(member.role)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getStatusBadge(member.status)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#9AA6BA', fontSize: '12.5px' }}>
                        {formatDate(member.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 2. Pending Invitations Section */}
      <section className="panel">
        <div className="panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#E5EAF2' }}>
              Pending Staff Invitations
            </h3>
            <span className="count">{invitations.filter((i) => !i.acceptedAt).length}</span>
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {invLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9AA6BA' }}>
              Loading pending invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9AA6BA' }}>
              No pending staff invitations.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line, #243042)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Invited Email
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Role
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Sent Date
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Expiration (7d TTL)
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', color: '#9AA6BA' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => {
                    const isAccepted = Boolean(inv.acceptedAt);
                    const isExpired = inv.isExpired || new Date(inv.expiresAt) < new Date();

                    return (
                      <tr
                        key={inv.id || inv._id}
                        style={{ borderBottom: '1px solid #1C2636' }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#E5EAF2' }}>
                          {inv.email}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {getRoleBadge(inv.role)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9AA6BA', fontSize: '12.5px' }}>
                          {formatDate(inv.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9AA6BA', fontSize: '12.5px' }}>
                          {formatDate(inv.expiresAt)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {isAccepted ? (
                            <span className="chip c-accepted">Accepted</span>
                          ) : isExpired ? (
                            <span className="chip c-expired">Expired</span>
                          ) : (
                            <span className="chip c-sent">Pending</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {!isAccepted && !isExpired && (
                            <button
                              type="button"
                              onClick={() => revokeMutation.mutate(inv.id || inv._id || '')}
                              disabled={revokeMutation.isPending}
                              className="btn danger sm"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Invite Staff Modal */}
      <InviteStaffModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
};
