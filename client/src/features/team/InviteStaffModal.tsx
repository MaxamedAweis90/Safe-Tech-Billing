import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useInviteMember } from '../../hooks/useTeam';
import { useCompanySettings } from '../../hooks/useSettings';

export interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteStaffModal: React.FC<InviteStaffModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'accountant' | 'sales'>('accountant');
  const [errorMsg, setErrorMsg] = useState('');

  const inviteMutation = useInviteMember();
  const { data: companyData } = useCompanySettings();
  const companyName = companyData?.company?.name || 'Safe Tech Solutions';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('A valid staff email address is required');
      return;
    }

    try {
      await inviteMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        role,
        fullName: fullName.trim() || undefined,
      });

      setEmail('');
      setFullName('');
      setRole('accountant');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch staff invitation');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} style={{ padding: '4px 0' }}>
        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(240, 122, 112, 0.12)',
              border: '1px solid #F07A70',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#F07A70',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="inviteStaffEmail"
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#9AA6BA',
              marginBottom: '6px',
            }}
          >
            Staff Email Address *
          </label>
          <input
            id="inviteStaffEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            autoFocus
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              backgroundColor: '#0D121A',
              border: '1px solid #243042',
              borderRadius: '6px',
              color: '#E5EAF2',
              fontSize: '13.5px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="inviteStaffName"
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#9AA6BA',
              marginBottom: '6px',
            }}
          >
            Staff Full Name (Optional)
          </label>
          <input
            id="inviteStaffName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Fadumo Nuur"
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              backgroundColor: '#0D121A',
              border: '1px solid #243042',
              borderRadius: '6px',
              color: '#E5EAF2',
              fontSize: '13.5px',
              outline: 'none',
            }}
          />
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#9AA6BA',
              marginBottom: '8px',
            }}
          >
            Assigned Workspace Role *
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <label
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: role === 'accountant' ? '#18273F' : '#0D121A',
                border: `1.5px solid ${role === 'accountant' ? '#6E9CF0' : '#243042'}`,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="staffRole"
                value="accountant"
                checked={role === 'accountant'}
                onChange={() => setRole('accountant')}
                style={{ accentColor: '#6E9CF0' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E5EAF2' }}>
                  Accountant
                </div>
                <div style={{ fontSize: '11px', color: '#9AA6BA' }}>
                  Financial &amp; Invoices
                </div>
              </div>
            </label>

            <label
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: role === 'sales' ? '#18273F' : '#0D121A',
                border: `1.5px solid ${role === 'sales' ? '#6E9CF0' : '#243042'}`,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="staffRole"
                value="sales"
                checked={role === 'sales'}
                onChange={() => setRole('sales')}
                style={{ accentColor: '#6E9CF0' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E5EAF2' }}>
                  Sales Officer
                </div>
                <div style={{ fontSize: '11px', color: '#9AA6BA' }}>
                  Quotes &amp; Clients
                </div>
              </div>
            </label>
          </div>

          <div style={{ marginTop: '8px', fontSize: '11px', color: '#6F7B90' }}>
            ⚠️ Administrator role is reserved for primary tenant ownership and cannot be invited.
          </div>
        </div>

        {/* Role Capability Explanation Cards */}
        <div
          style={{
            backgroundColor: '#0D121A',
            border: '1px solid #243042',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '20px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#9AA6BA',
          }}
        >
          <div style={{ fontWeight: 600, color: '#E5EAF2', marginBottom: '4px' }}>
            {role === 'accountant' ? 'Accountant Permissions:' : 'Sales Officer Permissions:'}
          </div>
          {role === 'accountant' ? (
            <div>
              &bull; Full authority to issue tax invoices, record customer payments, generate receipts, and inspect financial settlement reports.<br />
              &bull; Read-only access to customer directories and quotations.<br />
              &bull; Settings and immutable audit logs are restricted.
            </div>
          ) : (
            <div>
              &bull; Full authority to create and manage customer profiles, draft and dispatch quotations, and convert accepted quotes to draft invoices.<br />
              &bull; Read-only access to invoice and receipt lists.<br />
              &bull; Payment recording, financial reports, settings, and audit logs are restricted.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn"
            disabled={inviteMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? 'Sending Invitation...' : `Send Invite from ${companyName}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

