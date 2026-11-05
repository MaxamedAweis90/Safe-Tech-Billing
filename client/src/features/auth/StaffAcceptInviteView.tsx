import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';
import { AuthLayout } from '../../components/auth/AuthLayout';

export interface InvitationMeta {
  email: string;
  role: 'accountant' | 'sales';
  expiresAt: string;
  inviterName?: string;
  companyName?: string;
}

export type TokenErrorType = 'missing' | 'invalid' | 'expired' | 'generic';

/**
 * Step 7.6: Invited Staff Onboarding View & Split-Screen Token Resolution
 *
 * System Invariants:
 * 1. Split-screen layout sharing AuthLayout geometry.
 * 2. Token resolution via GET /api/v1/team/invitation/:token.
 * 3. Locked email and role pill (.chip.c-teal for Accountant, .chip.c-purple for Sales Officer).
 * 4. Required Full Name and segmented E.164 phone number (+252 box on left, placeholder xxxxxxxxx).
 * 5. Atomic activation via POST /api/v1/team/accept-invite.
 * 6. In-place welcome morph celebration card.
 * 7. Clean recovery card for expired or invalid tokens (.chip.c-warn).
 */
export const StaffAcceptInviteView: React.FC = () => {
  const [token, setToken] = useState('');
  const [meta, setMeta] = useState<InvitationMeta | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState<TokenErrorType | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();

  useEffect(() => {
    let foundToken = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
      const hashParams = new URLSearchParams(hashQuery);
      foundToken = urlParams.get('token') || hashParams.get('token') || '';
    }

    if (!foundToken) {
      setErrorType('missing');
      setErrorMsg('No invitation token detected. Please use the complete link from your invitation email.');
      setLoading(false);
      return;
    }

    setToken(foundToken);

    const fetchMetadata = async () => {
      try {
        const res = await api.get(`/team/invitation/${foundToken}`);
        if (res.data?.success) {
          setMeta({
            email: res.data.email,
            role: res.data.role,
            expiresAt: res.data.expiresAt,
            inviterName: res.data.inviterName || 'Your Administrator',
            companyName: res.data.companyName || 'Safe Tech Solutions',
          });
        }
      } catch (err: any) {
        const status = err.response?.status || err.status;
        const msg = err.response?.data?.error || err.message || '';

        if (status === 410 || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('already')) {
          setErrorType('expired');
          setErrorMsg('This invite link is either expired or has already been accepted. Contact your administrator for a new invite.');
        } else if (status === 404) {
          setErrorType('invalid');
          setErrorMsg('This invitation link could not be verified. It may have been revoked or entered incorrectly.');
        } else {
          setErrorType('generic');
          setErrorMsg(msg || 'Unable to resolve invitation. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const cleanDigits = phone.replace(/\D/g, '');

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    if (!cleanDigits || cleanDigits.length < 7 || cleanDigits.length > 9) {
      setErrorMsg('Please enter a valid 7 to 9 digit mobile phone number');
      return;
    }

    const cleanPhone = `+252${cleanDigits}`;

    setSubmitting(true);
    try {
      const res = await api.post('/team/accept-invite', {
        token,
        fullName: fullName.trim(),
        phone: cleanPhone,
      });

      if (res.data?.success && res.data.user) {
        const authToken = res.data.tokens?.accessToken || res.data.token;
        setUser(
          {
            ...res.data.user,
            companyName: meta?.companyName || res.data.user.companyName || 'Safe Tech Solutions',
            onboardingCompleted: true,
            isVerified: true,
          },
          authToken
        );
        setIsSuccess(true);
        toast(`Welcome to ${meta?.companyName || 'the workspace'}, ${res.data.user.fullName}!`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to complete registration. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWorkspace = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/dashboard');
    }
    setActiveTab('dashboard');
  };

  const isAccountant = meta?.role === 'accountant';
  const roleLabel = isAccountant ? 'Accountant' : 'Sales Officer';

  return (
    <AuthLayout
      isSuccess={isSuccess}
      teaserMeta={{
        companyName: meta?.companyName,
        inviterName: meta?.inviterName,
        roleLabel,
        role: meta?.role,
      }}
    >
      <div style={{ width: '100%', maxWidth: isSuccess ? '520px' : '440px', margin: '0 auto', transition: 'max-width 750ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Loading Spinner State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8C9BAE' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #243042',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                margin: '0 auto 18px auto',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#E5EAF2' }}>
              Resolving Invitation Credentials...
            </div>
            <div style={{ fontSize: '12px', color: '#6F7B90', marginTop: '4px' }}>
              Verifying cryptographic team token
            </div>
          </div>
        )}

        {/* Error / Expired Recovery Card (Rule 5) */}
        {!loading && errorType && (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 20px',
              backgroundColor: '#0D121A',
              border: '1px solid #243042',
              borderRadius: '12px',
              animation: 'fadeIn 300ms ease',
            }}
          >
            {/* Warning Chip (.chip.c-warn) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(240, 122, 112, 0.12)',
                border: '1px solid rgba(240, 122, 112, 0.35)',
                color: '#F07A70',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                marginBottom: '18px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F07A70' }} />
              Invitation Invalid or Expired
            </div>

            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(240, 122, 112, 0.12)',
                border: '1px solid rgba(240, 122, 112, 0.3)',
                color: '#F07A70',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#E5EAF2', margin: '0 0 8px 0', letterSpacing: '-0.2px' }}>
              Access Authorization Required
            </h2>

            <p style={{ fontSize: '13px', color: '#8C9BAE', margin: '0 0 24px 0', lineHeight: 1.55 }}>
              {errorMsg}
            </p>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                color: '#E5EAF2',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '11px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              Return to Login
            </button>
          </div>
        )}

        {/* In-Place Welcome Morph Celebration Card (Rule 4) */}
        {!loading && !errorType && isSuccess && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 8px',
              animation: 'fadeIn 500ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Clean Success Emblem */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(92, 197, 140, 0.15)',
                border: '2px solid #5CC58C',
                color: '#5CC58C',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#E5EAF2',
                margin: '0 0 8px 0',
                letterSpacing: '-0.3px',
              }}
            >
              Welcome to the team, {fullName}!
            </h1>

            <p style={{ fontSize: '13.5px', color: '#8C9BAE', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              You are now connected to <b style={{ color: '#E5EAF2' }}>{meta?.companyName || 'Safe Tech Solutions'}</b>.
            </p>

            {/* Provisioned Specs Summary Card */}
            <div
              style={{
                backgroundColor: '#0D121A',
                border: '1px solid #243042',
                borderRadius: '10px',
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#6F7B90' }}>Workspace:</span>
                <span style={{ color: '#E5EAF2', fontWeight: 600 }}>{meta?.companyName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#6F7B90' }}>Assigned Role:</span>
                <span
                  style={{
                    color: isAccountant ? '#2DD4BF' : '#C084FC',
                    fontWeight: 600,
                  }}
                >
                  {roleLabel}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#6F7B90' }}>Staff Email:</span>
                <span style={{ color: '#B9C5DA' }}>{meta?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#6F7B90' }}>Mobile OTP Line:</span>
                <span style={{ color: '#E5EAF2', fontFamily: "'IBM Plex Mono', monospace" }}>+252 {cleanDigits}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenWorkspace}
              style={{
                width: '100%',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 0,
                borderRadius: '8px',
                padding: '13px 28px',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 200ms ease',
              }}
            >
              Open Workspace →
            </button>
          </div>
        )}

        {/* Single-Step Profile Completion Form (Rule 2) */}
        {!loading && !errorType && !isSuccess && meta && (
          <div>
            <div style={{ marginBottom: '22px' }}>
              {/* Locked Role Pill (.chip.c-teal or .chip.c-purple) */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: isAccountant ? 'rgba(45, 212, 191, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                  border: isAccountant ? '1px solid rgba(45, 212, 191, 0.35)' : '1px solid rgba(168, 85, 247, 0.35)',
                  color: isAccountant ? '#2DD4BF' : '#C084FC',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  marginBottom: '14px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isAccountant ? '#2DD4BF' : '#C084FC',
                  }}
                />
                {isAccountant
                  ? 'Accountant — Ledgers, Invoices & Settlement'
                  : 'Sales Officer — Quotations & Customers'}
              </div>

              <h1
                style={{
                  fontSize: '23px',
                  fontWeight: 700,
                  color: '#E5EAF2',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                Complete Staff Profile
              </h1>
              <p style={{ fontSize: '13px', color: '#8C9BAE', margin: 0, lineHeight: 1.45 }}>
                Join <b style={{ color: '#E5EAF2' }}>{meta.companyName}</b> as an authorized{' '}
                <b style={{ color: isAccountant ? '#2DD4BF' : '#C084FC' }}>{roleLabel}</b>.
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(240, 122, 112, 0.12)',
                  border: '1px solid rgba(240, 122, 112, 0.3)',
                  borderRadius: '6px',
                  color: '#F07A70',
                  fontSize: '12.5px',
                  marginBottom: '18px',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Account Mismatch Advisory Banner */}
            {isAuthenticated && user && user.email?.toLowerCase() !== meta.email?.toLowerCase() && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(235, 160, 65, 0.12)',
                  border: '1px solid rgba(235, 160, 65, 0.35)',
                  borderRadius: '8px',
                  marginBottom: '18px',
                  fontSize: '12.5px',
                  color: '#EBA041',
                }}
              >
                <div>
                  <strong>Session Notice:</strong> You are currently signed in as <b>{user.email}</b>. This team invitation is for <b>{meta.email}</b>.
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'transparent',
                    border: '1px solid #EBA041',
                    borderRadius: '6px',
                    color: '#EBA041',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign Out &amp; Accept as {meta.email}
                </button>
              </div>
            )}

            <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Pre-filled & Locked Email Input */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Invited Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={meta.email}
                    readOnly
                    disabled
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#0A0F17',
                      border: '1px solid #243042',
                      color: '#9AA6BA',
                      fontSize: '13.5px',
                      outline: 'none',
                      cursor: 'not-allowed',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#6F7B90',
                      fontSize: '11px',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked
                  </div>
                </div>
              </div>

              {/* Assigned Role Pill Display */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Assigned Team Role
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: isAccountant ? 'rgba(45, 212, 191, 0.08)' : 'rgba(168, 85, 247, 0.08)',
                    border: isAccountant ? '1px solid rgba(45, 212, 191, 0.25)' : '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isAccountant ? '#2DD4BF' : '#C084FC',
                    }}
                  >
                    {isAccountant
                      ? 'Accountant — Ledgers, Invoices & Settlement'
                      : 'Sales Officer — Quotations & Customers'}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#6F7B90',
                      fontSize: '11px',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#F07A70' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Personal Mobile Phone (Segmented: +252 Box + xxxxxxxxx Placeholder) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Personal Mobile Number <span style={{ color: '#F07A70' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 14px',
                      backgroundColor: '#151C27',
                      border: '1px solid #243042',
                      borderRight: '0',
                      borderRadius: '8px 0 0 8px',
                      color: '#B9C5DA',
                      fontSize: '13.5px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 600,
                      userSelect: 'none',
                    }}
                  >
                    +252
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="xxxxxxxxx"
                    value={phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const stripped = raw.startsWith('252') ? raw.slice(3) : raw;
                      setPhone(stripped.slice(0, 9));
                    }}
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      borderRadius: '0 8px 8px 0',
                      backgroundColor: '#0D121A',
                      border: '1px solid #243042',
                      color: '#E5EAF2',
                      fontSize: '13.5px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#6F7B90', marginTop: '4px', display: 'block' }}>
                  Used for dual-rail OTP logins to your staff dashboard.
                </span>
              </div>

              {/* Form Action Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #243042',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 0,
                    color: '#8C9BAE',
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Already registered? <span style={{ color: '#6E9CF0', textDecoration: 'underline' }}>Sign In</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: '8px',
                    padding: '11px 22px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {submitting ? 'Activating Profile...' : 'Join Workspace & Open Dashboard →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default StaffAcceptInviteView;
