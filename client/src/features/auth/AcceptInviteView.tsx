import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';

interface InvitationMeta {
  email: string;
  role: 'accountant' | 'sales';
  expiresAt: string;
  inviterName?: string;
  companyName?: string;
}

export const AcceptInviteView: React.FC = () => {
  const [token, setToken] = useState('');
  const [meta, setMeta] = useState<InvitationMeta | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();

  useEffect(() => {
    // Extract token from search or hash
    let foundToken = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      foundToken = urlParams.get('token') || hashParams.get('token') || '';
    }

    if (!foundToken) {
      setErrorMsg('No invitation token provided. Please use the complete link from your invitation email.');
      setLoading(false);
      return;
    }

    setToken(foundToken);

    // Fetch invitation metadata
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
            'This invitation link is invalid or has expired. Request a new link from your administrator.'
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
        const authToken = res.data.token;
        setUser(res.data.user, authToken);
        toast(`Welcome to the team, ${res.data.user.fullName || res.data.user.email}!`);
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = meta?.role === 'accountant' ? 'Accountant' : 'Sales Officer';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D121A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#E5EAF2',
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#151C27',
          border: '1px solid #243042',
          borderRadius: '8px',
          padding: '32px 28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              backgroundColor: '#0D121A',
              border: '1px solid #243042',
              borderRadius: '8px',
              marginBottom: '12px',
            }}
          >
            <span style={{ color: '#6E9CF0', fontWeight: 800, fontSize: '18px' }}>ST</span>
          </div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
            }}
          >
            JOIN WORKSPACE
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#9AA6BA' }}>
            Complete your onboarding to access team financial records
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#9AA6BA', fontSize: '14px' }}>
            Validating invitation token...
          </div>
        ) : errorMsg && !meta ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: 'rgba(240, 122, 112, 0.12)',
                border: '1px solid #F07A70',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13.5px',
                color: '#F07A70',
                lineHeight: 1.5,
              }}
            >
              {errorMsg}
            </div>
            <p style={{ fontSize: '12.5px', color: '#9AA6BA', marginBottom: '20px' }}>
              Request a new invitation link from your company administrator.
            </p>
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('login');
              }}
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                backgroundColor: '#18273F',
                color: '#6E9CF0',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              Go to Sign In
            </a>
          </div>
        ) : meta ? (
          <div>
            {/* Invitation Banner */}
            <div
              style={{
                backgroundColor: '#0D121A',
                border: '1px solid #243042',
                borderRadius: '6px',
                padding: '14px 16px',
                marginBottom: '22px',
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#B9C5DA',
              }}
            >
              You&apos;ve been invited by <strong style={{ color: '#E5EAF2' }}>{meta.inviterName}</strong> to join{' '}
              <strong style={{ color: '#E5EAF2' }}>{meta.companyName}</strong> as{' '}
              <span
                className={`chip ${meta.role === 'accountant' ? 'c-teal' : 'c-purple'}`}
                style={{ verticalAlign: 'middle', margin: '0 2px' }}
              >
                {roleLabel}
              </span>
            </div>

            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(240, 122, 112, 0.12)',
                  border: '1px solid #F07A70',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  fontSize: '13px',
                  color: '#F07A70',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAccept}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="invitedEmail"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#9AA6BA',
                    marginBottom: '6px',
                  }}
                >
                  Invited Email Address (Locked)
                </label>
                <input
                  id="invitedEmail"
                  type="email"
                  value={meta.email}
                  disabled
                  readOnly
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    backgroundColor: '#0B0F15',
                    border: '1px solid #1C2636',
                    borderRadius: '6px',
                    color: '#6F7B90',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="staffFullName"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#9AA6BA',
                    marginBottom: '6px',
                  }}
                >
                  Your Full Name *
                </label>
                <input
                  id="staffFullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    borderRadius: '6px',
                    color: '#E5EAF2',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="staffPhone"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#9AA6BA',
                    marginBottom: '6px',
                  }}
                >
                  Mobile Phone Number *
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
                      borderRadius: '6px 0 0 6px',
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
                    id="staffPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const stripped = raw.startsWith('252') ? raw.slice(3) : raw;
                      setPhone(stripped.slice(0, 9));
                    }}
                    placeholder="xxxxxxxxx"
                    required
                    style={{
                      flex: 1,
                      height: '40px',
                      padding: '0 12px',
                      backgroundColor: '#0D121A',
                      border: '1px solid #243042',
                      borderRadius: '0 6px 6px 0',
                      color: '#E5EAF2',
                      fontSize: '14px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#6F7B90', marginTop: '4px' }}>
                  Enter your 7 to 9 digit mobile phone number for dual-rail OTP logins.
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#6E9CF0',
                  color: '#0B1424',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 0,
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Setting Up Account...' : 'Accept Invitation & Enter Dashboard'}
              </button>
            </form>

            <div
              style={{
                marginTop: '22px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#6F7B90',
              }}
            >
              Already registered?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('login');
                }}
                style={{ color: '#6E9CF0', textDecoration: 'none' }}
              >
                Sign in to your account
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

