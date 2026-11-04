import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';
import { AuthLayout } from '../../components/auth/AuthLayout';

interface InvitationMeta {
  email: string;
  role: 'accountant' | 'sales';
  expiresAt: string;
  inviterName?: string;
  companyName?: string;
}

export const StaffAcceptInviteView: React.FC = () => {
  const [token, setToken] = useState('');
  const [meta, setMeta] = useState<InvitationMeta | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();

  useEffect(() => {
    let foundToken = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      foundToken = urlParams.get('token') || hashParams.get('token') || '';
    }

    if (!foundToken) {
      setErrorMsg('No invitation token found. Please use the complete link from your invitation email.');
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
        setErrorMsg(
          err.message ||
            'This invitation link is invalid or has expired. Please request a new invitation from your administrator.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 7 || cleanDigits.length > 9) {
      setErrorMsg('Please enter your 7 to 9 digit mobile phone number');
      return;
    }

    const cleanPhone = `+252${cleanDigits}`;

    setSubmitting(true);
    setErrorMsg('');
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
            onboardingCompleted: true,
          },
          authToken
        );
        setIsSuccess(true);
        toast(`Welcome to ${meta?.companyName || 'the workspace'}, ${res.data.user.fullName}!`);
        setTimeout(() => {
          setActiveTab('dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration. Please try again.');
      setSubmitting(false);
    }
  };

  const roleLabel = meta?.role === 'accountant' ? 'Accountant' : 'Sales Officer';

  return (
    <AuthLayout
      teaserMeta={{
        companyName: meta?.companyName,
        inviterName: meta?.inviterName,
        roleLabel,
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8C9BAE' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #243042',
                borderTopColor: '#6E9CF0',
                borderRadius: '50%',
                margin: '0 auto 16px auto',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>Verifying invitation credentials...</span>
          </div>
        ) : isSuccess ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
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
                boxShadow: '0 0 24px rgba(92, 197, 140, 0.35)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#E5EAF2', margin: '0 0 8px 0' }}>
              Welcome to the Team!
            </h1>
            <p style={{ fontSize: '13.5px', color: '#8C9BAE', margin: 0 }}>
              Your account has been activated with authorized <b style={{ color: '#E5EAF2' }}>{roleLabel}</b> permissions. Opening your workspace...
            </p>
          </div>
        ) : errorMsg && !meta ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(240, 122, 112, 0.15)',
                color: '#F07A70',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#E5EAF2', margin: '0 0 8px 0' }}>
              Invalid Invitation Link
            </h2>
            <p style={{ fontSize: '13px', color: '#8C9BAE', marginBottom: '24px', lineHeight: 1.5 }}>
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 0,
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(110, 156, 240, 0.12)',
                  border: '1px solid rgba(110, 156, 240, 0.25)',
                  color: '#6E9CF0',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  letterSpacing: '0.3px',
                }}
              >
                Staff Onboarding
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#E5EAF2',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                Complete Staff Profile
              </h1>
              <p style={{ fontSize: '13px', color: '#8C9BAE', margin: 0, lineHeight: 1.4 }}>
                Join <b style={{ color: '#E5EAF2' }}>{meta?.companyName}</b> as an authorized{' '}
                <b style={{ color: '#6E9CF0' }}>{roleLabel}</b>.
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

            <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Pre-filled & Locked Email Input */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Invited Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={meta?.email || ''}
                    readOnly
                    disabled
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#0A0F17',
                      border: '1px solid #1E293B',
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked
                  </div>
                </div>
              </div>

              {/* Role Badge Indicator */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Assigned Team Role
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(110, 156, 240, 0.08)',
                    border: '1px solid rgba(110, 156, 240, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#6E9CF0' }}>
                    {roleLabel}
                  </span>
                  <span style={{ fontSize: '11px', color: '#8C9BAE' }}>
                    {meta?.role === 'accountant'
                      ? 'Full Financial Ledgers & Receipts'
                      : 'Quotations & Client Directory'}
                  </span>
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

              {/* Personal Mobile Phone */}
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
                  Enter your 7 to 9 digit mobile phone number for dual-rail OTP logins.
                </span>
              </div>

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
                  Already have an account? <span style={{ color: '#6E9CF0', textDecoration: 'underline' }}>Sign In</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: '8px',
                    padding: '11px 24px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {submitting ? 'Activating...' : 'Join Team & Open Workspace'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

